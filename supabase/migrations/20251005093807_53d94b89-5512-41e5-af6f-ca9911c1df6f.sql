-- Phase 3A: Critical Data Access Controls

-- 1. Fix webhook_events: Restrict inserts to service role only (not public)
DROP POLICY IF EXISTS "system_insert_webhooks" ON public.webhook_events;
CREATE POLICY "service_role_insert_webhooks" ON public.webhook_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 2. Fix processed_stripe_events: Restrict inserts to service role only
DROP POLICY IF EXISTS "system_insert_processed_events" ON public.processed_stripe_events;
CREATE POLICY "service_role_insert_processed_events" ON public.processed_stripe_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 3. Fix subscription_config: Restrict to authenticated users (not public)
DROP POLICY IF EXISTS "Anyone can read subscription config" ON public.subscription_config;
CREATE POLICY "authenticated_users_view_subscription_config" ON public.subscription_config
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 4. Add security comments for column-level restrictions (enforced at app layer)
COMMENT ON COLUMN public.tenants.api_key IS 'SECURITY: Admin-only field. Must be filtered in application layer for non-admin users.';
COMMENT ON COLUMN public.tenants.stripe_customer_id IS 'SECURITY: Admin-only field. Must be filtered in application layer for non-admin users.';
COMMENT ON COLUMN public.tenants.stripe_subscription_id IS 'SECURITY: Admin-only field. Must be filtered in application layer for non-admin users.';
COMMENT ON COLUMN public.tenants.billing_email IS 'SECURITY: Admin-only field. Must be filtered in application layer for non-admin users.';

-- 5. Add helper function to safely get tenant data for non-admins (masks sensitive fields)
CREATE OR REPLACE FUNCTION public.get_tenant_safe(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  subscription_status subscription_status,
  plan_type text,
  plan_code text,
  trial_ends_at timestamp with time zone,
  subscription_current_period_end timestamp with time zone,
  grace_period_ends_at timestamp with time zone,
  is_comped boolean,
  comp_expires_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.name,
    t.subscription_status,
    t.plan_type,
    t.plan_code,
    t.trial_ends_at,
    t.subscription_current_period_end,
    t.grace_period_ends_at,
    t.is_comped,
    t.comp_expires_at,
    t.created_at,
    t.updated_at
  FROM public.tenants t
  INNER JOIN public.profiles p ON p.tenant_id = t.id
  WHERE p.user_id = p_user_id;
$$;