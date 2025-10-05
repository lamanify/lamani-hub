-- Phase 1 Critical Security Fix: Block Anonymous Access on All Sensitive Tables
-- Add RESTRICTIVE policies to prevent anonymous users from accessing sensitive data

-- ============================================================================
-- AUDIT_LOG TABLE
-- ============================================================================
CREATE POLICY "block_anonymous_access_to_audit_log" ON public.audit_log
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "block_anonymous_access_to_audit_log" ON public.audit_log IS 
'RESTRICTIVE policy blocking all anonymous access to audit logs. Critical security measure.';

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE POLICY "block_anonymous_access_to_profiles" ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "block_anonymous_access_to_profiles" ON public.profiles IS 
'RESTRICTIVE policy blocking all anonymous access to user profiles. Critical security measure.';

-- ============================================================================
-- PROPERTY_DEFINITIONS TABLE
-- ============================================================================
CREATE POLICY "block_anonymous_access_to_property_definitions" ON public.property_definitions
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "block_anonymous_access_to_property_definitions" ON public.property_definitions IS 
'RESTRICTIVE policy blocking all anonymous access to property definitions. Critical security measure.';

-- ============================================================================
-- WEBHOOK_EVENTS TABLE
-- ============================================================================
CREATE POLICY "block_anonymous_access_to_webhook_events" ON public.webhook_events
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "block_anonymous_access_to_webhook_events" ON public.webhook_events IS 
'RESTRICTIVE policy blocking all anonymous access to webhook events. Critical security measure.';

-- ============================================================================
-- USER_ROLES TABLE
-- ============================================================================
CREATE POLICY "block_anonymous_access_to_user_roles" ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "block_anonymous_access_to_user_roles" ON public.user_roles IS 
'RESTRICTIVE policy blocking all anonymous access to user roles. Critical security measure to prevent privilege escalation.';

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
CREATE POLICY "block_anonymous_access_to_tenants" ON public.tenants
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "block_anonymous_access_to_tenants" ON public.tenants IS 
'RESTRICTIVE policy blocking all anonymous access to tenant data including API keys. Critical security measure.';