import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { parse } from 'https://deno.land/std@0.224.0/csv/parse.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phone normalization utilities (inline for edge function)
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  if (cleaned.startsWith('+60')) {
    return cleaned;
  }
  
  if (cleaned.startsWith('60')) {
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('0')) {
    return '+60' + cleaned.substring(1);
  }
  
  return '+60' + cleaned;
}

function isValidMalaysianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const patterns = [
    /^\+601[0-9]{8,9}$/,
    /^601[0-9]{8,9}$/,
    /^01[0-9]{8,9}$/
  ];
  return patterns.some(pattern => pattern.test(cleaned));
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get user's tenant_id and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check permissions (via user_roles table)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || (userRole.role !== 'clinic_admin' && userRole.role !== 'super_admin')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Read file content
    const fileContent = await file.text();

    // 6. Parse CSV
    const rows = parse(fileContent, {
      skipFirstRow: true,
      columns: ['name', 'phone', 'email', 'source', 'consent']
    }) as Array<{ name?: string; phone?: string; email?: string; source?: string; consent?: string }>;

    // 7. Validate and process each row
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; reason: string }>,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because: +1 for header, +1 for 0-index

      try {
        // Validate required fields
        const name = row.name?.trim();
        const phone = row.phone?.trim();
        const email = row.email?.trim();

        if (!name || !phone || !email) {
          results.errors.push({
            row: rowNumber,
            reason: 'Missing required fields (name, phone, or email)',
          });
          results.skipped++;
          continue;
        }

        // Validate name length
        if (name.length < 2 || name.length > 100) {
          results.errors.push({
            row: rowNumber,
            reason: 'Name must be between 2 and 100 characters',
          });
          results.skipped++;
          continue;
        }

        // Normalize and validate phone
        let normalizedPhone: string;
        try {
          normalizedPhone = normalizePhone(phone);
          if (!isValidMalaysianPhone(normalizedPhone)) {
            throw new Error('Invalid format');
          }
        } catch (error) {
          results.errors.push({
            row: rowNumber,
            reason: `Invalid phone number: ${phone}`,
          });
          results.skipped++;
          continue;
        }

        // Validate email format and length
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || email.length > 255) {
          results.errors.push({
            row: rowNumber,
            reason: `Invalid email format: ${email}`,
          });
          results.skipped++;
          continue;
        }

        // Check for duplicates in database
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('tenant_id', profile.tenant_id)
          .or(`phone.eq.${normalizedPhone},email.eq.${email.toLowerCase()}`)
          .maybeSingle();

        if (existingLead) {
          results.errors.push({
            row: rowNumber,
            reason: `Duplicate: Lead with phone ${phone} or email ${email} already exists`,
          });
          results.skipped++;
          continue;
        }

        // Insert lead
        const { error: insertError } = await supabase
          .from('leads')
          .insert({
            tenant_id: profile.tenant_id,
            name: name,
            phone: normalizedPhone,
            email: email.toLowerCase(),
            source: row.source?.trim() || 'import',
            status: 'new_inquiry',
            consent_given: row.consent?.toLowerCase() === 'true' || row.consent?.toLowerCase() === 'yes',
            created_by: user.id,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          results.errors.push({
            row: rowNumber,
            reason: `Database error: ${insertError.message}`,
          });
          results.skipped++;
          continue;
        }

        results.imported++;
      } catch (error: any) {
        console.error('Row processing error:', error);
        results.errors.push({
          row: rowNumber,
          reason: error.message || 'Unknown error',
        });
        results.skipped++;
      }
    }

    // 8. Log audit entry
    await supabase.from('audit_log').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'leads_import',
      resource_id: null,
      details: {
        filename: file.name,
        total_rows: rows.length,
        imported: results.imported,
        skipped: results.skipped,
        errors: results.errors.length,
      },
    });

    // 9. Return results
    return new Response(
      JSON.stringify(results),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Import failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
