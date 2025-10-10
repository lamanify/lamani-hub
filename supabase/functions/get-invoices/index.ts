import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching invoices for user: ${user.id}`);

    // 2. Get tenant_id from user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantId = profile.tenant_id;

    // 3. Get tenant's stripe_customer_id
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('stripe_customer_id, name')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found:', tenantError);
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tenant.stripe_customer_id) {
      console.log('No Stripe customer ID - returning empty invoice list');
      return new Response(
        JSON.stringify({ invoices: [] }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Fetching invoices for customer: ${tenant.stripe_customer_id}`);

    // 4. Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: tenant.stripe_customer_id,
      limit: 10,
    });

    console.log(`Retrieved ${invoices.data.length} invoices`);

    // 5. Format invoice data
    const formattedInvoices = invoices.data.map((invoice: Stripe.Invoice) => ({
      id: invoice.id,
      number: invoice.number,
      date: invoice.created,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    }));

    // 6. Log audit entry
    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: 'invoices_viewed',
      resource_id: tenantId,
      details: {
        invoice_count: formattedInvoices.length,
      },
    });

    // 7. Return invoice data
    return new Response(
      JSON.stringify({ invoices: formattedInvoices }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get invoices error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch invoices',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
