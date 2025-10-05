# Settings Page Documentation

## Overview

The Settings page provides a comprehensive interface for clinic administrators to manage clinic profile, PDPA compliance information, and API access configuration.

**Route**: `/settings`

---

## Tab Structure

The Settings page uses a tabbed interface with three main sections:

1. **Clinic Profile** - Basic clinic and user information
2. **PDPA Compliance** - Data Protection Officer (DPO) details
3. **API Access** - API key management and integration

---

## Tab 1: Clinic Profile

### Clinic Information

**Editable Fields** (Admin only):
- **Clinic Name**: Name of the healthcare facility

**Read-only Information**:
- **Created on**: Account creation date (relative format)
- **Subscription Status**: Badge showing current status (Active, Trial, Past Due, etc.)

### User Profile

**Editable Fields** (All users):
- **Full Name**: User's display name

**Read-only Information**:
- **Email Address**: User's login email (from Supabase Auth)
- **Role**: User role badge (clinic_admin, clinic_user, view_only)

### Permissions
- Only `clinic_admin` and `super_admin` can edit clinic name
- All users can edit their own full name
- Non-admin users see a read-only warning message

---

## Tab 2: PDPA Compliance

### Data Protection Officer (DPO)

**Compliance Alert**:
```
⚠️ PDPA 2024 Compliance Requirement
Malaysian businesses must designate a Data Protection Officer (DPO) by June 1, 2025.
This information will be included in privacy notices and data breach notifications.
```

**Form Fields** (Admin only):

1. **DPO Name**
   - Required field
   - Min 2 characters
   - Example: "Dr. Ahmad bin Abdullah"

2. **DPO Email**
   - Required field
   - Valid email format
   - Example: "dpo@clinic.com"

3. **DPO Phone**
   - Required field
   - Valid Malaysian phone number
   - Auto-normalized to `+60XXXXXXXXX` format on save
   - Example: "012-345 6789"

### Data Retention Policy

**Display Only**:
- Current retention period: **7 years**
- Info: "Patient data will be automatically deleted after 7 years (PDPA requirement)"
- Read-only in current version

### Right to be Forgotten

**Information Card**:
- Explains patient data deletion requests under PDPA
- "Contact Support" button (opens mailto:support@lamanihub.com)

### Permissions
- Only `clinic_admin` and `super_admin` can edit DPO information
- Non-admin users see a read-only warning message

---

## Tab 3: API Access

### API Key Display

**Features**:
- Masked by default: `••••••••••••••••••••••••••••••••`
- Show/Hide toggle button (eye icon)
- Copy to clipboard button
- Monospace font for readability

**Security Warning**:
```
Keep this key secret. Anyone with this key can create leads in your account.
```

### Regenerate API Key

**Button**: "Regenerate API Key" (Destructive variant)

**Confirmation Dialog**:
- **Title**: "Regenerate API Key?"
- **Message**: "This will invalidate your current API key. Any integrations using the old key will stop working. This action cannot be undone."
- **Actions**: Cancel / Regenerate

**Functionality**:
- Generates new 64-character API key using `crypto.getRandomValues`
- Format: `lh_{hex_string}`
- Updates `tenants.api_key` in database
- Logs action to `audit_log`
- Invalidates queries and shows success toast

### API Integration

**Documentation Section**:
- Description of API usage
- Example cURL command with proper formatting
- Link to full API documentation

**Example Command**:
```bash
curl -X POST https://[project-url]/functions/v1/lead-intake \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "Patient Name",
    "phone": "0123456789",
    "email": "patient@example.com",
    "consent": true
  }'
```

### Permissions
- All users can view API key
- Only `clinic_admin` and `super_admin` can regenerate API key
- Non-admin users see a read-only warning message

---

## Data Fetching

### Tenant Data
```typescript
useQuery({
  queryKey: ["tenant", tenant?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenant.id)
      .single();
    return data;
  },
})
```

**Fields Used**:
- `name` - Clinic name
- `created_at` - Account creation date
- `subscription_status` - Current subscription status
- `dpo_name` - DPO full name
- `dpo_email` - DPO email address
- `dpo_phone` - DPO phone number (normalized)
- `api_key` - Tenant's API key

---

## Form Validation

### Profile Form Schema
```typescript
z.object({
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
})
```

### DPO Form Schema
```typescript
z.object({
  dpo_name: z.string().min(2, "DPO name must be at least 2 characters"),
  dpo_email: z.string().email("Valid email required"),
  dpo_phone: z.string().refine(
    (val) => isValidMalaysianPhone(val),
    "Valid Malaysian phone required"
  ),
})
```

---

## Phone Normalization

**DPO Phone Field**:
- Uses `PhoneInput` component
- Validates using `isValidMalaysianPhone()`
- Normalizes to `+60XXXXXXXXX` format using `normalizePhone()` before save
- Example: `012-345 6789` → `+60123456789`

---

## Audit Logging

All settings changes are logged to the `audit_log` table:

### Settings Updated
```typescript
{
  action: "settings_updated",
  details: {
    clinic_name: "New Clinic Name",
    full_name: "New User Name"
  }
}
```

### DPO Updated
```typescript
{
  action: "dpo_updated",
  details: {
    dpo_name: "Dr. Ahmad"
  }
}
```

### API Key Regenerated
```typescript
{
  action: "api_key_regenerated",
  details: {}
}
```

---

## Loading States

### Initial Load
- Shows `Skeleton` components for page title and content
- Waits for tenant data to load

### Saving
- Button text changes: "Save" → "Saving..."
- Button disabled during mutation
- Form fields remain enabled

### Success States
- Toast notification: "Settings saved successfully"
- Queries invalidated to refresh data
- Form resets to saved values

### Error States
- Toast notification with error message
- Form remains editable
- Button re-enabled

---

## Mobile Responsive

### Breakpoints

**Mobile** (`< 768px`):
- Tabs stack vertically
- Full-width form fields
- Larger touch targets (min 44x44px)
- API key field wraps with copy button below

**Tablet** (`768px - 1024px`):
- Tabs remain horizontal
- Two-column grid for info cards
- Adequate spacing for touch

**Desktop** (`> 1024px`):
- Full horizontal layout
- Max-width: 4xl (896px)
- Optimal reading width

---

## Subscription Badges

**Colors and States**:
- **Active**: Green badge (`bg-green-500`)
- **Trial**: Secondary badge (gray)
- **Past Due**: Destructive badge (red)
- **Other**: Outline badge

---

## Navigation

**Links**:
- **Custom Fields**: `/settings/fields` (top of page)
- **Contact Support**: `mailto:support@lamanihub.com` (PDPA tab)
- **API Documentation**: External link to docs (API tab)

---

## Component Structure

```
Settings.tsx
├── DashboardLayout
│   ├── Header (Page title + description)
│   ├── Custom Fields Card Link
│   └── Tabs
│       ├── Clinic Profile Tab
│       │   ├── Clinic Information Card
│       │   └── User Profile Card
│       ├── PDPA Compliance Tab
│       │   ├── Compliance Alert
│       │   ├── DPO Form Card
│       │   ├── Data Retention Card
│       │   └── Right to be Forgotten Card
│       └── API Access Tab
│           ├── API Key Card
│           └── API Integration Card
```

---

## Design System

### Colors
- Primary: `#e9204f` (brand red)
- Success: `bg-green-500`
- Warning: `bg-yellow-50` / `border-yellow-200`
- Destructive: `bg-destructive`

### Typography
- Page Title: `text-3xl font-semibold`
- Card Title: `CardTitle` component
- Description: `text-muted-foreground`
- Labels: `Label` component

### Spacing
- Page container: `space-y-6`
- Card spacing: `space-y-4`
- Form fields: `space-y-2`

---

## Best Practices

### Security
✅ API key masked by default
✅ Show/hide toggle for sensitive data
✅ Confirmation dialog for destructive actions
✅ Admin-only permissions enforced
✅ Audit logging for all changes

### UX
✅ Clear section headers and descriptions
✅ Helpful placeholder text
✅ Inline validation errors
✅ Loading states for all actions
✅ Success/error toast notifications

### Accessibility
✅ Semantic HTML structure
✅ Proper label associations
✅ Keyboard navigation support
✅ Clear error messages
✅ Sufficient color contrast

### Performance
✅ Query caching with React Query
✅ Optimistic updates
✅ Skeleton loading states
✅ Debounced form submissions

---

## Testing Checklist

### Clinic Profile Tab
- [ ] Edit clinic name (admin only)
- [ ] Edit full name (all users)
- [ ] View subscription status badge
- [ ] Non-admin sees read-only message
- [ ] Save changes updates database
- [ ] Success toast shown
- [ ] Data persists after refresh

### PDPA Compliance Tab
- [ ] Edit DPO name (admin only)
- [ ] Edit DPO email (admin only)
- [ ] Edit DPO phone (admin only)
- [ ] Phone normalization works
- [ ] Save DPO info updates database
- [ ] Success toast shown
- [ ] Compliance alert visible
- [ ] Contact support button opens email

### API Access Tab
- [ ] API key masked by default
- [ ] Show/hide toggle works
- [ ] Copy button copies full key
- [ ] Regenerate confirmation dialog
- [ ] Regenerate creates new key
- [ ] Old key invalidated
- [ ] Audit log entry created
- [ ] Non-admin cannot regenerate
- [ ] API documentation example shown

### Permissions
- [ ] clinic_admin can edit all fields
- [ ] super_admin can edit all fields
- [ ] clinic_user can only edit own name
- [ ] view_only sees read-only warnings

### Mobile Responsive
- [ ] Tabs work on mobile
- [ ] Forms are usable on touch devices
- [ ] API key field wraps properly
- [ ] Copy button accessible on mobile

---

## Related Documentation

- [Phone Normalization](./PHONE_NORMALIZATION.md)
- [API Integration Guide](./API_INTEGRATION.md)
- [Custom Fields Manager](./API_CUSTOM_FIELDS_EXAMPLES.md)
- [Audit Log Feature](./AUDIT_LOG.md)

---

## Future Enhancements

1. **Password Change**
   - Allow users to change password from settings
   - Email confirmation required

2. **Custom Data Retention**
   - Allow admins to set custom retention period
   - Min 1 year, max 10 years

3. **Email Notifications**
   - Configure which events trigger emails
   - Daily/weekly digest options

4. **Two-Factor Authentication**
   - Enable 2FA for admin accounts
   - SMS or authenticator app

5. **API Usage Analytics**
   - Show API call statistics
   - Rate limit warnings
   - Usage graphs

6. **Team Management**
   - Invite team members
   - Manage user roles
   - Deactivate users

7. **Webhook Configuration**
   - Set up webhook URLs
   - Test webhook delivery
   - View webhook logs
