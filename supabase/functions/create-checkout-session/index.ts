import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id);

    // Get user's profile to find tenant_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = profile.tenant_id;
    console.log("Tenant ID:", tenantId);

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, stripe_customer_id, subscription_status")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error("Tenant not found:", tenantError);
      return new Response(JSON.stringify({ error: "Tenant not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Tenant found:", tenant.name);

    // Create or retrieve Stripe customer
    let customerId = tenant.stripe_customer_id;

    if (!customerId) {
      console.log("Creating new Stripe customer");
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            tenant_id: tenantId,
            tenant_name: tenant.name,
          },
        });

        customerId = customer.id;
        console.log("Stripe customer created:", customerId);

        // Update tenant with stripe_customer_id
        const { error: updateError } = await supabase
          .from("tenants")
          .update({ stripe_customer_id: customerId })
          .eq("id", tenantId);

        if (updateError) {
          console.error("Failed to update tenant with stripe_customer_id:", updateError);
          // Continue anyway, we have the customer ID
        }
      } catch (stripeError) {
        console.error("Failed to create Stripe customer:", stripeError);
        return new Response(JSON.stringify({ error: "Failed to create customer" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.log("Using existing Stripe customer:", customerId);
    }

    // Get the Stripe Price ID from environment
    const priceId = Deno.env.get("STRIPE_PRICE_ID");
    if (!priceId) {
      console.error("STRIPE_PRICE_ID not configured");
      return new Response(JSON.stringify({ error: "Subscription price not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "http://localhost:8080";

    // Determine if a trial should be applied
    const isExistingTrialUser =
      tenant.subscription_status === "trial" ||
      tenant.subscription_status === "trialing" ||
      tenant.subscription_status === "past_due" ||
      tenant.subscription_status === "suspended" ||
      tenant.subscription_status === "cancelled" ||
      tenant.subscription_status === "canceled" ||
      tenant.subscription_status === "active";

    console.log("Is existing trial/paying user:", isExistingTrialUser, "Status:", tenant.subscription_status);

    // Create Checkout Session
    console.log("Creating checkout session for customer:", customerId);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?canceled=true`,
      metadata: {
        tenant_id: tenantId,
      },
      subscription_data: {
        metadata: {
          tenant_id: tenantId,
        },
        // Only give trial to completely new users (inactive status)
        // Skip trial for users upgrading from trial or reactivating
        trial_period_days: isExistingTrialUser ? 0 : 14,
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });

    console.log(
      "Checkout session created:",
      session.id,
      "with trial days:",
      isExistingTrialUser ? 0 : 14,
      "for status:",
      tenant.subscription_status,
    );

    // Return checkout URL
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in create-checkout-session:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
