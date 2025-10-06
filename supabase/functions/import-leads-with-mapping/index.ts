import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FieldMapping {
  [csvColumn: string]: string
}

interface DefaultValues {
  source: string
  status: string
  consent_given: boolean
}

interface ImportRequest {
  fieldMapping: FieldMapping
  rows: string[][]
  defaultValues: DefaultValues
  duplicateHandling: 'skip' | 'update' | 'create'
  headers: string[]
}

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  duplicates: number
  errors: Array<{ row: number; reason: string; data?: any }>
}

// Normalize Malaysian phone numbers
function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle different Malaysian formats
  if (cleaned.startsWith('60')) {
    // Already has country code
    return '+' + cleaned
  } else if (cleaned.startsWith('0')) {
    // Remove leading 0 and add country code
    return '+60' + cleaned.substring(1)
  } else if (cleaned.length >= 8 && cleaned.length <= 10) {
    // Assume it's a Malaysian number without country code or leading 0
    return '+60' + cleaned
  }
  
  return '+' + cleaned // For international numbers
}

// Validate email format
function isValidEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number
function isValidPhone(phone: string): boolean {
  if (!phone) return false
  const normalized = normalizePhoneNumber(phone)
  // Malaysian mobile numbers should be +60 followed by 9-11 digits
  const phoneRegex = /^\+60[0-9]{8,11}$/
  return phoneRegex.test(normalized)
}

// Parse boolean values
function parseBoolean(value: string): boolean {
  if (!value) return false
  const lower = value.toLowerCase().trim()
  return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'y'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile and tenant
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id, full_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user permissions
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !roleData || !['clinic_admin', 'super_admin', 'clinic_user'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const {
      fieldMapping,
      rows,
      defaultValues,
      duplicateHandling,
      headers
    }: ImportRequest = await req.json()

    console.log(`Import requested by ${user.email} for tenant ${profile.tenant_id}`)
    console.log(`Processing ${rows.length} rows with mapping:`, fieldMapping)

    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      duplicates: 0,
      errors: []
    }

    // Get existing leads for duplicate detection
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('phone, email, id')
      .eq('tenant_id', profile.tenant_id)

    const existingPhones = new Set(existingLeads?.map(lead => lead.phone) || [])
    const existingEmails = new Set(existingLeads?.map(lead => lead.email).filter(Boolean) || [])

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because we have header row and 0-based indexing

      try {
        // Skip empty rows
        if (!row.some(cell => cell?.trim())) {
          result.skipped++
          continue
        }

        // Map CSV data to CRM fields
        const leadData: any = {
          tenant_id: profile.tenant_id,
          created_by: user.id,
          source: defaultValues.source,
          status: defaultValues.status,
          consent_given: defaultValues.consent_given,
          consent_timestamp: defaultValues.consent_given ? new Date().toISOString() : null,
          consent_ip: defaultValues.consent_given ? req.headers.get('x-forwarded-for') || 'import' : null
        }

        // Apply field mapping
        for (const [csvColumn, crmField] of Object.entries(fieldMapping)) {
          if (!crmField) continue

          const csvIndex = headers.indexOf(csvColumn)
          if (csvIndex === -1) continue

          let value = row[csvIndex]?.trim() || ''
          if (!value) continue

          switch (crmField) {
            case 'name':
              leadData.name = value
              break
            case 'phone':
              const normalizedPhone = normalizePhoneNumber(value)
              if (!isValidPhone(normalizedPhone)) {
                result.errors.push({
                  row: rowNumber,
                  reason: `Invalid phone number: ${value}`,
                  data: { original_phone: value, normalized_phone: normalizedPhone }
                })
                continue
              }
              leadData.phone = normalizedPhone
              break
            case 'email':
              if (value && !isValidEmail(value)) {
                result.errors.push({
                  row: rowNumber,
                  reason: `Invalid email address: ${value}`
                })
                continue
              }
              leadData.email = value || null
              break
            case 'source':
              leadData.source = value
              break
            case 'status':
              const validStatuses = ['new_inquiry', 'contact_attempted', 'contacted', 'appointment_scheduled', 
                                   'consultation_complete', 'treatment_in_progress', 'inactive', 'disqualified']
              if (validStatuses.includes(value.toLowerCase().replace(' ', '_'))) {
                leadData.status = value.toLowerCase().replace(' ', '_')
              }
              break
            case 'consent_given':
              leadData.consent_given = parseBoolean(value)
              if (leadData.consent_given) {
                leadData.consent_timestamp = new Date().toISOString()
                leadData.consent_ip = req.headers.get('x-forwarded-for') || 'import'
              }
              break
            case 'notes':
              if (!leadData.custom) leadData.custom = {}
              leadData.custom.notes = value
              break
          }
        }

        // Validate required fields
        if (!leadData.name) {
          result.errors.push({
            row: rowNumber,
            reason: 'Name is required'
          })
          continue
        }

        if (!leadData.phone) {
          result.errors.push({
            row: rowNumber,
            reason: 'Phone is required'
          })
          continue
        }

        // Check for duplicates
        const isDuplicatePhone = existingPhones.has(leadData.phone)
        const isDuplicateEmail = leadData.email && existingEmails.has(leadData.email)

        if (isDuplicatePhone || isDuplicateEmail) {
          result.duplicates++

          if (duplicateHandling === 'skip') {
            result.skipped++
            continue
          } else if (duplicateHandling === 'update') {
            // Find existing lead to update
            const { data: existingLead } = await supabase
              .from('leads')
              .select('id')
              .eq('tenant_id', profile.tenant_id)
              .or(`phone.eq.${leadData.phone}${leadData.email ? `,email.eq.${leadData.email}` : ''}`)
              .single()

            if (existingLead) {
              const updateData = { ...leadData }
              delete updateData.tenant_id
              updateData.modified_by = user.id
              updateData.updated_at = new Date().toISOString()

              const { error: updateError } = await supabase
                .from('leads')
                .update(updateData)
                .eq('id', existingLead.id)

              if (updateError) {
                result.errors.push({
                  row: rowNumber,
                  reason: `Failed to update: ${updateError.message}`
                })
              } else {
                result.imported++
              }
              continue
            }
          }
          // For 'create' option, fall through to create anyway
        }

        // Insert new lead
        const { error: insertError } = await supabase
          .from('leads')
          .insert(leadData)

        if (insertError) {
          result.errors.push({
            row: rowNumber,
            reason: `Failed to insert: ${insertError.message}`,
            data: leadData
          })
        } else {
          result.imported++
          // Track for further duplicate detection
          existingPhones.add(leadData.phone)
          if (leadData.email) existingEmails.add(leadData.email)
        }

      } catch (error) {
        result.errors.push({
          row: rowNumber,
          reason: `Processing error: ${error.message}`
        })
      }
    }

    // Log audit entry
    try {
      await supabase.from('audit_log').insert({
        tenant_id: profile.tenant_id,
        user_id: user.id,
        action: 'leads_imported',
        resource_type: 'lead',
        resource_id: null,
        details: {
          total_rows: rows.length,
          imported: result.imported,
          skipped: result.skipped,
          duplicates: result.duplicates,
          errors: result.errors.length,
          field_mapping: fieldMapping,
          default_values: defaultValues,
          duplicate_handling: duplicateHandling,
          imported_by: profile.full_name || user.email
        }
      })
    } catch (logError) {
      console.error('Failed to log audit entry:', logError)
    }

    console.log(`Import completed: ${result.imported} imported, ${result.errors.length} errors`)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
