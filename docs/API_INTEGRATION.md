# LamaniHub API Integration Guide

## Lead Intake API

The Lead Intake API allows external systems (WordPress forms, n8n workflows, Zapier, etc.) to create leads programmatically in LamaniHub with **automatic custom field detection**.

### Key Features

✅ **Dynamic Custom Fields** - Send any additional fields beyond the core fields (name, phone, email) and they'll automatically become custom properties  
✅ **Smart Type Inference** - Automatically detects field types (email, phone, date, url, number, boolean, string)  
✅ **Duplicate Prevention** - Checks for existing leads by phone or email  
✅ **PDPA Compliance** - Tracks consent with IP and timestamp  
✅ **Webhook Audit Trail** - All API requests logged for compliance  

### Endpoint

```
POST https://your-app.lovable.app/api/lead-intake
```

### Authentication

Use API key authentication via the `x-api-key` header:

```
x-api-key: your_api_key_here
```

**Finding Your API Key:**
1. Log in to LamaniHub
2. Go to Settings
3. Your API key is displayed in the API Integration section

**Security Warning:** Never expose your API key in client-side code or public repositories.

### Request Format

**Headers:**
```
Content-Type: application/json
x-api-key: your_api_key_here
```

**Body (JSON):**
```json
{
  "name": "Ahmad bin Abdullah",
  "phone": "012-345 6789",
  "email": "ahmad@example.com",
  "consent": true,
  "source": "website_form",
  "treatment_interest": "Botox",
  "budget": "5000",
  "preferred_date": "2025-12-15",
  "referral_source": "Facebook"
}
```

**Core Fields (Required):**
- `name` (string, 2-100 characters) - Patient/lead name
- `phone` (string, Malaysian format) - Contact phone number
- `email` (string, valid email) - Contact email address

**Core Fields (Optional):**
- `consent` (boolean, default: false) - PDPA consent status
- `source` (string, default: 'api') - Lead source identifier (e.g., 'website_form', 'facebook', 'google_ads')

**Custom Fields (Optional):**
Any additional fields beyond the core fields will automatically become custom properties. Examples:
- `treatment_interest` → String field
- `budget` → Number field (auto-detected from numeric value)
- `preferred_date` → Date field (auto-detected from date format)
- `referral_source` → String field
- `is_returning_patient` → Boolean field

**Custom Fields Features:**
- ✅ Automatically created on first use
- ✅ Smart type inference (7 types: string, number, boolean, date, email, phone, url)
- ✅ Visible in LamaniHub Fields Manager (`/settings/fields`)
- ✅ Searchable and filterable in lead list
- ✅ Max 100 custom fields per tenant
- ✅ Max 64KB payload size for custom fields

### Phone Number Format

The API accepts Malaysian phone numbers in any of these formats:
- `012-345 6789`
- `0123456789`
- `+60123456789`
- `60123456789`

All numbers are automatically normalized to E.164 format: `+60XXXXXXXXX`

### Response Format

**Success (201 Created):**
```json
{
  "success": true,
  "lead_id": "uuid-here",
  "message": "Lead created successfully",
  "data": {
    "name": "Ahmad bin Abdullah",
    "phone": "+60123456789",
    "email": "ahmad@example.com",
    "status": "new_inquiry",
    "source": "website_form",
    "custom_fields": ["treatment_interest", "budget", "preferred_date", "referral_source"]
  },
  "custom_properties_created": 4
}
```

**Error Responses:**

**400 Bad Request - Missing Required Fields:**
```json
{
  "error": "Missing required fields",
  "required": ["name", "phone", "email"],
  "received": {
    "name": true,
    "phone": false,
    "email": true
  }
}
```

**400 Bad Request - Invalid Phone:**
```json
{
  "error": "Invalid phone number format. Must be Malaysian phone (e.g., 012-345 6789 or +60123456789)",
  "received": "invalid-phone"
}
```

**400 Bad Request - Invalid Email:**
```json
{
  "error": "Invalid email format",
  "received": "invalid-email"
}
```

**401 Unauthorized - Missing API Key:**
```json
{
  "error": "Missing API key"
}
```

**401 Unauthorized - Invalid API Key:**
```json
{
  "error": "Invalid API key"
}
```

**403 Forbidden - Inactive Subscription:**
```json
{
  "error": "Subscription inactive. Please update billing.",
  "subscription_status": "past_due"
}
```

**409 Conflict - Duplicate Lead:**
```json
{
  "error": "Duplicate lead",
  "message": "A lead with this phone or email already exists",
  "lead_id": "existing-lead-uuid"
}
```

**413 Payload Too Large:**
```json
{
  "error": "Payload too large. Max 64KB of custom fields.",
  "size": 70000,
  "limit": 65536
}
```

**422 Unprocessable Entity - Property Limit:**
```json
{
  "error": "Property limit exceeded. Max 100 custom fields per tenant.",
  "current_properties": 95,
  "new_properties": 10,
  "limit": 100
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create lead",
  "details": "Error message"
}
```

---

## Integration Examples

### cURL

```bash
curl -X POST https://your-app.lovable.app/api/lead-intake \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "Test Patient",
    "phone": "0123456789",
    "email": "test@example.com",
    "consent": true,
    "source": "website_form",
    "treatment_interest": "Laser Treatment",
    "budget": "8000",
    "preferred_date": "2025-12-20"
  }'
```

### JavaScript / Node.js

```javascript
const createLead = async (leadData) => {
  const response = await fetch('https://your-app.lovable.app/api/lead-intake', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_API_KEY'
    },
    body: JSON.stringify({
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email,
      consent: leadData.consent,
      source: 'website',
      // Custom fields - automatically detected and created
      treatment_interest: leadData.treatment,
      budget: leadData.budget,
      preferred_location: leadData.location,
      notes: leadData.notes
    })
  });

  const result = await response.json();
  
  if (response.ok) {
    console.log('Lead created:', result.lead_id);
    console.log('Custom fields created:', result.custom_properties_created);
  } else {
    console.error('Error:', result.error);
  }
  
  return result;
};
```

### WordPress / PHP

```php
<?php
/**
 * Send form data to LamaniHub CRM
 */
function send_to_lamanihub($form_data) {
  $api_url = 'https://your-app.lovable.app/api/lead-intake';
  $api_key = get_option('lamanihub_api_key'); // Store API key in WordPress settings
  
  $data = array(
    'name' => sanitize_text_field($form_data['name']),
    'phone' => sanitize_text_field($form_data['phone']),
    'email' => sanitize_email($form_data['email']),
    'consent' => $form_data['consent'] === 'yes',
    'source' => 'wordpress_form'
  );
  
  $response = wp_remote_post($api_url, array(
    'headers' => array(
      'Content-Type' => 'application/json',
      'x-api-key' => $api_key
    ),
    'body' => json_encode($data),
    'timeout' => 15
  ));
  
  if (is_wp_error($response)) {
    error_log('LamaniHub API error: ' . $response->get_error_message());
    return array('success' => false, 'message' => 'Connection error');
  }
  
  $status_code = wp_remote_retrieve_response_code($response);
  $body = json_decode(wp_remote_retrieve_body($response), true);
  
  if ($status_code === 201) {
    return array('success' => true, 'lead_id' => $body['lead_id']);
  } else {
    error_log('LamaniHub API error: ' . $body['error']);
    return array('success' => false, 'message' => $body['error']);
  }
}

// Usage with Contact Form 7
add_action('wpcf7_before_send_mail', 'cf7_to_lamanihub');

function cf7_to_lamanihub($contact_form) {
  $submission = WPCF7_Submission::get_instance();
  
  if ($submission) {
    $data = $submission->get_posted_data();
    
    $lead_data = array(
      'name' => $data['your-name'],
      'phone' => $data['your-phone'],
      'email' => $data['your-email'],
      'consent' => isset($data['consent']) ? 'yes' : 'no'
    );
    
    send_to_lamanihub($lead_data);
  }
}
```

### n8n Workflow

**HTTP Request Node Configuration:**

1. **Method:** POST
2. **URL:** `https://your-app.lovable.app/api/lead-intake`
3. **Authentication:** None (use headers)
4. **Headers:**
   ```json
   {
     "x-api-key": "{{$credentials.apiKey}}",
     "Content-Type": "application/json"
   }
   ```
5. **Body (JSON):**
   ```json
   {
     "name": "{{$json.name}}",
     "phone": "{{$json.phone}}",
     "email": "{{$json.email}}",
     "consent": true,
     "source": "n8n_workflow"
   }
   ```

**Example Workflow:**
```
[Webhook Trigger] → [Process Data] → [HTTP Request to LamaniHub] → [Send Confirmation]
```

### Zapier Integration

**HTTP Request (Webhooks by Zapier):**

1. **Action:** POST
2. **URL:** `https://your-app.lovable.app/api/lead-intake`
3. **Payload Type:** JSON
4. **Headers:**
   - `Content-Type`: `application/json`
   - `x-api-key`: `YOUR_API_KEY`
5. **Data:**
   ```json
   {
     "name": "First Name Last Name",
     "phone": "Phone Number",
     "email": "Email Address",
     "consent": true,
     "source": "zapier"
   }
   ```

### Python

```python
import requests
import json

def create_lead(api_key, lead_data):
    url = "https://your-app.lovable.app/api/lead-intake"
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key
    }
    
    payload = {
        "name": lead_data["name"],
        "phone": lead_data["phone"],
        "email": lead_data["email"],
        "consent": lead_data.get("consent", False),
        "source": lead_data.get("source", "python_script")
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 201:
        result = response.json()
        print(f"Lead created: {result['lead_id']}")
        return result
    else:
        error = response.json()
        print(f"Error: {error['error']}")
        return None

# Usage
api_key = "YOUR_API_KEY"
lead = {
    "name": "Ahmad Abdullah",
    "phone": "0123456789",
    "email": "ahmad@example.com",
    "consent": True
}

create_lead(api_key, lead)
```

---

## Custom Fields (HubSpot-Style Auto-Creation)

### Overview

LamaniHub automatically creates custom properties when you send fields beyond the core required fields. This allows you to capture any additional information without pre-configuring fields in the UI.

### How It Works

1. **Send Any Field:** Include any additional fields in your API request
2. **Automatic Detection:** The system detects unknown fields
3. **Type Inference:** Smart detection of field type based on name and value
4. **Property Creation:** Field definition created in `property_definitions` table
5. **Data Storage:** Values stored in `leads.custom` JSONB field
6. **UI Visibility:** Fields appear in Fields Manager and lead detail views

### Example

**API Request:**
```json
{
  "name": "Sarah Chen",
  "phone": "0123456789",
  "email": "sarah@example.com",
  "consent": true,
  "treatment_interest": "Botox",
  "budget": "5000",
  "preferred_date": "2025-12-20",
  "is_first_time": true,
  "referral_source": "Facebook Ad"
}
```

**What Happens:**
1. Core fields (`name`, `phone`, `email`, `consent`) → Stored in standard columns
2. Custom fields automatically created:
   - `treatment_interest` → String property
   - `budget` → Number property (inferred from numeric value)
   - `preferred_date` → Date property (inferred from date format)
   - `is_first_time` → Boolean property
   - `referral_source` → String property

**Result in LamaniHub:**
- Lead created with ID
- 5 custom properties automatically created
- Properties visible in Fields Manager (`/settings/fields`)
- Values searchable and filterable in lead list
- Fields reusable for future leads

### Type Inference

The system intelligently detects field types using these rules:

**1. By Field Name Pattern:**
| Pattern | Type | Example |
|---------|------|---------|
| Contains "email" | email | `contact_email` |
| Contains "phone", "mobile", "whatsapp" | phone | `mobile_number` |
| Contains "date", "dob", "birthday" | date | `appointment_date` |
| Contains "url", "website", "link" | url | `social_media_url` |
| Contains "price", "cost", "amount", "budget" | number | `treatment_budget` |

**2. By Value Pattern:**
| Value | Type | Example |
|-------|------|---------|
| `true` / `false` | boolean | `is_returning` |
| `"2025-12-15"` | date | `preferred_date` |
| `"user@example.com"` | email | `secondary_email` |
| `"0123456789"` | phone | `alternative_phone` |
| `"https://..."` | url | `facebook_profile` |
| `"5000"` or `5000` | number | `budget` |
| Everything else | string | `notes` |

### Key Sanitization

Field names are automatically sanitized for database safety:

**Original → Sanitized:**
- `Treatment Interest` → `treatment_interest`
- `Patient Age (Years)` → `patient_age_years`
- `Email@Address` → `email_address`
- `Phone#1` → `phone_1`

**Rules:**
- Lowercase conversion
- Special characters → underscore
- Multiple underscores collapsed
- Max 63 characters (PostgreSQL limit)
- Reserved keywords blocked

### Limits & Guardrails

**Property Limit:**
- Max 100 custom fields per tenant
- Prevents database bloat
- Error: `422 Unprocessable Entity`

**Payload Size:**
- Max 64KB for all custom fields
- Prevents large payloads
- Error: `413 Payload Too Large`

**Reserved Fields:**
- Core fields cannot be overridden
- SQL keywords blocked
- Sensitive field names blocked
- Returns `null` for invalid keys (skipped)

### Managing Custom Fields

**View Fields:**
1. Log in to LamaniHub
2. Go to Settings → Fields Manager (`/settings/fields`)
3. See all auto-created properties

**Field Properties:**
- Label (auto-generated from key)
- Data type (inferred)
- Visibility settings
- Usage count
- Last seen timestamp

**Edit Fields:**
- Change label
- Update data type
- Toggle visibility (list/form)
- Mark as sensitive (PDPA)
- Archive unused fields

### Best Practices

**✅ DO:**
- Use descriptive field names (`treatment_interest` not `ti`)
- Use consistent naming across requests
- Send only relevant data
- Use appropriate data types in values
- Test with sample data first

**❌ DON'T:**
- Send sensitive medical data unless required
- Use overly long field names
- Send duplicate fields with different names
- Exceed 100 custom fields
- Send binary data or large text blocks

### Use Cases

**1. Treatment Tracking:**
```json
{
  "name": "Patient Name",
  "email": "patient@example.com",
  "phone": "0123456789",
  "treatment_interest": "Laser Hair Removal",
  "treatment_area": "Full Legs",
  "budget": "3000",
  "preferred_start_date": "2025-12-01"
}
```

**2. Campaign Tracking:**
```json
{
  "name": "Lead Name",
  "email": "lead@example.com",
  "phone": "0123456789",
  "campaign_source": "Google Ads",
  "campaign_name": "Summer Promo 2025",
  "ad_group": "Skincare",
  "landing_page": "https://clinic.com/summer-promo"
}
```

**3. Referral Tracking:**
```json
{
  "name": "Referred Patient",
  "email": "referred@example.com",
  "phone": "0123456789",
  "referred_by": "Dr. Ahmad",
  "referral_type": "Doctor Referral",
  "referral_date": "2025-11-15",
  "referral_notes": "Interested in consultation"
}
```

### Technical Details

**Storage:**
- Custom field definitions: `property_definitions` table
- Custom field values: `leads.custom` JSONB column
- Indexed for fast queries (GIN index)

**Performance:**
- Property upsert uses `ON CONFLICT` for idempotency
- Usage tracking via RPC function
- Batch operations supported

**Audit Trail:**
- All webhook payloads logged in `webhook_events`
- Property creation tracked in `audit_log`
- IP addresses recorded for compliance

---

## Validation Rules

### Name
- **Required:** Yes
- **Min length:** 2 characters
- **Max length:** 100 characters
- **Trimmed:** Whitespace removed from start/end

### Phone
- **Required:** Yes
- **Format:** Malaysian phone numbers only
- **Accepted formats:**
  - `012-345 6789`
  - `0123456789`
  - `+60123456789`
  - `60123456789`
- **Normalized to:** `+60XXXXXXXXX`

### Email
- **Required:** Yes
- **Format:** Valid email address
- **Max length:** 255 characters
- **Normalized:** Lowercase and trimmed

### Consent
- **Required:** No
- **Type:** Boolean
- **Default:** false
- **Accepted values:** `true`, `false`, `"true"`, `"false"`

### Source
- **Required:** No
- **Type:** String
- **Default:** `"api"`
- **Examples:** `"website_form"`, `"n8n_workflow"`, `"zapier"`, `"wordpress"`

### Custom Fields
- **Required:** No
- **Type:** Any JSON-serializable value
- **Automatically created:** Yes
- **Type inference:** Automatic (string, number, boolean, date, email, phone, url)
- **Limits:**
  - Max 100 custom fields per tenant
  - Max 64KB total size for custom fields
  - Field names sanitized to snake_case
  - Reserved field names blocked

**Type Inference Rules:**

1. **By Key Name:**
   - Contains "email" → `email` type
   - Contains "phone", "mobile", "whatsapp" → `phone` type
   - Contains "date", "dob", "birthday" → `date` type
   - Contains "url", "website", "link" → `url` type
   - Contains "price", "cost", "amount", "budget" → `number` type

2. **By Value Pattern:**
   - `true`/`false` → `boolean` type
   - `"2025-12-15"` → `date` type
   - `"user@example.com"` → `email` type
   - `"0123456789"` → `phone` type
   - `"https://example.com"` → `url` type
   - `"5000"` → `number` type
   - Everything else → `string` type

**Reserved Field Names (Cannot be used):**
- Core fields: `id`, `tenant_id`, `name`, `phone`, `email`, `status`, `source`, `custom`
- System fields: `created_at`, `updated_at`, `deleted_at`, `created_by`, `modified_by`
- Consent fields: `consent`, `consent_given`, `consent_timestamp`, `consent_ip`
- Sensitive fields: `password`, `nric`, `ic`, `passport`, `diagnosis`
- SQL keywords: `select`, `insert`, `update`, `delete`, `drop`, `table`, `where`

---

## Duplicate Detection

The API checks for duplicate leads using **phone number** or **email address** within the same tenant.

If a duplicate is found, the API returns:
- **Status:** 409 Conflict
- **Response:** Includes the existing lead's ID

**Behavior:**
- Phone numbers are normalized before comparison
- Email addresses are compared case-insensitively
- Duplicates are checked per tenant (not globally)

---

## Rate Limiting

**Current:** No rate limiting (MVP)

**Future (Production):**
- 100 requests per hour per API key
- 429 Too Many Requests status when exceeded
- Rate limit headers in response

---

## Security Best Practices

### Protect Your API Key
✅ **DO:**
- Store API keys in environment variables
- Use server-side code only
- Rotate keys if compromised
- Monitor API usage

❌ **DON'T:**
- Expose API keys in client-side JavaScript
- Commit API keys to Git repositories
- Share API keys via email or chat
- Use the same key across multiple environments

### Input Validation
- All inputs are validated server-side
- Phone numbers are normalized to prevent format mismatches
- Email addresses are validated with regex
- SQL injection is prevented by Supabase's query builder

### Audit Logging
- All API requests are logged with:
  - Timestamp
  - Tenant ID
  - IP address
  - Action performed
  - Request source

---

## Troubleshooting

### "Invalid API key"
**Cause:** The API key is incorrect or doesn't exist.

**Solution:**
1. Check your API key in LamaniHub Settings
2. Ensure there are no extra spaces or characters
3. Verify you're using the correct header: `x-api-key`

### "Subscription inactive"
**Cause:** Your subscription is past due, suspended, or cancelled.

**Solution:**
1. Log in to LamaniHub
2. Go to Billing
3. Update your payment method or reactivate subscription

### "Invalid phone number format"
**Cause:** The phone number doesn't match Malaysian format.

**Solution:**
- Use Malaysian phone numbers: `01X XXXX XXXX`
- Accepted formats: `012-345 6789`, `0123456789`, `+60123456789`

### "Duplicate lead"
**Cause:** A lead with the same phone or email already exists.

**Solution:**
- Update the existing lead instead
- Use a different phone or email
- Check if this is intentional duplicate prevention

### "Property limit exceeded"
**Cause:** Tenant has reached the maximum of 100 custom fields.

**Solution:**
- Review existing custom fields in Fields Manager (`/settings/fields`)
- Archive unused fields
- Consolidate similar fields
- Contact support for enterprise limits

### "Payload too large"
**Cause:** Custom fields data exceeds 64KB limit.

**Solution:**
- Reduce the amount of custom field data
- Split data into multiple leads if appropriate
- Store large content externally and use URLs

### "Failed to create lead"
**Cause:** Server error or database issue.

**Solution:**
1. Check if all required fields are present
2. Retry the request
3. Contact support if issue persists

---

## Support

For API support:
- **Email:** support@lamanihub.com
- **Documentation:** https://docs.lamanihub.com
- **Status Page:** https://status.lamanihub.com

For billing issues:
- Log in to LamaniHub and go to Billing
- Contact: billing@lamanihub.com
