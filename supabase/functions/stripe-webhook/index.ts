import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'stripe-signature, content-type',
      },
    });
  }

  try {
    // 1. Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No stripe-signature header found');
      return new Response('No signature', { status: 400 });
    }

    // 2. Verify webhook signature
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type} (${event.id})`);

    // 3. Check idempotency (prevent duplicate processing)
    const { data: existingEvent } = await supabase
      .from('processed_stripe_events')
      .select('id')
      .eq('event_id', event.id)
      .single();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response('OK (already processed)', { status: 200 });
    }

    // 4. Mark event as processed
    await supabase.from('processed_stripe_events').insert({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    });

    // 5. Handle different event types
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error handling ${event.type}:`, error);
      // Still return 200 to prevent Stripe retry spam
      // Log error for manual review
    }

    // 6. Always return 200 (even if event not handled)
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('OK', { status: 200 }); // Always return 200 to Stripe
  }
});

// === EVENT HANDLERS ===

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);

  // Get tenant_id from metadata
  const tenantId = session.metadata?.tenant_id;

  if (!tenantId) {
    console.error('No tenant_id in session metadata');
    return;
  }

  // Update tenant subscription status
  const { error } = await supabase
    .from('tenants')
    .update({
      subscription_status: 'active',
      stripe_subscription_id: session.subscription as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);

  if (error) {
    console.error('Failed to update tenant subscription:', error);
    throw error;
  }

  // Log audit entry
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    user_id: null, // System action
    action: 'subscription_activated',
    resource_id: tenantId,
    details: {
      subscription_id: session.subscription,
      session_id: session.id,
    },
  });

  console.log(`Tenant ${tenantId} subscription activated`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);

  const customerId = invoice.customer as string;

  // Get tenant by stripe_customer_id
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !tenant) {
    console.error('Tenant not found for customer:', customerId);
    return;
  }

  // Get subscription end date from invoice
  const periodEnd = invoice.lines.data[0]?.period?.end 
    ? new Date(invoice.lines.data[0].period.end * 1000).toISOString() 
    : null;

  // Ensure subscription is active and update period end
  await supabase
    .from('tenants')
    .update({
      subscription_status: 'active',
      subscription_current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  // Log audit entry
  await supabase.from('audit_log').insert({
    tenant_id: tenant.id,
    user_id: null,
    action: 'payment_succeeded',
    resource_id: tenant.id,
    details: {
      invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      period_end: periodEnd,
    },
  });

  console.log(`Payment succeeded for tenant ${tenant.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);

  const customerId = invoice.customer as string;

  // Get tenant by stripe_customer_id
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !tenant) {
    console.error('Tenant not found for customer:', customerId);
    return;
  }

  // Update status to past_due (trigger will set grace period)
  await supabase
    .from('tenants')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  // Log audit entry
  await supabase.from('audit_log').insert({
    tenant_id: tenant.id,
    user_id: null,
    action: 'payment_failed',
    resource_id: tenant.id,
    details: {
      invoice_id: invoice.id,
      amount_due: invoice.amount_due,
      attempt_count: invoice.attempt_count,
    },
  });

  console.log(`Payment failed for tenant ${tenant.id}, marked as past_due`);
  // TODO: Send email notification to clinic admin
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  const customerId = subscription.customer as string;

  // Get tenant by stripe_customer_id
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !tenant) {
    console.error('Tenant not found for customer:', customerId);
    return;
  }

  // Update status to cancelled
  await supabase
    .from('tenants')
    .update({
      subscription_status: 'cancelled',
      stripe_subscription_id: null,
      subscription_current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  // Log audit entry
  await supabase.from('audit_log').insert({
    tenant_id: tenant.id,
    user_id: null,
    action: 'subscription_cancelled',
    resource_id: tenant.id,
    details: {
      subscription_id: subscription.id,
      cancelled_at: subscription.canceled_at,
    },
  });

  console.log(`Subscription cancelled for tenant ${tenant.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  const customerId = subscription.customer as string;

  // Get tenant by stripe_customer_id
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !tenant) {
    console.error('Tenant not found for customer:', customerId);
    return;
  }

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    trialing: 'trial',
  };

  const newStatus = statusMap[subscription.status] || 'active';

  // Get subscription period end
  const periodEnd = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toISOString() 
    : null;

  // Update tenant status
  await supabase
    .from('tenants')
    .update({
      subscription_status: newStatus,
      subscription_current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  // Log audit entry
  await supabase.from('audit_log').insert({
    tenant_id: tenant.id,
    user_id: null,
    action: 'subscription_updated',
    resource_id: tenant.id,
    details: {
      subscription_id: subscription.id,
      status: subscription.status,
      period_end: periodEnd,
    },
  });

  console.log(`Subscription updated for tenant ${tenant.id}: ${subscription.status}`);
}
