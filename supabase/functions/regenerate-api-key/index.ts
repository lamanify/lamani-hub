import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`API key regeneration requested by user: ${user.id}`);

    // Get user's tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'clinic_admin' || r.role === 'super_admin');

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admins can regenerate API keys.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current tenant data (including current hash for grace period)
    const { data: currentTenant } = await supabase
      .from('tenants')
      .select('api_key_hash, api_key_prefix, old_api_key_hash')
      .eq('id', profile.tenant_id)
      .single();

    const oldKeyPrefix = currentTenant?.api_key_prefix || 'unknown';

    // Generate secure random API key using Web Crypto API
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const newApiKey = `lh_${Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    console.log(`Regenerating API key for tenant: ${profile.tenant_id}`);
    console.log(`Old key prefix: ${oldKeyPrefix}`);

    // Hash the new API key using bcrypt (salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    const newApiKeyHash = await bcrypt.hash(newApiKey, salt);
    const newApiKeyPrefix = newApiKey.substring(0, 8);

    console.log(`New API key hashed with bcrypt (cost factor: 10)`);

    // Grace period: move current hash to old_api_key_hash
    const gracePeriodMinutes = 60;
    const gracePeriodExpiresAt = new Date(Date.now() + gracePeriodMinutes * 60 * 1000).toISOString();

    // Update tenant with new hashed API key and grace period
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        api_key_hash: newApiKeyHash,
        api_key_prefix: newApiKeyPrefix,
        old_api_key_hash: currentTenant?.api_key_hash || null, // Store previous hash
        old_api_key_expires_at: currentTenant?.api_key_hash ? gracePeriodExpiresAt : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.tenant_id);

    if (updateError) {
      console.error('Failed to update API key:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to regenerate API key', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log to audit trail (prefix only, never log full keys or hashes)
    await supabase.from('audit_log').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'api_key_regenerated',
      resource_id: profile.tenant_id,
      details: {
        old_key_prefix: oldKeyPrefix,
        new_key_prefix: newApiKeyPrefix,
        regenerated_at: new Date().toISOString(),
        user_email: user.email,
        grace_period_minutes: gracePeriodMinutes,
        grace_period_expires_at: currentTenant?.api_key_hash ? gracePeriodExpiresAt : null,
      },
    });

    console.log('API key regenerated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'API key regenerated successfully',
        api_key: newApiKey, // Only time the plaintext key is returned
        api_key_prefix: newApiKeyPrefix,
        old_key_prefix: oldKeyPrefix,
        grace_period_minutes: gracePeriodMinutes,
        grace_period_expires_at: currentTenant?.api_key_hash ? gracePeriodExpiresAt : null,
        warning: currentTenant?.api_key_hash 
          ? `Your old API key will remain valid for ${gracePeriodMinutes} minutes. Update your integrations before ${gracePeriodExpiresAt}.`
          : 'This is your first hashed API key. Store it securely - you will not be able to retrieve it again.',
        security_note: 'API keys are now hashed with bcrypt for enhanced security. Only the hash is stored in the database.',
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
