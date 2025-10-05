# Super Admin Portal Documentation

## Overview

The Super Admin Portal provides elevated access to view and manage all tenants in the LamaniHub system. This interface is designed for system administrators to monitor subscription health, access tenant data for support purposes, and maintain system integrity.

**Routes**:
- `/admin` - Main admin dashboard with tenant list
- `/admin/tenants/:id` - Detailed tenant view

---

## Access Control

### Role Requirements

**Access Level**: `super_admin` role only

**Security Features**:
- Role checked on both client and server side
- RLS policies automatically grant super_admin full read access
- All actions logged to audit trail
- Access denied page for unauthorized users

### Role Check Implementation

```typescript
const { data: userRole } = useQuery({
  queryKey: ["user-role", user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    return data.role;
  },
});

if (userRole !== "super_admin") {
  // Show access denied page
}
```

---

## Admin Dashboard (`/admin`)

### Page Layout

**Header**:
- Title: "Super Admin Portal"
- Badge: Red "Super Admin" badge
- Description: "Manage all tenants and monitor system health"

**Warning Alert**:
```
⚠️ You have elevated permissions. All actions are logged and audited.
```

### Statistics Cards

Five summary cards displaying:

1. **Total Tenants** - Count of all clinics
2. **Active** - Green badge, active subscriptions
3. **Trial** - Blue badge, trial accounts
4. **Past Due** - Orange badge, past due payments
5. **Cancelled** - Gray badge, cancelled accounts

**Color Coding**:
- Total: Default
- Active: Green (`text-green-600`)
- Trial: Blue (`text-blue-600`)
- Past Due: Orange (`text-orange-600`)
- Cancelled: Gray (`text-gray-600`)

### Filters & Search

**Search Bar**:
- Placeholder: "Search by clinic name..."
- Icon: Search (left-aligned)
- Debounced search (300ms delay)
- Case-insensitive matching

**Subscription Filter**:
- Dropdown with options:
  - All Subscriptions
  - Trial
  - Active
  - Past Due
  - Cancelled
  - Suspended
- Default: "All Subscriptions"

**Sort Options**:
- Dropdown with options:
  - Newest (default) - `created_at DESC`
  - Oldest - `created_at ASC`
  - Name A-Z - `name ASC`

### Tenants Table

**Columns**:

1. **Clinic Name** (sortable)
   - Font: Poppins SemiBold
   - Click behavior: None (use Actions)

2. **Status**
   - Badge with color coding:
     - Trial: Blue (`bg-blue-500`)
     - Active: Green (`bg-green-500`)
     - Past Due: Orange (`bg-orange-500`)
     - Cancelled: Gray (`variant="outline"`)
     - Suspended: Red (`variant="destructive"`)

3. **Created**
   - Format: "3 days ago" (relative)
   - Uses `formatDistanceToNow` from `date-fns`

4. **Leads**
   - Badge showing lead count
   - Example: `<Badge variant="outline">25</Badge>`

5. **DPO**
   - ✅ Green checkmark if DPO configured
   - ⚠️ Orange warning if missing
   - Criteria: `dpo_name && dpo_email && dpo_phone`

6. **Actions**
   - "Details" button - Opens tenant detail page
   - "Stripe" icon button - Opens Stripe dashboard (if available)

**Empty State**:
- Icon: Building
- Message: "No tenants found"
- Contextual: "Try adjusting your filters" (if filters active)

---

## Tenant Detail Page (`/admin/tenants/:id`)

### Navigation

**Back Button**:
- Icon: ArrowLeft
- Text: "Back to Admin Portal"
- Action: Navigate to `/admin`

### Header

**Elements**:
- Tenant name (H1, text-3xl font-semibold)
- Subscription status badge
- Tenant ID (small text)

### Information Cards

#### 1. Subscription Information

**Icon**: CreditCard

**Fields**:
- **Status**: Badge with color
- **Created**: Full date + relative time
  - Format: "January 15, 2025"
  - Subtitle: "3 months ago"
- **Current Period Ends**: Date (if applicable)
- **Stripe Customer ID**: Copyable code block
- **Stripe Subscription ID**: Copyable code block

**Actions**:
- Copy button for each Stripe ID
- "View in Stripe Dashboard" button (opens new tab)

**Stripe URL Format**:
```typescript
const isTestMode = stripeCustomerId.startsWith("cus_test");
const url = `https://dashboard.stripe.com${isTestMode ? "/test" : ""}/customers/${stripeCustomerId}`;
```

#### 2. DPO Information

**Fields**:
- **DPO Name**: Text or "Not set"
- **DPO Email**: Text or "Not set"
- **DPO Phone**: Formatted phone or "Not set"

**Indicators**:
- Warning alert if DPO not configured
- Green "PDPA Compliant" badge if all fields filled

**Phone Formatting**:
Uses `formatPhone()` utility for display:
- Example: `+60123456789` → `+60 12 345 6789`

#### 3. API Access

**Fields**:
- **API Key**: Masked by default
  - Hidden: `••••••••••••••••••••••••••••••••`
  - Visible: Full key displayed
- Show/Hide toggle button (eye icon)
- Copy button

**Security Warning**:
```
This is sensitive information. Only share with the tenant.
```

### Leads Section

**Display**:
- Table showing tenant's leads (read-only)
- Limit: Latest 50 leads
- Sort: Most recent first

**Columns**:
- Name (font-medium)
- Phone (monospace, formatted)
- Email (hidden on mobile, muted)
- Status (StatusBadge component)
- Created (relative time)

**Empty State**:
```
No leads yet
```

**Note**: This is READ-ONLY access. Super admins cannot edit or delete leads.

### Audit Log Section

**Display**:
- Timeline of recent activity
- Limit: Latest 50 events
- Sort: Most recent first

**Event Card Format**:
```
┌────────────────────────────────────┐
│ 📅 [User Name]  [ACTION BADGE]     │
│ 3 hours ago                        │
│ ▸ View details                     │
│   { json details }                 │
└────────────────────────────────────┐
```

**Fields**:
- Icon: Calendar
- User: `profiles.full_name` or "System"
- Action: Badge with action type (replace _ with space)
- Time: Relative time
- Details: Expandable JSON (collapsible)

**Empty State**:
```
No audit entries yet
```

---

## Data Fetching

### Tenants List Query

```typescript
useQuery({
  queryKey: ["admin-tenants", searchTerm, statusFilter, sortBy],
  queryFn: async () => {
    let query = supabase.from("tenants").select(`
      id,
      name,
      subscription_status,
      created_at,
      stripe_customer_id,
      stripe_subscription_id,
      dpo_name,
      dpo_email,
      dpo_phone,
      api_key,
      leads:leads(count)
    `);

    // Apply filters and sorting
    // Super admin automatically bypasses RLS

    return query;
  },
});
```

**Aggregates**:
- Lead count: `leads:leads(count)`
- Returns: `[{ count: 25 }]`
- Access: `tenant.leads?.[0]?.count || 0`

### Tenant Detail Query

```typescript
useQuery({
  queryKey: ["admin-tenant", id],
  queryFn: async () => {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  },
});
```

### Leads Query (Read-Only)

```typescript
useQuery({
  queryKey: ["admin-tenant-leads", id],
  queryFn: async () => {
    const { data } = await supabase
      .from("leads")
      .select("id, name, phone, email, status, created_at")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false })
      .limit(50);
    return data;
  },
});
```

### Audit Log Query

```typescript
useQuery({
  queryKey: ["admin-tenant-audit", id],
  queryFn: async () => {
    const { data: entries } = await supabase
      .from("audit_log")
      .select("id, action, created_at, details, user_id")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch profiles separately
    const withProfiles = await Promise.all(
      entries.map(async (entry) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", entry.user_id)
          .single();
        return { ...entry, profiles: profile };
      })
    );

    return withProfiles;
  },
});
```

---

## Audit Logging

### Actions Logged

All super admin actions are automatically logged:

1. **Viewing Tenant Details**
```typescript
{
  action: "super_admin_view",
  details: {
    action: "viewed_tenant_details",
    tenant_name: "Clinic Name"
  }
}
```

2. **Viewing Tenant Leads**
```typescript
{
  action: "super_admin_view",
  details: {
    action: "viewed_tenant_leads",
    tenant_name: "Clinic Name",
    leads_count: 50
  }
}
```

3. **Accessing Audit Log**
```typescript
{
  action: "super_admin_view",
  details: {
    action: "viewed_tenant_audit",
    tenant_name: "Clinic Name"
  }
}
```

### Audit Log Structure

```typescript
{
  tenant_id: "uuid",
  user_id: "super_admin_uuid",
  action: "super_admin_view",
  resource_id: "tenant_uuid",
  details: { ... },
  created_at: "2025-01-15T10:30:00Z"
}
```

---

## Security Considerations

### RLS Policies

**Super Admin Access**:
```sql
-- Example: super_admin can view all tenants
CREATE POLICY "super_admin_all_tenants" 
ON tenants 
FOR SELECT 
USING (is_super_admin(auth.uid()));
```

**Function**: `is_super_admin(user_id)`
- Security definer function
- Checks `user_roles` table
- Returns boolean
- Prevents recursive RLS

### Data Protection

**Sensitive Information**:
- API keys masked by default
- Stripe IDs only visible to super admin
- Phone numbers formatted (not raw)
- DPO information read-only

**Action Logging**:
- Every super admin action logged
- Immutable audit trail
- Cannot be deleted by super admin
- Includes user, timestamp, and details

### MFA Requirement (Future)

**Production Requirement**:
- Super admin users must enable MFA
- Block access if MFA not configured
- Show setup prompt on first login
- Audit failed MFA attempts

---

## Mobile Responsive

### Breakpoints

**Mobile** (`< 768px`):
- Statistics cards stack vertically
- Table converts to cards
- Actions in dropdown menu
- Simplified detail layout

**Tablet** (`768px - 1024px`):
- Two-column grid for info cards
- Horizontal table with scroll
- Full action buttons

**Desktop** (`> 1024px`):
- Full table layout
- Side-by-side info cards
- All columns visible

---

## Loading States

### Skeleton Loaders

**Tenants List**:
```tsx
{[...Array(5)].map((_, i) => (
  <Skeleton key={i} className="h-16 w-full" />
))}
```

**Detail Page**:
```tsx
<Skeleton className="h-12 w-96" />
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Skeleton className="h-64" />
  <Skeleton className="h-64" />
</div>
```

### Empty States

**No Tenants**:
- Icon: Building
- Heading: "No tenants found"
- Context-aware message

**No Leads**:
- Text: "No leads yet"
- Center-aligned

**No Audit Entries**:
- Text: "No audit entries yet"
- Center-aligned

---

## Error Handling

### Access Denied

**Condition**: `userRole !== "super_admin"`

**Display**:
```tsx
<Shield className="h-16 w-16 text-muted-foreground mb-4" />
<h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
<p className="text-muted-foreground mb-6">
  This page is only accessible to Super Admins.
</p>
<Button onClick={() => navigate("/dashboard")}>
  Go to Dashboard
</Button>
```

### Tenant Not Found

**Condition**: Tenant ID not found in database

**Display**:
```tsx
<AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
<h1 className="text-2xl font-semibold mb-2">Tenant Not Found</h1>
<p className="text-muted-foreground mb-6">
  The tenant you're looking for doesn't exist.
</p>
<Button onClick={() => navigate("/admin")}>
  Back to Admin Portal
</Button>
```

### API Errors

**Toast Notifications**:
- Success: "API key copied to clipboard"
- Error: "No Stripe customer ID available"
- Warning: Toast for failed operations

---

## Component Structure

```
Admin.tsx
├── DashboardLayout
│   ├── Header (Title + Badge + Description)
│   ├── Warning Alert
│   ├── Statistics Cards (5)
│   ├── Filters Row
│   │   ├── Search Input
│   │   ├── Status Filter Select
│   │   └── Sort Select
│   └── Tenants Table Card
│       ├── Table Header
│       ├── Table Body
│       └── Actions Column

AdminTenantDetail.tsx
├── DashboardLayout
│   ├── Back Button
│   ├── Header (Name + Badge + ID)
│   ├── Info Cards Grid
│   │   ├── Subscription Card
│   │   ├── DPO Card
│   │   └── API Access Card
│   ├── Leads Table Card
│   └── Audit Log Card
```

---

## Design System

### Typography
- Page Title: `text-3xl font-semibold`
- Card Title: `CardTitle` component
- Description: `text-muted-foreground`
- Labels: `text-sm text-muted-foreground`

### Colors
- Primary: `#e9204f` (brand red)
- Success: `bg-green-500`
- Warning: `bg-orange-500`
- Danger: `bg-destructive`
- Trial: `bg-blue-500`

### Spacing
- Page container: `space-y-6`
- Card spacing: `space-y-4`
- Form fields: `space-y-2`
- Info cards grid: `grid gap-6`

---

## Best Practices

### Security
✅ Role-based access control
✅ All actions logged
✅ Read-only access to sensitive data
✅ API keys masked by default
✅ RLS policies enforced

### UX
✅ Clear visual hierarchy
✅ Contextual empty states
✅ Loading skeletons
✅ Toast notifications
✅ Responsive design

### Performance
✅ Query caching with React Query
✅ Debounced search
✅ Paginated results (50 limit)
✅ Lazy loading for detail pages

---

## Testing Checklist

### Admin Dashboard
- [ ] Access denied for non-super-admins
- [ ] Statistics cards show correct counts
- [ ] Search filters tenants by name
- [ ] Status filter works correctly
- [ ] Sort options work (newest, oldest, name)
- [ ] Subscription badges color-coded
- [ ] Leads count displayed
- [ ] DPO status indicator (✅ or ⚠️)
- [ ] Details button navigates to detail page
- [ ] Stripe button opens correct URL
- [ ] Empty state shown when no tenants

### Tenant Detail Page
- [ ] Back button returns to admin
- [ ] Subscription info displayed
- [ ] Stripe IDs copyable
- [ ] View in Stripe opens new tab
- [ ] DPO info shown correctly
- [ ] DPO warning if incomplete
- [ ] API key masked by default
- [ ] Show/hide toggle works
- [ ] Copy API key works
- [ ] Leads table shows data (read-only)
- [ ] Audit log shows events
- [ ] Expandable details work
- [ ] Tenant not found handled

### Audit Logging
- [ ] View tenant details logged
- [ ] View tenant leads logged
- [ ] View audit log logged
- [ ] Super admin user ID recorded
- [ ] Timestamp accurate
- [ ] Details JSON correct

### Mobile Responsive
- [ ] Statistics stack on mobile
- [ ] Table converts to cards
- [ ] Detail cards stack
- [ ] Actions accessible
- [ ] Touch targets adequate

---

## Future Enhancements

1. **Advanced Filters**
   - Date range picker
   - Multiple status selection
   - Plan type filter

2. **Bulk Actions**
   - Mass status update
   - Export multiple tenants
   - Send notifications

3. **Analytics Dashboard**
   - Subscription trends
   - Churn rate
   - Revenue metrics
   - Lead conversion rates

4. **Tenant Impersonation**
   - "Login as" feature for support
   - Auto-logout after session
   - Clearly marked impersonation mode

5. **System Health**
   - API response times
   - Error rate monitoring
   - Database performance
   - Service status

6. **Notifications**
   - Email on new tenant signup
   - Slack alerts for past due
   - Daily summary report

7. **Export Capabilities**
   - CSV export of all tenants
   - Audit log export
   - Financial reports

---

## Related Documentation

- [Authentication & Roles](./AUTHENTICATION.md)
- [Audit Logging](./AUDIT_LOG.md)
- [RLS Policies](./RLS_POLICIES.md)
- [Stripe Integration](./STRIPE_INTEGRATION.md)
