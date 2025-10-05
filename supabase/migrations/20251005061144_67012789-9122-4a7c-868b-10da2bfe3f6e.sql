-- ============================================
-- LAMINIHUB BILLING & SUBSCRIPTION SCHEMA
-- ============================================

-- 1. Add new billing columns to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS plan_code TEXT DEFAULT 'crm_basic',
ADD COLUMN IF NOT EXISTS is_comped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comp_reason TEXT,
ADD COLUMN IF NOT EXISTS comp_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS seat_limit INTEGER,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 2. Extend subscription_status enum with new values
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'inactive';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'trialing';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'canceled';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'comped';

-- 3. Extend user_role enum with new role names
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tenant_owner';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tenant_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tenant_member';

-- 4. Create indexes for faster billing lookups
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer ON public.tenants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON public.tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_code ON public.tenants(plan_code);
CREATE INDEX IF NOT EXISTS idx_tenants_is_comped ON public.tenants(is_comped) WHERE is_comped = true;

-- 5. Add comments for documentation
COMMENT ON COLUMN public.tenants.subscription_status IS 'Status: inactive (new), active (paid/comped), trialing (trial), past_due (payment failed), canceled (ended), comped (manually granted), suspended (grace expired). Legacy: trial, cancelled';
COMMENT ON COLUMN public.tenants.plan_code IS 'Plan: crm_basic (current), crm_pro (future), crm_enterprise (future)';
COMMENT ON COLUMN public.tenants.is_comped IS 'TRUE if access granted without payment (Google Ads bundle, partnerships, etc)';
COMMENT ON TYPE user_role IS 'Roles: super_admin (platform), tenant_owner (billing+all), tenant_admin (users+settings+leads), tenant_member (leads only). Legacy: clinic_admin, clinic_user';