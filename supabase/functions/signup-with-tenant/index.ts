import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { clinicName, email, password, termsAccepted } = await req.json();

    console.log('Signup request received:', { clinicName, email, termsAccepted });

    // Validate inputs
    if (!clinicName || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!termsAccepted) {
      return new Response(
        JSON.stringify({ error: 'You must accept the terms and conditions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Step 1: Create tenant
    console.log('Creating tenant:', clinicName);
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({ name: clinicName, subscription_status: 'trial' })
      .select()
      .single();

    if (tenantError) {
      console.error('Tenant creation error:', tenantError);
      throw new Error(`Failed to create tenant: ${tenantError.message}`);
    }

    console.log('Tenant created:', tenant.id);

    try {
      // Step 2: Create auth user with tenant_id in metadata
      console.log('Creating auth user with tenant_id:', tenant.id);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for MVP
        user_metadata: {
          tenant_id: tenant.id,
          full_name: clinicName,
          role: 'clinic_admin'
        }
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        // Rollback: Delete tenant if user creation fails
        await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
        
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          throw new Error('This email is already registered');
        }
        throw new Error(`Failed to create user: ${authError.message}`);
      }

      console.log('Auth user created:', authData.user.id);

      // Step 3: Log consent in audit_log
      const { error: auditError } = await supabaseAdmin.from('audit_log').insert({
        tenant_id: tenant.id,
        user_id: authData.user.id,
        action: 'signup_consent_accepted',
        details: {
          terms_version: '1.0',
          timestamp: new Date().toISOString(),
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        }
      });

      if (auditError) {
        console.error('Audit log error:', auditError);
        // Non-critical, don't rollback
      }

      console.log('Signup successful for:', email);

      // Return success
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      // If anything fails after tenant creation, clean up
      console.error('Error after tenant creation, rolling back:', error);
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
      throw error;
    }

  } catch (error: any) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Signup failed. Please try again.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
