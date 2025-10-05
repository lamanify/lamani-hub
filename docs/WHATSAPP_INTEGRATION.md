# WhatsApp Integration Guide

## Overview

LamaniHub integrates WhatsApp click-to-chat functionality to enable instant communication with leads via Malaysia's most popular messaging platform.

## WhatsAppButton Component

### Usage

```typescript
import { WhatsAppButton } from "@/components/WhatsAppButton";

// Icon variant (for tables)
<WhatsAppButton 
  phone="+60123456789" 
  variant="icon" 
/>

// Button variant (for detail pages)
<WhatsAppButton 
  phone="+60123456789" 
  variant="default"
  size="default"
  message="Hi {name}, I'm reaching out regarding your inquiry."
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `phone` | `string` | ✅ | - | Normalized phone number (+60XXXXXXXXX) |
| `variant` | `"icon" \| "default"` | ❌ | `"icon"` | Display variant |
| `size` | `"sm" \| "default" \| "lg" \| "icon"` | ❌ | `"icon"` | Button size |
| `message` | `string` | ❌ | - | Pre-filled message |
| `className` | `string` | ❌ | - | Additional CSS classes |
| `onClick` | `() => void` | ❌ | - | Analytics callback |

### Variants

#### Icon Only (Table Cells)

```typescript
<WhatsAppButton 
  phone={lead.phone} 
  variant="icon"
/>
```

- Small circular button
- Green WhatsApp icon
- Tooltip on hover
- Size: 28x28px

#### Button with Text (Detail Pages)

```typescript
<WhatsAppButton 
  phone={lead.phone} 
  variant="default"
  size="default"
  message={`Hi ${lead.name}, how can we help you?`}
/>
```

- WhatsApp brand green (#25D366)
- "Chat on WhatsApp" text
- Icon + text layout
- Hover effect

## URL Format

WhatsApp URLs must be in the correct format:

```
✅ https://wa.me/60123456789
✅ https://wa.me/60123456789?text=Hello
❌ https://wa.me/+60 12 345 6789 (has + and spaces)
```

Phone numbers are automatically cleaned using `formatPhoneForWhatsApp()`:

```typescript
import { formatPhoneForWhatsApp } from "@/lib/utils/phoneNormalizer";

const cleanPhone = formatPhoneForWhatsApp("+60 12 345 6789");
// Result: "60123456789"
```

## Integration Points

### ✅ Implemented

1. **Leads Table** - Phone column with icon button
2. **Phone Number Display** - Formatted display with WhatsApp action

### 🔄 Future Implementation

3. **Lead Detail Page** - Contact section with button variant
   ```typescript
   <div className="flex items-center gap-3">
     <Phone className="h-5 w-5 text-muted-foreground" />
     <span className="text-lg">{formatPhoneDisplay(lead.phone)}</span>
     <WhatsAppButton 
       phone={lead.phone} 
       variant="default"
       message={`Hi ${lead.name}, I'm reaching out from ${clinic.name} regarding your inquiry.`}
     />
   </div>
   ```

4. **Lead Card (Mobile)** - Quick action button
   ```typescript
   <Card>
     <CardContent>
       <div className="flex items-center justify-between">
         <span>{formatPhoneDisplay(lead.phone)}</span>
         <WhatsAppButton phone={lead.phone} variant="default" size="sm" />
       </div>
     </CardContent>
   </Card>
   ```

## Pre-filled Messages

Common message templates:

### New Lead Inquiry
```typescript
message={`Hi ${lead.name}, I'm reaching out from ${clinic.name} regarding your inquiry. How can we help you?`}
```

### Appointment Confirmation
```typescript
message={`Hi ${lead.name}, your appointment is confirmed for ${appointmentDate} at ${appointmentTime}. See you then!`}
```

### Follow-up
```typescript
message={`Hi ${lead.name}, just following up on your recent inquiry. Are you still interested in our services?`}
```

### Treatment Update
```typescript
message={`Hi ${lead.name}, this is an update regarding your treatment plan. Please let me know if you have any questions.`}
```

## Mobile Behavior

### iOS & Android
- Opens WhatsApp app if installed
- Falls back to WhatsApp Web if app not available
- Uses deep linking for seamless experience

### Desktop
- Opens WhatsApp Web (web.whatsapp.com)
- Requires QR code scan if not logged in
- Opens in new tab

## Analytics & Tracking

Track WhatsApp interactions:

```typescript
<WhatsAppButton 
  phone={lead.phone}
  onClick={async () => {
    // Log to audit trail
    await supabase.from("audit_log").insert({
      tenant_id: tenantId,
      user_id: userId,
      action: "lead_contact",
      resource_id: lead.id,
      details: {
        method: "whatsapp",
        phone: lead.phone,
      },
    });
  }}
/>
```

## Error Handling

Invalid phone numbers are handled gracefully:

```typescript
// Component automatically handles invalid phones
<WhatsAppButton phone="invalid" variant="icon" />
// Result: Disabled button with tooltip "Invalid phone number"
```

Validation checks:
- ✅ Phone starts with +60 or 60
- ✅ Phone has correct length (11-12 digits)
- ✅ Phone contains only numbers after cleaning

## Styling

### WhatsApp Brand Colors

```css
/* Primary green */
--whatsapp-green: #25D366;

/* Dark green (hover) */
--whatsapp-dark: #20BA5A;
```

### Component Classes

```typescript
// Icon variant
className="h-7 w-7 p-0"

// Button variant
className="bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2"
```

## Best Practices

1. **Always normalize phones** before passing to WhatsAppButton
2. **Use icon variant** in tables for space efficiency
3. **Use button variant** on detail pages for prominence
4. **Add pre-filled messages** for better UX
5. **Track interactions** for analytics
6. **Test on mobile** to ensure app opens correctly
7. **Stop event propagation** in table rows

## Security

- Uses `target="_blank"` for new tabs
- Includes `rel="noopener noreferrer"` for security
- Stops event propagation in tables
- Validates phone format before generating URL

## Testing

Manual test checklist:

- [ ] Icon button appears in leads table
- [ ] Tooltip shows phone number on hover
- [ ] Click opens WhatsApp in new tab
- [ ] Pre-filled message appears (if provided)
- [ ] Works on mobile (opens WhatsApp app)
- [ ] Works on desktop (opens WhatsApp Web)
- [ ] Invalid phones show disabled button
- [ ] Green color matches WhatsApp branding
- [ ] Event propagation stopped in tables
