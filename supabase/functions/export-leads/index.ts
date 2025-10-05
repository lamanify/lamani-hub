import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Helper function to escape CSV values
function escapeCsv(value: string | null | undefined): string {
  if (!value) return '';
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// Helper function to format dates
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper function to get status label
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new_inquiry: 'New Inquiry',
    contact_attempted: 'Contact Attempted',
    contacted: 'Contacted',
    appointment_scheduled: 'Appointment Scheduled',
    consultation_complete: 'Consultation Complete',
    treatment_in_progress: 'Treatment In Progress',
    converted: 'Converted',
    lost: 'Lost',
    inactive: 'Inactive',
    disqualified: 'Disqualified',
  };
  return labels[status] || status;
}

// Helper function to format phone for display
function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  
  // If not normalized format, return as-is
  if (!phone.startsWith('+60')) {
    return phone;
  }
  
  // Pattern: +60 12 345 6789
  const countryCode = phone.slice(0, 3); // +60
  const part1 = phone.slice(3, 5); // 12
  const part2 = phone.slice(5, 8); // 345
  const part3 = phone.slice(8); // 6789
  
  return `${countryCode} ${part1} ${part2} ${part3}`.trim();
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
    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Export requested by user: ${user.id}`);

    // 2. Get user's tenant_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 3. Check user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData) {
      console.error('Role not found:', roleError);
      return new Response(
        JSON.stringify({ error: 'Permission denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Only clinic_admin and super_admin can export
    if (roleData.role !== 'clinic_admin' && roleData.role !== 'super_admin') {
      console.error(`Insufficient permissions: ${roleData.role}`);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admins can export data.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`User has role: ${roleData.role}`);

    // 4. Get export format from query parameter
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'csv';

    // 5. Query all leads for this tenant
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        name,
        phone,
        email,
        source,
        status,
        consent_given,
        consent_timestamp,
        consent_ip,
        created_at,
        updated_at,
        custom,
        created_by,
        modified_by
      `)
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('Failed to fetch leads:', leadsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch leads' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Exporting ${leads.length} leads`);

    // 6. Get creator/modifier names
    const userIds = new Set<string>();
    leads.forEach(lead => {
      if (lead.created_by) userIds.add(lead.created_by);
      if (lead.modified_by) userIds.add(lead.modified_by);
    });

    const userNames: Record<string, string> = {};
    if (userIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', Array.from(userIds));
      
      if (profiles) {
        profiles.forEach(p => {
          userNames[p.user_id] = p.full_name;
        });
      }
    }

    // 7. Get custom property definitions for headers
    const { data: propertyDefs } = await supabase
      .from('property_definitions')
      .select('key, label')
      .eq('tenant_id', profile.tenant_id)
      .eq('entity', 'lead')
      .eq('show_in_list', true)
      .order('sort_order');

    const customKeys = propertyDefs?.map(p => p.key) || [];
    const customLabels = propertyDefs?.reduce((acc, p) => {
      acc[p.key] = p.label;
      return acc;
    }, {} as Record<string, string>) || {};

    // 8. Generate export based on format
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (format === 'json') {
      // JSON export
      const jsonData = {
        exported_at: new Date().toISOString(),
        exported_by: user.email,
        count: leads.length,
        leads: leads.map(lead => ({
          ...lead,
          created_by_name: lead.created_by ? userNames[lead.created_by] || 'Unknown' : 'System',
          modified_by_name: lead.modified_by ? userNames[lead.modified_by] || 'Unknown' : null,
        })),
      };

      // Log audit entry
      await supabase.from('audit_log').insert({
        tenant_id: profile.tenant_id,
        user_id: user.id,
        action: 'leads_exported',
        resource_id: null,
        details: {
          count: leads.length,
          format: 'json',
          timestamp: new Date().toISOString(),
        },
      });

      return new Response(
        JSON.stringify(jsonData, null, 2),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="leads_export_${timestamp}.json"`,
          },
        }
      );
    }

    // CSV export (default)
    const csvRows: string[] = [];

    // CSV header - core fields + custom fields
    const headers = [
      'Name',
      'Phone',
      'Email',
      'Status',
      'Source',
      'Consent Given',
      'Consent Date',
      'Consent IP',
      'Created At',
      'Created By',
      'Last Modified',
      'Modified By',
      ...customKeys.map(key => customLabels[key] || key),
    ];
    csvRows.push(headers.join(','));

    // CSV data rows
    for (const lead of leads) {
      const row = [
        escapeCsv(lead.name),
        escapeCsv(formatPhoneDisplay(lead.phone)),
        escapeCsv(lead.email || ''),
        escapeCsv(getStatusLabel(lead.status)),
        escapeCsv(lead.source || ''),
        lead.consent_given ? 'Yes' : 'No',
        lead.consent_timestamp ? formatDate(lead.consent_timestamp) : '',
        escapeCsv(lead.consent_ip || ''),
        formatDate(lead.created_at),
        escapeCsv(lead.created_by ? userNames[lead.created_by] || 'Unknown' : 'System'),
        lead.updated_at ? formatDate(lead.updated_at) : '',
        escapeCsv(lead.modified_by ? userNames[lead.modified_by] || 'Unknown' : ''),
      ];

      // Add custom field values
      for (const key of customKeys) {
        const value = lead.custom?.[key];
        row.push(escapeCsv(value ? String(value) : ''));
      }

      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // 9. Log audit entry
    await supabase.from('audit_log').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'leads_exported',
      resource_id: null,
      details: {
        count: leads.length,
        format: 'csv',
        custom_fields_included: customKeys.length,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('Export completed successfully');

    // 10. Return CSV response with UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads_export_${timestamp}.csv"`,
      },
    });

  } catch (error) {
    console.error('Unexpected error in export-leads:', error);
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
