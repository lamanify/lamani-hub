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

    // Verify user is super admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isSuperAdmin = roles?.some(r => r.role === 'super_admin');

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only super admins can run API key migration' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`API key migration started by super admin: ${user.id}`);

    // Fetch all tenants with plaintext api_key
    const { data: tenants, error: fetchError } = await supabase
      .from('tenants')
      .select('id, name, api_key, api_key_hash')
      .not('api_key', 'is', null);

    if (fetchError) {
      console.error('Failed to fetch tenants:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tenants', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tenants?.length || 0} tenants to migrate`);

    const results = {
      total: tenants?.length || 0,
      migrated: 0,
      skipped: 0,
      errors: [] as any[],
    };

    // Migrate each tenant
    for (const tenant of tenants || []) {
      try {
        // Skip if already has hash
        if (tenant.api_key_hash) {
          console.log(`Skipping tenant ${tenant.id} - already has hash`);
          results.skipped++;
          continue;
        }

        // Skip if no plaintext key
        if (!tenant.api_key) {
          console.log(`Skipping tenant ${tenant.id} - no api_key`);
          results.skipped++;
          continue;
        }

        console.log(`Migrating tenant ${tenant.id}: ${tenant.name}`);

        // Hash the plaintext API key using bcrypt (salt rounds: 10)
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(tenant.api_key, salt);
        const prefix = tenant.api_key.substring(0, 8);

        // Update tenant with hash and prefix
        const { error: updateError } = await supabase
          .from('tenants')
          .update({
            api_key_hash: hash,
            api_key_prefix: prefix,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenant.id);

        if (updateError) {
          console.error(`Failed to migrate tenant ${tenant.id}:`, updateError);
          results.errors.push({
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            error: updateError.message,
          });
          continue;
        }

        // Log to audit trail
        await supabase.from('audit_log').insert({
          tenant_id: tenant.id,
          user_id: user.id,
          action: 'api_key_migrated_to_hash',
          resource_id: tenant.id,
          details: {
            migrated_at: new Date().toISOString(),
            migrated_by: user.email,
            key_prefix: prefix,
          },
        });

        results.migrated++;
        console.log(`Successfully migrated tenant ${tenant.id}`);

      } catch (error) {
        console.error(`Error processing tenant ${tenant.id}:`, error);
        results.errors.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('Migration complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'API key migration completed',
        results,
        next_steps: [
          'Verify all tenants have api_key_hash populated',
          'Test lead-intake API with hashed keys',
          'After confirming all working, drop api_key column in Phase 2E',
        ],
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in migrate-api-keys:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
