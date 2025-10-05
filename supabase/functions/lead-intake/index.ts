import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-api-key, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Phone normalization utilities
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Malaysian phone formats
  if (cleaned.startsWith('60')) {
    // Already has country code
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Local format (0XX-XXXX XXXX) -> +60XX-XXXX XXXX
    return '+60' + cleaned.substring(1);
  } else if (cleaned.length >= 9) {
    // Assume it's missing the leading 0
    return '+60' + cleaned;
  }
  
  throw new Error('Invalid phone number format');
}

function isValidMalaysianPhone(phone: string): boolean {
  // Should be in format +60XXXXXXXXX (11-12 digits total)
  const regex = /^\+60\d{9,10}$/;
  return regex.test(phone);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // 1. Verify API key
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
      console.error('Missing API key in request');
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Looking up tenant by API key');

    // 2. Look up tenant by API key
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, subscription_status')
      .eq('api_key', apiKey)
      .single();

    if (tenantError || !tenant) {
      console.error('Invalid API key or tenant not found:', tenantError);
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Tenant found: ${tenant.name} (${tenant.id})`);

    // 3. Check subscription status
    if (tenant.subscription_status !== 'active' && tenant.subscription_status !== 'trial') {
      console.error(`Subscription inactive for tenant ${tenant.id}: ${tenant.subscription_status}`);
      return new Response(
        JSON.stringify({ 
          error: 'Subscription inactive. Please update billing.',
          subscription_status: tenant.subscription_status
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 4. Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Invalid JSON body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 5. Validate required fields
    const { name, phone, email, consent, source } = body;

    if (!name || !phone || !email) {
      console.error('Missing required fields:', { name: !!name, phone: !!phone, email: !!email });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: ['name', 'phone', 'email'],
          received: { name: !!name, phone: !!phone, email: !!email }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate name length
    if (name.trim().length < 2 || name.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: 'Name must be between 2 and 100 characters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 6. Validate and normalize phone
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(phone);
      if (!isValidMalaysianPhone(normalizedPhone)) {
        throw new Error('Invalid Malaysian phone number');
      }
      console.log(`Phone normalized: ${phone} -> ${normalizedPhone}`);
    } catch (error) {
      console.error('Phone validation failed:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid phone number format. Must be Malaysian phone (e.g., 012-345 6789 or +60123456789)',
          received: phone
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 7. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.toLowerCase().trim();
    
    if (!emailRegex.test(trimmedEmail)) {
      console.error('Invalid email format:', email);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid email format',
          received: email
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (trimmedEmail.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Email must be less than 255 characters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 8. Check for duplicates (by phone or email)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('tenant_id', tenant.id)
      .or(`phone.eq.${normalizedPhone},email.eq.${trimmedEmail}`)
      .maybeSingle();

    if (existingLead) {
      console.log(`Duplicate lead found: ${existingLead.id}`);
      return new Response(
        JSON.stringify({
          error: 'Duplicate lead',
          message: 'A lead with this phone or email already exists',
          lead_id: existingLead.id,
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 9. Get client IP for consent logging
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    console.log(`Creating lead for tenant ${tenant.id}`);

    // 10. Insert lead
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenant.id,
        name: name.trim(),
        phone: normalizedPhone,
        email: trimmedEmail,
        source: source || 'api',
        status: 'new_inquiry',
        consent_given: consent === true || consent === 'true',
        consent_timestamp: (consent === true || consent === 'true') ? new Date().toISOString() : null,
        consent_ip: (consent === true || consent === 'true') ? clientIp : null,
        created_by: null, // API-created leads have no user
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert lead:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create lead',
          details: insertError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Lead created successfully: ${lead.id}`);

    // 11. Log audit entry
    await supabase.from('audit_log').insert({
      tenant_id: tenant.id,
      user_id: null, // System/API action
      action: 'lead_created',
      resource_id: lead.id,
      details: {
        source: source || 'api',
        method: 'POST /api/lead-intake',
        ip: clientIp,
        api_key_used: true,
      },
    });

    // 12. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        message: 'Lead created successfully',
        data: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          status: lead.status,
          source: lead.source,
        }
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Unexpected error in lead-intake:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
