# Phone Number Normalization Guide

## Overview

All phone numbers in LamaniHub are stored in E.164 format: `+60XXXXXXXXX`

This ensures:
- ✅ WhatsApp links work correctly
- ✅ Consistent data format in database
- ✅ Easy international compatibility
- ✅ Reliable phone number matching

## Usage

### In Forms (React Hook Form)

```typescript
import { PhoneInput } from "@/components/PhoneInput";

<PhoneInput
  id="phone"
  label="Phone Number"
  value={phoneValue}
  onChange={setPhoneValue}
  onValidationError={(error) => console.log(error)}
/>
```

### With Custom Hook

```typescript
import { usePhoneNormalization } from "@/hooks/use-phone-normalization";

const { validateAndNormalize, error } = usePhoneNormalization({
  onSuccess: (normalized) => {
    // Save to database
    setValue('phone', normalized);
  },
  showToast: true,
});

const handlePhoneBlur = (e) => {
  const normalized = validateAndNormalize(e.target.value);
  if (normalized) {
    // Phone is valid and normalized
  }
};
```

### Direct Functions

```typescript
import { 
  normalizePhone, 
  formatPhoneDisplay,
  formatPhoneForWhatsApp,
  isValidMalaysianPhone 
} from "@/lib/utils/phoneNormalizer";

// Normalize (convert to +60XXXXXXXXX)
const normalized = normalizePhone("012-345 6789"); // "+60123456789"

// Format for display
const display = formatPhoneDisplay("+60123456789"); // "+60 12 345 6789"

// Format for WhatsApp URL
const whatsapp = formatPhoneForWhatsApp("+60123456789"); // "60123456789"

// Validate
const isValid = isValidMalaysianPhone("0123456789"); // true
```

## Examples

### Input → Normalized → Display

| User Input        | Normalized       | Display          | WhatsApp      |
|-------------------|------------------|------------------|---------------|
| `012-345 6789`    | `+60123456789`   | `+60 12 345 6789`| `60123456789` |
| `0123456789`      | `+60123456789`   | `+60 12 345 6789`| `60123456789` |
| `60123456789`     | `+60123456789`   | `+60 12 345 6789`| `60123456789` |
| `+60123456789`    | `+60123456789`   | `+60 12 345 6789`| `60123456789` |
| `(012) 345-6789`  | `+60123456789`   | `+60 12 345 6789`| `60123456789` |

## Where to Apply

### ✅ Already Implemented

1. **Leads Table** - Phone column displays formatted version
2. **WhatsApp Links** - Uses normalized format
3. **formatPhone utility** - Uses new normalization

### 🔄 To Implement (Future)

1. **Lead Creation Form**
   ```typescript
   <PhoneInput
     id="phone"
     label="Phone Number"
     onBlur={(e) => {
       const normalized = normalizePhone(e.target.value);
       setValue('phone', normalized);
     }}
   />
   ```

2. **Lead Edit Form** - Same as above

3. **CSV Import**
   ```typescript
   const normalizedLeads = csvData.map(row => ({
     ...row,
     phone: normalizePhone(row.phone)
   }));
   ```

4. **API Endpoints (Edge Functions)**
   ```typescript
   const normalizedPhone = normalizePhone(body.phone);
   
   if (!isValidMalaysianPhone(normalizedPhone)) {
     return new Response(
       JSON.stringify({ error: 'Invalid Malaysian phone number' }),
       { status: 400 }
     );
   }
   ```

## Error Handling

```typescript
try {
  const normalized = normalizePhone(userInput);
  // Success - save to database
} catch (error) {
  toast({
    title: "Invalid Phone Number",
    description: "Please enter a valid Malaysian phone (e.g., 012-345 6789)",
    variant: "destructive",
  });
}
```

## Database Schema

All phone columns should store normalized format:

```sql
ALTER TABLE leads 
ADD CONSTRAINT phone_format_check 
CHECK (phone ~ '^\+60\d{9,10}$');
```

## Testing

Manual test cases:

```typescript
// Valid inputs
normalizePhone("012-345 6789")  // ✅ "+60123456789"
normalizePhone("0123456789")    // ✅ "+60123456789"
normalizePhone("+60123456789")  // ✅ "+60123456789"

// Invalid inputs
normalizePhone("123")           // ❌ Error: too short
normalizePhone("")              // ❌ Error: required
normalizePhone("123456789012345") // ❌ Error: too long
```

## Best Practices

1. **Store**: Always store normalized format (`+60XXXXXXXXX`) in database
2. **Display**: Use `formatPhoneDisplay()` for UI presentation
3. **WhatsApp**: Use `formatPhoneForWhatsApp()` for wa.me links
4. **Validate**: Always validate before normalizing
5. **Error Messages**: Show user-friendly error messages
6. **Form Blur**: Normalize on blur, not on every keystroke

## Migration

If you have existing data:

```sql
-- Update existing phone numbers to normalized format
UPDATE leads 
SET phone = '+60' || REGEXP_REPLACE(phone, '\D', '', 'g')
WHERE phone NOT LIKE '+60%';
```
