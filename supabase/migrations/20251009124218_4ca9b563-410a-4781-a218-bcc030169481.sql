-- ================================================================
-- SECURITY FIX: Restrict access to sensitive tenant data
-- ================================================================
-- Problem: All users in a tenant could see API keys and Stripe credentials
-- Solution: Only admins can query tenants table directly, regular users must use get_tenant_safe()

-- Drop the overly permissive policy that allows all users to see sensitive data
DROP POLICY IF EXISTS "users_own_tenant" ON public.tenants;

-- Create new policy: Only admins (clinic_admin and super_admin) can SELECT all columns
CREATE POLICY "admins_view_tenant_all_columns"
ON public.tenants
FOR SELECT
USING (
  -- User must be in this tenant AND be an admin
  (id IN (
    SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
  ))
  AND is_admin(auth.uid())
);

-- ================================================================
-- SECURITY EXPLANATION:
-- ================================================================
-- ✅ clinic_admin and super_admin: Can query tenants table directly (need access for settings management)
-- ✅ clinic_user: Cannot query tenants directly, must use get_tenant_safe() function which filters:
--    - api_key, api_key_hash, api_key_prefix, old_api_key_hash
--    - stripe_customer_id, stripe_subscription_id
--    - billing_email, seat_limit, dpo_name, dpo_email, dpo_phone
--
-- This prevents regular users from stealing API keys or accessing billing information.
-- ================================================================