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

// Reserved keys that cannot be used as custom properties
const RESERVED_KEYS = [
  'id', 'tenant_id', 'created_at', 'updated_at', 'deleted_at',
  'name', 'phone', 'email', 'status', 'source', 'custom',
  'consent', 'consent_given', 'consent_timestamp', 'consent_ip',
  'created_by', 'modified_by',
  'password', 'nric', 'ic', 'passport', 'diagnosis',
  'select', 'insert', 'update', 'delete', 'drop', 'table', 'where'
];

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

// Type inference for dynamic properties
function inferType(key: string, value: unknown): string {
  const k = key.toLowerCase();
  const v = String(value).trim();
  
  // Type by key patterns
  if (k.includes('email')) return 'email';
  if (k.includes('phone') || k.includes('mobile') || k.includes('whatsapp')) return 'phone';
  if (k.includes('date') || k.includes('dob') || k.includes('birthday')) return 'date';
  if (k.includes('url') || k.includes('website') || k.includes('link')) return 'url';
  if (k.includes('price') || k.includes('cost') || k.includes('amount') || k.includes('budget')) return 'number';
  
  // Type by value patterns
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  
  if (typeof value === 'string') {
    // Date format (ISO or common formats)
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return 'date';
    // Email format
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email';
    // Malaysian phone format
    if (/^(\+?60|0)1[0-9]{8,9}$/.test(v.replace(/[\s\-()]/g, ''))) return 'phone';
    // URL format
    if (/^https?:\/\/.+/.test(v)) return 'url';
    // Number format
    if (/^-?\d+(\.\d+)?$/.test(v)) return 'number';
    // Boolean format
    if (['true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase())) return 'boolean';
  }
  
  return 'string';
}

// Key sanitization to prevent SQL injection and normalize keys
function sanitizeKey(k: string): string | null {
  const normalized = k
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')          // Collapse multiple underscores
    .replace(/^_|_$/g, '')        // Remove leading/trailing underscores
    .slice(0, 63);                // PostgreSQL identifier length limit
  
  // Reject empty or reserved keys
  if (!normalized || RESERVED_KEYS.includes(normalized)) {
    return null;
  }
  
  return normalized;
}

// Upsert custom property definitions
async function upsertProperties(
  supabase: any,
  tenant_id: string,
  entity: string,
  extras: Record<string, unknown>
): Promise<void> {
  const properties = [];
  
  for (const [rawKey, value] of Object.entries(extras)) {
    const key = sanitizeKey(rawKey);
    if (!key) {
      console.log(`Skipping invalid/reserved key: ${rawKey}`);
      continue;
    }
    
    const dataType = inferType(rawKey, value);
    
    properties.push({
      tenant_id,
      entity,
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Title case
      data_type: dataType,
      is_system: false,
      show_in_list: true,
      show_in_form: true,
      sort_order: 0,
    });
  }
  
  if (properties.length === 0) {
    return;
  }
  
  console.log(`Upserting ${properties.length} custom properties`);
  
  // Upsert properties (ignore duplicates)
  const { error } = await supabase
    .from('property_definitions')
    .upsert(properties, {
      onConflict: 'tenant_id,entity,key',
      ignoreDuplicates: true
    });
  
  if (error) {
    console.error('Failed to upsert properties:', error);
    throw error;
  }
  
  // Update usage counts and last_seen_at for existing properties
  for (const prop of properties) {
    await supabase.rpc('increment_property_usage', {
      p_tenant_id: tenant_id,
      p_entity: entity,
      p_key: prop.key
    }).catch(() => {
      // If RPC doesn't exist, update manually
      supabase
        .from('property_definitions')
        .update({
          usage_count: supabase.raw('usage_count + 1'),
          last_seen_at: new Date().toISOString()
        })
        .eq('tenant_id', tenant_id)
        .eq('entity', entity)
        .eq('key', prop.key)
        .then(() => {});
    });
  }
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

    // 5. Extract required fields and custom fields
    const { name, phone, email, consent, source, ...extras } = body;

    // Check payload size for custom fields (max 64KB)
    const extrasSize = JSON.stringify(extras).length;
    if (extrasSize > 64 * 1024) {
      console.error(`Payload too large: ${extrasSize} bytes`);
      return new Response(
        JSON.stringify({ 
          error: 'Payload too large. Max 64KB of custom fields.',
          size: extrasSize,
          limit: 64 * 1024
        }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check property limit (max 100 custom fields per tenant)
    if (Object.keys(extras).length > 0) {
      const { count: propCount } = await supabase
        .from('property_definitions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('entity', 'lead');

      const currentCount = propCount ?? 0;
      const newPropsCount = Object.keys(extras).length;
      
      if (currentCount + newPropsCount > 100) {
        console.error(`Property limit exceeded: ${currentCount} + ${newPropsCount} > 100`);
        return new Response(
          JSON.stringify({ 
            error: 'Property limit exceeded. Max 100 custom fields per tenant.',
            current_properties: currentCount,
            new_properties: newPropsCount,
            limit: 100
          }),
          { 
            status: 422, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Validate required fields
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

    // 10. Upsert custom properties first
    if (Object.keys(extras).length > 0) {
      try {
        await upsertProperties(supabase, tenant.id, 'lead', extras);
      } catch (error) {
        console.error('Failed to upsert properties:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to process custom fields',
            details: error instanceof Error ? error.message : 'Unknown error'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // 11. Sanitize and prepare custom fields
    const custom: Record<string, unknown> = {};
    for (const [rawKey, value] of Object.entries(extras)) {
      const key = sanitizeKey(rawKey);
      if (key) {
        custom[key] = value;
      }
    }

    console.log(`Custom fields prepared: ${Object.keys(custom).length} fields`);

    // 12. Insert lead with custom fields
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
        custom: custom, // JSONB field with custom properties
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

    // 13. Log webhook event for audit trail
    await supabase.from('webhook_events').insert({
      tenant_id: tenant.id,
      source: source || 'api',
      payload_raw: body,
      lead_id: lead.id,
      status: 'success',
      ip_address: clientIp,
    });

    // 14. Log audit entry
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
        custom_fields_count: Object.keys(custom).length,
      },
    });

    // 15. Return success response
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
          custom_fields: Object.keys(custom),
        },
        custom_properties_created: Object.keys(custom).length,
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
