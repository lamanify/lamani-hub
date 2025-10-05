# Lead Export Feature

## Overview

The Lead Export feature allows clinic admins to export all their lead data in CSV format for data portability, compliance audits, and backup purposes. This feature is PDPA-compliant and includes comprehensive audit logging.

## Features

### Core Capabilities

✅ **CSV Export** - Download all leads as a CSV file with full data  
✅ **Custom Fields** - Automatically includes all custom properties  
✅ **Role-Based Access** - Only admins (clinic_admin, super_admin) can export  
✅ **Audit Logging** - Every export is logged with timestamp and user  
✅ **PDPA Compliance** - Includes consent information and complete data  
✅ **Excel Compatible** - UTF-8 BOM included for proper Excel display  

### Exported Data

**Core Fields:**
- Name
- Phone (formatted as +60 12 345 6789)
- Email
- Status (human-readable labels)
- Source
- Consent Given (Yes/No)
- Consent Date
- Consent IP
- Created At
- Created By (user name)
- Last Modified
- Modified By (user name)

**Custom Fields:**
- All custom properties defined for the tenant
- Values from `leads.custom` JSONB field
- Columns based on `property_definitions` table

## Usage

### From Leads Page

1. Navigate to **Leads** page
2. Click **Export** button (top right, next to "New Lead")
3. Wait for export to process
4. CSV file downloads automatically
5. Success toast notification appears

**Export Button States:**
- **Enabled:** When leads exist and user has permission
- **Disabled:** When no leads exist or export in progress
- **Loading:** Shows "Exporting..." with disabled state

### File Details

**Filename Format:**
```
leads_export_YYYY-MM-DD.csv
```

**Example:**
```
leads_export_2025-01-15.csv
```

**Encoding:**
- UTF-8 with BOM (Excel compatible)
- Properly escaped commas, quotes, newlines

## API Endpoint

### Request

**Endpoint:** `POST /api/export-leads`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `format` (optional): `csv` or `json` (default: `csv`)

### Response

**Success (200):**

For CSV format:
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="leads_export_2025-01-15.csv"

[CSV content with UTF-8 BOM]
```

For JSON format:
```json
{
  "exported_at": "2025-01-15T10:30:00Z",
  "exported_by": "admin@clinic.com",
  "count": 150,
  "leads": [...]
}
```

**Error Responses:**

| Status | Error | Cause |
|--------|-------|-------|
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Insufficient permissions | User is not clinic_admin or super_admin |
| 404 | Profile not found | User profile doesn't exist |
| 500 | Failed to fetch leads | Database query error |

## CSV Format

### Example Output

```csv
Name,Phone,Email,Status,Source,Consent Given,Consent Date,Consent IP,Created At,Created By,Last Modified,Modified By,Treatment Interest,Budget
"Ahmad bin Abdullah","+60 12 345 6789","ahmad@example.com","New Inquiry","Manual","Yes","15 Jan 2025 10:30","192.168.1.1","15 Jan 2025 10:30","John Doe","15 Jan 2025 10:30","John Doe","Botox","5000"
"Sarah Lee","+60 17 888 9999","sarah@example.com","Contacted","Webform","Yes","14 Jan 2025 14:20","203.0.113.1","14 Jan 2025 14:20","System","15 Jan 2025 09:15","","Laser Treatment","8000"
```

### Field Formatting

**Phone Numbers:**
- Normalized to E.164 format: `+60XXXXXXXXX`
- Displayed with spaces: `+60 12 345 6789`

**Dates:**
- Format: `DD MMM YYYY HH:MM`
- Timezone: Malaysia time (en-MY locale)
- Example: `15 Jan 2025 10:30`

**Status:**
- Human-readable labels (not database values)
- Example: `New Inquiry` instead of `new_inquiry`

**CSV Escaping:**
- Values with commas wrapped in quotes
- Quotes inside values doubled (`""`)
- Newlines preserved within quoted values

## Security & Permissions

### Access Control

**Who Can Export:**
- Clinic Admin (`clinic_admin` role)
- Super Admin (`super_admin` role)

**Who Cannot Export:**
- Clinic User (`clinic_user` role)
- View Only (`view_only` role)
- Unauthenticated users

### Tenant Isolation

- Users can only export leads from their own tenant
- Row-Level Security (RLS) enforces tenant filtering
- No cross-tenant data leakage possible

### Authentication

- JWT token required in Authorization header
- Token verified via Supabase Auth
- Invalid/expired tokens rejected with 401

## Audit Logging

Every export is logged to the `audit_log` table:

```json
{
  "tenant_id": "uuid",
  "user_id": "uuid",
  "action": "leads_exported",
  "resource_id": null,
  "details": {
    "count": 150,
    "format": "csv",
    "custom_fields_included": 5,
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Audit Trail Includes:**
- Who exported (user_id)
- When exported (timestamp)
- How many leads (count)
- What format (csv/json)
- How many custom fields (custom_fields_included)

## PDPA Compliance

### Data Portability Right

The export feature fulfills the PDPA requirement for **data portability**, allowing individuals to:
- Obtain their personal data in a structured format
- Transmit data to another service provider
- Retain a copy for their records

### Compliance Features

1. **Complete Data Export** - All personal data included
2. **Machine-Readable Format** - CSV and JSON supported
3. **Consent Records** - Consent status, timestamp, and IP included
4. **Audit Trail** - All exports logged for compliance audits
5. **Secure Access** - Authentication and role-based access control

### Retention & Archiving

Clinics can use exports for:
- Compliance audits
- Data retention requirements
- Backup and disaster recovery
- Migration to other systems
- Legal documentation

## Performance Considerations

### Large Datasets

**Current Implementation:**
- Exports all leads in single query
- No pagination (sufficient for MVP)
- Typically handles 1000+ leads without issue

**Future Optimization (if needed):**
- Stream large exports
- Paginated queries
- Background processing with email delivery
- Progress indicators

### Query Performance

- Indexed on `tenant_id` for fast filtering
- Sorted by `created_at DESC`
- Includes related data (creator/modifier names)
- Custom fields from JSONB column (GIN indexed)

## Error Handling

### Client-Side

**Export Button:**
- Disabled when no leads exist
- Disabled during export process
- Shows loading state ("Exporting...")
- Toast notifications for success/error

**Error Messages:**
```typescript
// Authentication error
toast({
  title: "Authentication required",
  description: "Please log in to export leads",
  variant: "destructive",
});

// Export failure
toast({
  title: "Export failed",
  description: "Failed to export leads. Please try again.",
  variant: "destructive",
});

// Success
toast({
  title: "Export successful",
  description: "Successfully exported 150 leads to CSV",
});
```

### Server-Side

**Error Logging:**
```typescript
console.error('Authentication failed:', authError);
console.error('Profile not found:', profileError);
console.error('Failed to fetch leads:', leadsError);
console.error('Unexpected error:', error);
```

**Graceful Degradation:**
- Missing user names → "Unknown" or "System"
- Missing custom fields → Empty string
- Missing consent data → Empty or "No"

## Future Enhancements

### Planned Features

1. **Filtered Exports**
   - Export only filtered/searched results
   - Export by date range
   - Export by status

2. **Format Options**
   - Excel (.xlsx) format
   - JSON format (already supported via `?format=json`)
   - PDF reports

3. **Scheduled Exports**
   - Weekly/monthly automatic exports
   - Email delivery
   - Cloud storage backup (S3, Google Drive)

4. **Custom Column Selection**
   - Choose which fields to export
   - Save export templates
   - Reorder columns

5. **Advanced Features**
   - Export with attachments
   - Export notes/comments
   - Export activity history

## Testing Checklist

Before releasing to production:

- [ ] Test with no leads (button disabled)
- [ ] Test with 1-10 leads (small dataset)
- [ ] Test with 100+ leads (typical dataset)
- [ ] Test with 1000+ leads (large dataset)
- [ ] Test with custom fields (verify columns)
- [ ] Test with special characters (CSV escaping)
- [ ] Test with different roles (access control)
- [ ] Test as clinic_user (should fail)
- [ ] Test without authentication (should fail)
- [ ] Test Excel import (UTF-8 BOM)
- [ ] Verify audit logging
- [ ] Test concurrent exports
- [ ] Test error handling
- [ ] Verify phone formatting
- [ ] Verify status labels
- [ ] Verify date formatting
- [ ] Test download in different browsers

## Support

For issues with lead export:
- **Email:** support@lamanihub.com
- **Documentation:** https://docs.lamanihub.com/export
- **Compliance:** dpo@lamanihub.com

## Related Documentation

- [API Integration Guide](./API_INTEGRATION.md)
- [PDPA Compliance](./PDPA_COMPLIANCE.md)
- [Custom Fields](./API_CUSTOM_FIELDS_EXAMPLES.md)
- [Audit Logging](./AUDIT_LOG.md)
