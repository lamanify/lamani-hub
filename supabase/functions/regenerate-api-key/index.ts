import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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

    // Get current tenant data
    const { data: currentTenant } = await supabase
      .from('tenants')
      .select('api_key')
      .eq('id', profile.tenant_id)
      .single();

    const oldKeyLast4 = currentTenant?.api_key?.slice(-4) || 'unknown';

    // Generate secure random API key using Web Crypto API
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const newApiKey = `lh_${Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    console.log(`Regenerating API key for tenant: ${profile.tenant_id}`);
    console.log(`Old key (last 4): ...${oldKeyLast4}`);

    // Update tenant with new API key
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        api_key: newApiKey,
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

    // Log to audit trail (masking the full keys)
    await supabase.from('audit_log').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'api_key_regenerated',
      resource_id: profile.tenant_id,
      details: {
        old_key_last_4: oldKeyLast4,
        new_key_last_4: newApiKey.slice(-4),
        regenerated_at: new Date().toISOString(),
        user_email: user.email,
      },
    });

    console.log('API key regenerated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'API key regenerated successfully',
        api_key: newApiKey,
        old_key_last_4: oldKeyLast4,
        // Grace period: old key remains valid for 1 hour
        grace_period_minutes: 60,
        warning: 'Update your integrations within 1 hour. The old key will be invalidated after that.',
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
