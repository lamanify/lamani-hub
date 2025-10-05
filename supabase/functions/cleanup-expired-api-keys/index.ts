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
    console.log('Starting cleanup of expired API keys...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find tenants with expired old API keys
    const { data: expiredTenants, error: fetchError } = await supabase
      .from('tenants')
      .select('id, name, old_api_key_expires_at')
      .not('old_api_key_hash', 'is', null)
      .not('old_api_key_expires_at', 'is', null)
      .lt('old_api_key_expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('Failed to fetch expired keys:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expired keys', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredTenants?.length || 0} tenants with expired old API keys`);

    if (!expiredTenants || expiredTenants.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No expired API keys to clean up',
          cleaned_count: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up expired keys
    const tenantIds = expiredTenants.map(t => t.id);
    
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        old_api_key_hash: null,
        old_api_key_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', tenantIds);

    if (updateError) {
      console.error('Failed to clean up expired keys:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to clean up expired keys', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log cleanup action
    const auditEntries = expiredTenants.map(tenant => ({
      tenant_id: tenant.id,
      user_id: null, // System action
      action: 'api_key_grace_period_expired',
      resource_id: tenant.id,
      details: {
        expired_at: tenant.old_api_key_expires_at,
        cleaned_at: new Date().toISOString(),
        tenant_name: tenant.name,
      },
    }));

    await supabase.from('audit_log').insert(auditEntries);

    console.log(`Successfully cleaned up ${expiredTenants.length} expired API keys`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Expired API keys cleaned up successfully',
        cleaned_count: expiredTenants.length,
        tenant_ids: tenantIds,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in cleanup-expired-api-keys:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
