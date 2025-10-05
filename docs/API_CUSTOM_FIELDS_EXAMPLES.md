# Custom Fields API Examples

## Overview

This document provides real-world examples of using LamaniHub's automatic custom field creation feature.

---

## Example 1: Basic Treatment Inquiry

**Scenario:** Patient interested in specific treatment with budget information.

**API Request:**
```bash
curl -X POST https://your-app.lovable.app/api/lead-intake \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "Sarah Chen",
    "phone": "0123456789",
    "email": "sarah@example.com",
    "consent": true,
    "source": "website_contact_form",
    "treatment_interest": "Botox",
    "treatment_area": "Forehead lines",
    "budget": "5000",
    "preferred_date": "2025-12-20",
    "has_consulted_before": false
  }'
```

**What Gets Created:**

| Field | Type | Storage | Inference |
|-------|------|---------|-----------|
| `name` | Core field | `leads.name` | N/A |
| `phone` | Core field | `leads.phone` | N/A |
| `email` | Core field | `leads.email` | N/A |
| `consent` | Core field | `leads.consent_given` | N/A |
| `source` | Core field | `leads.source` | N/A |
| `treatment_interest` | String property | `leads.custom.treatment_interest` | Default type |
| `treatment_area` | String property | `leads.custom.treatment_area` | Default type |
| `budget` | Number property | `leads.custom.budget` | Numeric value + "budget" keyword |
| `preferred_date` | Date property | `leads.custom.preferred_date` | ISO date format + "date" keyword |
| `has_consulted_before` | Boolean property | `leads.custom.has_consulted_before` | Boolean value |

**Response:**
```json
{
  "success": true,
  "lead_id": "abc-123-def",
  "message": "Lead created successfully",
  "data": {
    "name": "Sarah Chen",
    "phone": "+60123456789",
    "email": "sarah@example.com",
    "status": "new_inquiry",
    "source": "website_contact_form",
    "custom_fields": [
      "treatment_interest",
      "treatment_area",
      "budget",
      "preferred_date",
      "has_consulted_before"
    ]
  },
  "custom_properties_created": 5
}
```

---

## Example 2: Marketing Campaign Tracking

**Scenario:** Lead from Facebook ad campaign with full attribution data.

**API Request:**
```json
{
  "name": "Ahmad Abdullah",
  "phone": "0167891234",
  "email": "ahmad@example.com",
  "consent": true,
  "source": "facebook_ads",
  "campaign_id": "FB2025Q4_BOTOX",
  "campaign_name": "End Year Botox Promo",
  "ad_set_name": "Women 35-50 KL",
  "ad_creative": "Botox Before After",
  "landing_page_url": "https://clinic.com/promo/botox-2025",
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "botox_q4",
  "conversion_value": "299",
  "first_touch_date": "2025-11-25"
}
```

**Auto-Created Properties:**
- `campaign_id` → String
- `campaign_name` → String
- `ad_set_name` → String
- `ad_creative` → String
- `landing_page_url` → URL (inferred from https://)
- `utm_source` → String
- `utm_medium` → String
- `utm_campaign` → String
- `conversion_value` → Number (inferred from numeric value)
- `first_touch_date` → Date (inferred from date format)

**Use Case:** Track campaign performance in LamaniHub by filtering leads by `campaign_id` or `utm_campaign`.

---

## Example 3: WordPress Contact Form 7

**Scenario:** Clinic website with Contact Form 7 integration.

**WordPress PHP Code:**
```php
add_action('wpcf7_mail_sent', 'send_cf7_to_lamanihub');

function send_cf7_to_lamanihub($contact_form) {
  $submission = WPCF7_Submission::get_instance();
  
  if ($submission) {
    $data = $submission->get_posted_data();
    
    $api_data = array(
      // Core fields
      'name' => sanitize_text_field($data['your-name']),
      'phone' => sanitize_text_field($data['your-phone']),
      'email' => sanitize_email($data['your-email']),
      'consent' => isset($data['privacy-consent']) ? true : false,
      'source' => 'website_contact_form',
      
      // Custom fields - automatically created
      'treatment_interest' => sanitize_text_field($data['treatment']),
      'message' => sanitize_textarea_field($data['your-message']),
      'preferred_contact_method' => sanitize_text_field($data['contact-method']),
      'best_time_to_call' => sanitize_text_field($data['call-time']),
    );
    
    $response = wp_remote_post('https://your-app.lovable.app/api/lead-intake', array(
      'headers' => array(
        'Content-Type' => 'application/json',
        'x-api-key' => get_option('lamanihub_api_key')
      ),
      'body' => json_encode($api_data)
    ));
  }
}
```

---

## Example 4: n8n Workflow Integration

**Scenario:** Automated lead capture from Facebook Lead Ads via n8n.

**n8n Workflow:**
```
[Facebook Lead Ads Trigger] 
  ↓
[Transform Data Node]
  ↓
[HTTP Request to LamaniHub]
```

**HTTP Request Configuration:**
```json
{
  "method": "POST",
  "url": "https://your-app.lovable.app/api/lead-intake",
  "headers": {
    "x-api-key": "{{$credentials.apiKey}}",
    "Content-Type": "application/json"
  },
  "body": {
    "name": "{{$json.full_name}}",
    "phone": "{{$json.phone_number}}",
    "email": "{{$json.email}}",
    "consent": true,
    "source": "facebook_lead_ads",
    
    // Custom fields from Facebook form
    "age_range": "{{$json.age}}",
    "treatment_interest": "{{$json.treatment}}",
    "budget_range": "{{$json.budget}}",
    "preferred_location": "{{$json.location}}",
    "facebook_id": "{{$json.id}}",
    "form_id": "{{$json.form_id}}",
    "campaign_id": "{{$json.campaign_id}}"
  }
}
```

---

## Example 5: Zapier Integration

**Scenario:** Connect Google Forms to LamaniHub.

**Zapier Configuration:**

**Trigger:** Google Forms - New Response  
**Action:** Webhooks by Zapier - POST

**POST Data:**
```json
{
  "name": "{{First Name}} {{Last Name}}",
  "phone": "{{Phone Number}}",
  "email": "{{Email}}",
  "consent": true,
  "source": "google_forms",
  
  // Custom fields from Google Form
  "age": "{{Age}}",
  "gender": "{{Gender}}",
  "treatment_interest": "{{Treatment Interest}}",
  "current_skin_concern": "{{Skin Concern}}",
  "budget": "{{Budget}}",
  "preferred_appointment_time": "{{Preferred Time}}",
  "how_did_you_hear": "{{Referral Source}}",
  "google_form_timestamp": "{{Timestamp}}"
}
```

---

## Example 6: Complex Custom Fields

**Scenario:** Detailed patient intake with medical and preference information.

**API Request:**
```json
{
  "name": "Dr. Lim Wei Ming",
  "phone": "0123456789",
  "email": "lim@example.com",
  "consent": true,
  "source": "referral",
  
  // Treatment details
  "treatment_category": "Anti-Aging",
  "primary_concern": "Fine lines and wrinkles",
  "secondary_concern": "Skin texture",
  "treatment_urgency": "Within 2 weeks",
  
  // Budget and insurance
  "budget_range": "5000-10000",
  "has_insurance": true,
  "insurance_provider": "AIA",
  "willing_to_pay_cash": true,
  
  // Medical history (basic, non-diagnosis)
  "previous_treatments": "Facial, Chemical Peel",
  "allergies": "None",
  "medications": "None",
  "skin_type": "Combination",
  
  // Preferences
  "preferred_doctor": "Dr. Sarah",
  "preferred_location": "KLCC Branch",
  "preferred_day_of_week": "Saturday",
  "preferred_time_slot": "Morning",
  "language_preference": "English, Mandarin",
  
  // Referral tracking
  "referred_by": "Dr. Ahmad Clinic",
  "referral_code": "REF2025Q4",
  "referral_incentive_claimed": false,
  
  // Marketing
  "heard_from": "Friend referral",
  "newsletter_subscribe": true,
  "promotions_opt_in": true,
  
  // Metadata
  "device_type": "Mobile",
  "browser": "Chrome",
  "submission_timestamp": "2025-11-25T14:30:00Z"
}
```

**Result:** 27 custom properties automatically created with intelligent type inference.

---

## Type Inference Examples

### Example: Smart Date Detection

**Input:**
```json
{
  "name": "Patient",
  "email": "patient@example.com",
  "phone": "0123456789",
  "appointment_date": "2025-12-20",
  "dob": "1985-03-15",
  "last_treatment": "2024-06-10"
}
```

**Result:**
- `appointment_date` → **Date** (contains "date")
- `dob` → **Date** (contains "dob")
- `last_treatment` → **Date** (ISO date format detected)

### Example: Phone Number Detection

**Input:**
```json
{
  "name": "Patient",
  "email": "patient@example.com",
  "phone": "0123456789",
  "mobile_number": "0167891234",
  "whatsapp_contact": "+60123456789",
  "emergency_phone": "0198765432"
}
```

**Result:**
- `phone` → Core field
- `mobile_number` → **Phone** (contains "mobile")
- `whatsapp_contact` → **Phone** (contains "whatsapp")
- `emergency_phone` → **Phone** (contains "phone")

### Example: URL Detection

**Input:**
```json
{
  "name": "Patient",
  "email": "patient@example.com",
  "phone": "0123456789",
  "facebook_profile": "https://facebook.com/patient",
  "instagram_url": "https://instagram.com/patient",
  "portfolio_website": "https://patient-portfolio.com"
}
```

**Result:**
- `facebook_profile` → **URL** (https:// prefix)
- `instagram_url` → **URL** (contains "url" + https://)
- `portfolio_website` → **URL** (contains "website" + https://)

---

## Error Handling Examples

### Example: Property Limit Exceeded

**Scenario:** Tenant already has 98 custom fields, trying to add 5 more.

**Request:**
```json
{
  "name": "Patient",
  "email": "patient@example.com",
  "phone": "0123456789",
  "field_99": "value",
  "field_100": "value",
  "field_101": "value",
  "field_102": "value",
  "field_103": "value"
}
```

**Response (422):**
```json
{
  "error": "Property limit exceeded. Max 100 custom fields per tenant.",
  "current_properties": 98,
  "new_properties": 5,
  "limit": 100
}
```

### Example: Reserved Key Blocked

**Request:**
```json
{
  "name": "Patient",
  "email": "patient@example.com",
  "phone": "0123456789",
  "id": "custom-id",
  "password": "secret123",
  "select": "some value"
}
```

**Result:**
- `id`, `password`, `select` → Silently skipped (reserved keys)
- Lead still created with core fields
- No error thrown

---

## Best Practices

### ✅ Good Examples

**Consistent Naming:**
```json
{
  "treatment_interest": "Botox",
  "treatment_area": "Forehead",
  "treatment_budget": "5000",
  "treatment_urgency": "High"
}
```

**Clear Data Types:**
```json
{
  "budget": 5000,              // Number (not string)
  "preferred_date": "2025-12-20",  // Date format
  "is_new_patient": true,      // Boolean (not "yes")
  "email_secondary": "user@example.com"  // Email format
}
```

### ❌ Bad Examples

**Inconsistent Naming:**
```json
{
  "TreatmentInterest": "Botox",    // Mixed case
  "treatment-area": "Forehead",    // Different separator
  "Budget_Treatment": "5000",      // Inconsistent order
  "urgency": "High"                // Inconsistent prefix
}
```

**Poor Data Types:**
```json
{
  "budget": "RM 5000",            // String (should be 5000)
  "preferred_date": "20/12/2025", // Non-ISO format
  "is_new_patient": "yes",        // String (should be true)
  "email": "invalid-email"        // Invalid format
}
```

---

## Testing Checklist

Before going live with custom fields integration:

- [ ] Test with all your custom field names
- [ ] Verify type inference is correct
- [ ] Check Fields Manager UI shows fields correctly
- [ ] Test with duplicate field names
- [ ] Test with reserved field names
- [ ] Verify data appears in lead detail view
- [ ] Test filtering by custom fields
- [ ] Check CSV export includes custom fields
- [ ] Test with maximum payload size
- [ ] Verify audit logging works
- [ ] Test webhook event logging
- [ ] Confirm field usage tracking

---

## Support

For questions about custom fields:
- **Email:** support@lamanihub.com
- **Documentation:** https://docs.lamanihub.com
- **API Reference:** `/docs/API_INTEGRATION.md`
