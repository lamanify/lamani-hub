# LamaniHub API Integration Guide

## Lead Intake API

The Lead Intake API allows external systems (WordPress forms, n8n workflows, Zapier, etc.) to create leads programmatically in LamaniHub.

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
  "source": "website_form"
}
```

**Required Fields:**
- `name` (string, 2-100 characters)
- `phone` (string, Malaysian phone format)
- `email` (string, valid email address)

**Optional Fields:**
- `consent` (boolean, default: false) - PDPA consent status
- `source` (string, default: 'api') - Lead source identifier

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
    "source": "website_form"
  }
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
    "source": "website_form"
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
      source: 'website'
    })
  });

  const result = await response.json();
  
  if (response.ok) {
    console.log('Lead created:', result.lead_id);
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
