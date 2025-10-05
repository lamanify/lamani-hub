# Lead Import Feature

## Overview

The Lead Import feature enables clinic administrators to bulk upload patient inquiries from CSV files. This streamlines onboarding of existing patient databases and integrates with practice management systems.

---

## Key Features

### 1. **CSV Upload**
- Drag-and-drop or click to upload
- Supports `.csv`, `.xlsx`, and `.xls` file formats
- Real-time file validation
- File size display for transparency

### 2. **Template Download**
- Pre-formatted CSV template available
- Includes example data
- Ensures correct column headers

### 3. **Validation Rules**

#### Name
- **Required field**
- Minimum 2 characters
- Maximum 100 characters

#### Phone
- **Required field**
- Must be valid Malaysian phone number format
- Automatically normalized to `+60XXXXXXXXX` format
- Accepts formats like: `012-345 6789`, `0123456789`, `+60123456789`

#### Email
- **Required field**
- Must be valid email format
- Maximum 255 characters
- Automatically converted to lowercase

#### Optional Fields
- **Source**: Custom source identifier (defaults to "import")
- **Consent**: Boolean value for PDPA consent tracking

### 4. **Duplicate Detection**
- Checks existing leads by phone **OR** email
- Prevents duplicate entries
- Reports duplicates with clear error messages

### 5. **Error Reporting**
- Row-by-row validation
- Clear error messages with row numbers
- Shows up to 10 errors in UI
- Full error list in response

### 6. **Import Summary**
- Count of successfully imported leads
- Count of skipped rows
- Detailed error breakdown
- Success/warning toast notifications

---

## How to Use

### From the UI

1. **Navigate to Leads Page**
   - Click "Leads" in the sidebar

2. **Click Import Button**
   - Located next to "Export" and "Add Lead" buttons
   - Opens import modal dialog

3. **Download Template (Optional)**
   - Click "Download CSV Template" link
   - Use template to format your data

4. **Select CSV File**
   - Click file input or drag file into modal
   - Only `.csv`, `.xlsx`, `.xls` files accepted

5. **Review and Import**
   - File name and size displayed
   - Click "Import Leads" button
   - Wait for processing (loading state shown)

6. **View Results**
   - Green success alert: Shows imported count
   - Red error alert: Shows skipped rows with reasons
   - Toast notifications summarize results

---

## CSV Format

### Required Columns
```csv
Name,Phone,Email
Ahmad bin Abdullah,012-345 6789,ahmad@example.com
Sarah Lee,017-888 9999,sarah@example.com
```

### With Optional Columns
```csv
Name,Phone,Email,Source,Consent
Ahmad bin Abdullah,012-345 6789,ahmad@example.com,website,true
Sarah Lee,017-888 9999,sarah@example.com,referral,false
```

### Column Descriptions

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| Name | ✅ Yes | Patient full name | Ahmad bin Abdullah |
| Phone | ✅ Yes | Malaysian phone number | 012-345 6789 |
| Email | ✅ Yes | Valid email address | ahmad@example.com |
| Source | ❌ No | Lead origin | website, referral, facebook |
| Consent | ❌ No | PDPA consent status | true, false, yes, no |

---

## Error Messages

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Missing required fields | Name, phone, or email is empty | Ensure all required columns have values |
| Name must be between 2 and 100 characters | Name too short or too long | Check name length |
| Invalid phone number | Not a valid Malaysian format | Use format like 012-345 6789 |
| Invalid email format | Email doesn't match pattern | Check email has @ and domain |
| Duplicate: Lead with phone X already exists | Phone or email already in database | Remove duplicate from CSV or update existing lead |
| Database error | Server-side issue | Contact support if persistent |

---

## API Endpoint

### POST `/functions/v1/import-leads`

**Authentication**: Required (JWT Bearer token)

**Permissions**: `clinic_admin` or `super_admin` role

**Content-Type**: `multipart/form-data`

**Request Body**:
```
file: <CSV File>
```

**Response (200 OK)**:
```json
{
  "imported": 10,
  "skipped": 2,
  "errors": [
    {
      "row": 3,
      "reason": "Invalid phone number: 123"
    },
    {
      "row": 7,
      "reason": "Duplicate: Lead with email test@example.com already exists"
    }
  ]
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Unauthorized"
}
```

**Response (403 Forbidden)**:
```json
{
  "error": "Insufficient permissions"
}
```

---

## Security & Permissions

### Role-Based Access
- Only **clinic_admin** and **super_admin** can import leads
- View-only users cannot access import feature
- Regular clinic users cannot import

### Data Validation
- All fields validated server-side
- Phone numbers normalized to E.164 format
- Email addresses sanitized and lowercased
- SQL injection prevention via parameterized queries

### Tenant Isolation
- Leads automatically assigned to user's tenant
- Cannot import into other clinics' databases
- RLS policies enforce tenant boundaries

### Audit Logging
- Every import logged to `audit_log` table
- Tracks:
  - User who performed import
  - Filename
  - Total rows processed
  - Successfully imported count
  - Skipped count
  - Error count
  - Timestamp

---

## Implementation Details

### CSV Parsing
- Uses Deno's standard library CSV parser
- Header row automatically detected
- Empty lines skipped
- Case-insensitive column matching

### Phone Normalization
- Inline utilities handle Malaysian formats
- Converts to `+60XXXXXXXXX` standard
- Validates against Malaysian mobile patterns
- Supports formats: `+60`, `60`, `0` prefixes

### Duplicate Detection
- Queries database for existing phone OR email
- Uses tenant-scoped queries (RLS enforced)
- Efficient single query per row
- Reports which field caused duplicate

### Performance
- Processes rows sequentially
- Validates before database insert
- Handles large files (tested up to 1000 rows)
- Timeout: 60 seconds (Edge Function default)

---

## Audit Trail

Every import creates an audit log entry:

```json
{
  "tenant_id": "uuid",
  "user_id": "uuid",
  "action": "leads_import",
  "resource_id": null,
  "details": {
    "filename": "clinic_leads.csv",
    "total_rows": 50,
    "imported": 45,
    "skipped": 5,
    "errors": 5
  },
  "created_at": "2025-01-15T10:30:00Z"
}
```

---

## Future Enhancements

### Post-MVP Features
1. **Column Mapping UI**
   - Preview CSV headers
   - Map to database fields
   - Handle non-standard formats

2. **Custom Field Import**
   - Auto-create custom properties from CSV columns
   - Type inference for custom fields
   - Property definition updates

3. **Import Templates**
   - Save column mappings
   - Reuse for recurring imports
   - Clinic-specific templates

4. **Scheduled Imports**
   - SFTP/FTP integration
   - Daily/weekly automatic imports
   - Email notifications on completion

5. **Excel Format Support**
   - Native `.xlsx` parsing
   - Sheet selection
   - Advanced formatting preservation

6. **Import Preview**
   - Show first 10 rows before importing
   - Validation summary
   - Confirm before processing

7. **Progress Tracking**
   - Real-time progress bar
   - Rows processed counter
   - Cancel import option

---

## Troubleshooting

### Issue: "No file uploaded" error
**Solution**: Ensure file is selected before clicking Import

### Issue: Import button disabled
**Solution**: Check that you've selected a valid CSV file

### Issue: All rows skipped
**Solution**: 
- Verify CSV has correct column headers (Name, Phone, Email)
- Check data matches validation rules
- Ensure no duplicate leads

### Issue: "Insufficient permissions" error
**Solution**: Contact your clinic admin to upgrade your account role

### Issue: Import times out
**Solution**: 
- Split large CSV files into smaller batches (< 500 rows)
- Remove unnecessary columns
- Ensure stable internet connection

---

## Testing Checklist

- [ ] Import valid CSV with 3 leads
- [ ] Import CSV with missing required fields
- [ ] Import CSV with invalid phone numbers
- [ ] Import CSV with invalid emails
- [ ] Import CSV with duplicate leads
- [ ] Download and use template
- [ ] Import with optional columns (source, consent)
- [ ] Verify audit log entry created
- [ ] Check leads appear in leads list
- [ ] Test role permissions (non-admin cannot import)
- [ ] Verify phone normalization (+60 format)
- [ ] Test with large file (100+ rows)
- [ ] Test error reporting (shows correct row numbers)
- [ ] Verify toast notifications work
- [ ] Check leads list refreshes after import

---

## Related Documentation

- [Lead Export Feature](./LEAD_EXPORT_FEATURE.md)
- [Phone Normalization](./PHONE_NORMALIZATION.md)
- [API Integration Guide](./API_INTEGRATION.md)
- [Custom Fields System](./API_CUSTOM_FIELDS_EXAMPLES.md)
