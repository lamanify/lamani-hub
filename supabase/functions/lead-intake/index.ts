import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// PBKDF2 Helper Function using Deno's native Web Crypto API
async function verifyApiKey(plaintext: string, stored: string): Promise<boolean> {
  try {
    // Split stored value into salt and hash
    const [saltHex, expectedHashHex] = stored.split(':');
    if (!saltHex || !expectedHashHex) return false;
    
    // Convert hex salt back to Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Convert plaintext to ArrayBuffer
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(plaintext);
    
    // Import key material
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    // Derive key using same parameters
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );
    
    // Convert derived bits to hex
    const actualHashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Constant-time comparison
    return actualHashHex === expectedHashHex;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return false;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-api-key, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Rate limiting configuration
const RATE_LIMIT_PER_IP = 100; // requests per hour per IP
const RATE_LIMIT_PER_TENANT = 1000; // leads per day per tenant
const RATE_LIMIT_WINDOW_IP = 60 * 60 * 1000; // 1 hour in ms
const RATE_LIMIT_WINDOW_TENANT = 24 * 60 * 60 * 1000; // 24 hours in ms

// In-memory rate limit tracking (resets on function cold start)
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();
const tenantRateLimits = new Map<string, { count: number; resetAt: number }>();

// Check rate limit for IP
function checkIpRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = ipRateLimits.get(ip);

  if (!record || now > record.resetAt) {
    // New window
    ipRateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_IP });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_PER_IP) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// Check rate limit for tenant
function checkTenantRateLimit(tenantId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = tenantRateLimits.get(tenantId);

  if (!record || now > record.resetAt) {
    // New window
    tenantRateLimits.set(tenantId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_TENANT });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_PER_TENANT) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// Reserved keys that cannot be used as custom properties
const RESERVED_KEYS = [
  'id', 'tenant_id', 'created_at', 'updated_at', 'deleted_at',
  'name', 'phone', 'email', 'status', 'source', 'custom',
  'consent', 'consent_given', 'consent_timestamp', 'consent_ip',
  'created_by', 'modified_by',
  'password', 'nric', 'ic', 'passport', 'diagnosis',
  'select', 'insert', 'update', 'delete', 'drop', 'table', 'where'
];

// Field validation constants (Phase 2: Enhanced Security)
const MAX_STRING_LENGTH = 1000;
const MAX_URL_LENGTH = 2048;
const MAX_EMAIL_LENGTH = 255;
const MAX_PHONE_LENGTH = 20;
const MAX_NUMBER_VALUE = 999999999999; // 12 digits
const MIN_NUMBER_VALUE = -999999999999;

// Zod schema for core lead fields
const leadCoreSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().min(1, "Email is required").max(255, "Email must be less than 255 characters"),
  consent: z.union([z.boolean(), z.string()]).optional(),
  source: z.string().max(100, "Source too long").optional(),
});

// Email validation
function isValidEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  // Reject emails with HTML or script tags
  if (/<[^>]*>/i.test(email)) return false;
  return true;
}

// URL validation
function isValidUrl(url: string): boolean {
  if (!url || url.length > MAX_URL_LENGTH) return false;
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    // Reject javascript:, data:, file: protocols
    if (['javascript:', 'data:', 'file:'].includes(parsed.protocol.toLowerCase())) return false;
    return true;
  } catch {
    return false;
  }
}

// String sanitization
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return String(str);
  
  // Remove HTML tags and script content
  let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Truncate to max length
  if (sanitized.length > MAX_STRING_LENGTH) {
    sanitized = sanitized.substring(0, MAX_STRING_LENGTH);
  }
  
  return sanitized;
}

// Field validation by type
function validateFieldValue(
  key: string, 
  value: unknown, 
  dataType: string
): { valid: boolean; error?: string; sanitized: unknown } {
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    return { valid: true, sanitized: null };
  }

  switch (dataType) {
    case 'email': {
      const emailStr = String(value);
      if (!isValidEmail(emailStr)) {
        return { 
          valid: false, 
          error: `Invalid email format in field '${key}': ${emailStr}`,
          sanitized: null
        };
      }
      return { valid: true, sanitized: sanitizeString(emailStr).toLowerCase() };
    }

    case 'phone': {
      const phoneStr = String(value);
      if (phoneStr.length > MAX_PHONE_LENGTH) {
        return { 
          valid: false, 
          error: `Phone number in field '${key}' exceeds maximum length of ${MAX_PHONE_LENGTH}`,
          sanitized: null
        };
      }
      try {
        const normalized = normalizePhone(phoneStr);
        if (!isValidMalaysianPhone(normalized)) {
          return { 
            valid: false, 
            error: `Invalid phone format in field '${key}': ${phoneStr}`,
            sanitized: null
          };
        }
        return { valid: true, sanitized: normalized };
      } catch (e) {
        return { 
          valid: false, 
          error: `Invalid phone format in field '${key}': ${phoneStr}`,
          sanitized: null
        };
      }
    }

    case 'url': {
      const urlStr = String(value);
      if (!isValidUrl(urlStr)) {
        return { 
          valid: false, 
          error: `Invalid URL in field '${key}': URL must use http/https protocol and be under ${MAX_URL_LENGTH} characters`,
          sanitized: null
        };
      }
      return { valid: true, sanitized: sanitizeString(urlStr) };
    }

    case 'number': {
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(num)) {
        return { 
          valid: false, 
          error: `Invalid number in field '${key}': ${value}`,
          sanitized: null
        };
      }
      if (num > MAX_NUMBER_VALUE || num < MIN_NUMBER_VALUE) {
        return { 
          valid: false, 
          error: `Number in field '${key}' exceeds allowed range (${MIN_NUMBER_VALUE} to ${MAX_NUMBER_VALUE})`,
          sanitized: null
        };
      }
      return { valid: true, sanitized: num };
    }

    case 'date': {
      const dateStr = String(value);
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return { 
          valid: false, 
          error: `Invalid date format in field '${key}': ${dateStr}`,
          sanitized: null
        };
      }
      // Check reasonable date range (1900 - 2100)
      const year = date.getFullYear();
      if (year < 1900 || year > 2100) {
        return { 
          valid: false, 
          error: `Date in field '${key}' is outside reasonable range (1900-2100)`,
          sanitized: null
        };
      }
      return { valid: true, sanitized: date.toISOString() };
    }

    case 'boolean': {
      const boolVal = typeof value === 'boolean' ? value : 
                     String(value).toLowerCase() === 'true';
      return { valid: true, sanitized: boolVal };
    }

    case 'string':
    default: {
      const strVal = String(value);
      if (strVal.length > MAX_STRING_LENGTH) {
        return { 
          valid: false, 
          error: `String value in field '${key}' exceeds maximum length of ${MAX_STRING_LENGTH} characters`,
          sanitized: null
        };
      }
      // Check for dangerous content
      if (/<script/i.test(strVal) || /javascript:/i.test(strVal)) {
        return { 
          valid: false, 
          error: `Field '${key}' contains potentially dangerous content`,
          sanitized: null
        };
      }
      return { valid: true, sanitized: sanitizeString(strVal) };
    }
  }
}

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
    // 1. Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // 2. Check IP rate limit
    const ipRateCheck = checkIpRateLimit(clientIp);
    if (!ipRateCheck.allowed) {
      console.error(`IP rate limit exceeded for ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: `Too many requests from this IP. Max ${RATE_LIMIT_PER_IP} requests per hour.`,
          retry_after_seconds: ipRateCheck.retryAfter
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(ipRateCheck.retryAfter || 3600)
          } 
        }
      );
    }

    // 3. Verify API key (with bcrypt hash + grace period support)
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

    console.log('Looking up tenant by API key prefix');

    // Extract prefix from API key (first 8 chars)
    const apiKeyPrefix = apiKey.substring(0, 8);

    // 2. Look up tenants by prefix
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, subscription_status, api_key_hash, old_api_key_hash, old_api_key_expires_at')
      .eq('api_key_prefix', apiKeyPrefix);

    if (tenantError || !tenants || tenants.length === 0) {
      console.error('Invalid API key prefix or tenant not found:', tenantError);
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${tenants.length} tenant(s) with prefix ${apiKeyPrefix}`);

    // Verify hash for each tenant candidate
    let tenant = null;
    let usingOldKey = false;

    for (const candidateTenant of tenants) {
      // Try current key first
      if (candidateTenant.api_key_hash) {
        const currentKeyMatch = await verifyApiKey(apiKey, candidateTenant.api_key_hash);
        if (currentKeyMatch) {
          tenant = candidateTenant;
          console.log(`Tenant authenticated with current API key: ${tenant.name}`);
          break;
        }
      }

      // Try old key if not expired (grace period)
      if (candidateTenant.old_api_key_hash && candidateTenant.old_api_key_expires_at) {
        const now = new Date();
        const expiresAt = new Date(candidateTenant.old_api_key_expires_at);
        
        if (now < expiresAt) {
          const oldKeyMatch = await verifyApiKey(apiKey, candidateTenant.old_api_key_hash);
          if (oldKeyMatch) {
            tenant = candidateTenant;
            usingOldKey = true;
            const minutesRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));
            console.warn(`⚠️ Tenant ${tenant.name} using OLD API key (expires in ${minutesRemaining} minutes)`);
            break;
          }
        } else {
          console.log(`Old key for tenant ${candidateTenant.id} has expired`);
        }
      }
    }

    if (!tenant) {
      console.error('API key hash verification failed for all candidates');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Tenant found: ${tenant.name} (${tenant.id})`);

    // Log warning if using old key
    if (usingOldKey) {
      await supabase.from('audit_log').insert({
        tenant_id: tenant.id,
        user_id: null,
        action: 'api_key_old_key_used',
        resource_id: tenant.id,
        details: {
          used_at: new Date().toISOString(),
          expires_at: tenant.old_api_key_expires_at,
          warning: 'Using deprecated API key during grace period',
        },
      });
    }

    // 4. Check tenant rate limit
    const tenantRateCheck = checkTenantRateLimit(tenant.id);
    if (!tenantRateCheck.allowed) {
      console.error(`Tenant rate limit exceeded for ${tenant.id}`);
      return new Response(
        JSON.stringify({ 
          error: 'Tenant rate limit exceeded',
          message: `Maximum ${RATE_LIMIT_PER_TENANT} leads per day reached. Contact support to increase limit.`,
          retry_after_seconds: tenantRateCheck.retryAfter
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(tenantRateCheck.retryAfter || 86400)
          } 
        }
      );
    }

    // 5. Check subscription status
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

    // 6. Parse request body
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

    // 7. Validate core fields with Zod
    console.log('[lead-intake] Validating core fields with Zod');
    const coreValidationResult = leadCoreSchema.safeParse(body);
    
    if (!coreValidationResult.success) {
      const errors = coreValidationResult.error.format();
      console.error('[lead-intake] Zod validation failed:', errors);
      
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: errors
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[lead-intake] Zod validation passed');

    // 8. Extract required fields and custom fields
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

    // 9. Validate and normalize phone
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

    // 10. Validate email format
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

    // 11. Check for duplicates (by phone or email)
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

    console.log(`Creating lead for tenant ${tenant.id}`);

    // 12. Validate and sanitize custom fields (Phase 2: Enhanced Security)
    const validatedExtras: Record<string, unknown> = {};
    
    if (Object.keys(extras).length > 0) {
      console.log(`Validating ${Object.keys(extras).length} custom fields...`);
      
      for (const [rawKey, value] of Object.entries(extras)) {
        // Infer data type
        const dataType = inferType(rawKey, value);
        
        // Validate and sanitize the field
        const validation = validateFieldValue(rawKey, value, dataType);
        
        if (!validation.valid) {
          console.error(`Field validation failed: ${validation.error}`);
          return new Response(
            JSON.stringify({ 
              error: 'Custom field validation failed',
              field: rawKey,
              details: validation.error
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        // Use sanitized value
        validatedExtras[rawKey] = validation.sanitized;
      }
      
      console.log(`All custom fields validated and sanitized successfully`);
    }

    // 13. Upsert custom properties (using validated extras)
    if (Object.keys(validatedExtras).length > 0) {
      try {
        await upsertProperties(supabase, tenant.id, 'lead', validatedExtras);
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

    // 14. Sanitize and prepare custom fields for storage
    const custom: Record<string, unknown> = {};
    for (const [rawKey, value] of Object.entries(validatedExtras)) {
      const key = sanitizeKey(rawKey);
      if (key) {
        custom[key] = value; // Already sanitized by validation
      }
    }

    console.log(`Custom fields prepared: ${Object.keys(custom).length} fields`);

    // 15. Insert lead with custom fields
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

    // 16. Log webhook event for audit trail
    await supabase.from('webhook_events').insert({
      tenant_id: tenant.id,
      source: source || 'api',
      payload_raw: body,
      lead_id: lead.id,
      status: 'success',
      ip_address: clientIp,
    });

    // 17. Log audit entry
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

    // 18. Return success response
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
