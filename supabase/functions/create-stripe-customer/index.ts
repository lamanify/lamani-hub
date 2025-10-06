import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not found')
      return new Response(
        JSON.stringify({ error: 'Stripe configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-08-16',
    })

    // Parse request body
    const { email, name, tenant_id } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Creating Stripe customer for ${email} (tenant: ${tenant_id})`)

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: email,
      name: name || email.split('@')[0],
      metadata: {
        tenant_id: tenant_id || '',
        source: 'lamani-hub-signup',
        created_at: new Date().toISOString(),
      },
    })

    console.log(`Successfully created Stripe customer: ${customer.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        customer_id: customer.id,
        email: customer.email,
        created: customer.created,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    
    // Handle different types of Stripe errors
    let errorMessage = 'Failed to create Stripe customer'
    let statusCode = 500

    if (error.type === 'StripeCardError') {
      errorMessage = error.message
      statusCode = 400
    } else if (error.type === 'StripeRateLimitError') {
      errorMessage = 'Too many requests, please try again later'
      statusCode = 429
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Invalid request to Stripe'
      statusCode = 400
    } else if (error.type === 'StripeAPIError') {
      errorMessage = 'Stripe API error, please try again'
      statusCode = 502
    } else if (error.type === 'StripeConnectionError') {
      errorMessage = 'Network error connecting to Stripe'
      statusCode = 503
    } else if (error.type === 'StripeAuthenticationError') {
      errorMessage = 'Stripe authentication failed'
      statusCode = 401
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        error_type: error.type || 'unknown',
        error_code: error.code || null,
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
