-- Phase 1 Critical Security Fix: Enforce Tenant Isolation on Leads Table
-- This RESTRICTIVE policy ensures users can ONLY access their own tenant's data
-- even if other policies have bugs or logic flaws

-- Step 1: Drop the ineffective deny_anonymous_access_to_leads policy
-- This policy uses USING (false) which doesn't actually prevent authenticated users
-- from accessing data if other permissive policies grant access
DROP POLICY IF EXISTS "deny_anonymous_access_to_leads" ON public.leads;

-- Step 2: Create a RESTRICTIVE policy to enforce tenant isolation at the database level
-- RESTRICTIVE policies are combined with AND logic, meaning they MUST pass
-- in addition to any permissive policies
CREATE POLICY "enforce_tenant_isolation_leads" ON public.leads
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  -- User can only access leads from their own tenant
  tenant_id = get_user_tenant_id(auth.uid())
  -- OR user is a super admin (can access all tenants)
  OR is_super_admin(auth.uid())
);

-- Step 3: Add a simple policy to block all anonymous access
-- This replaces the old deny_anonymous_access_to_leads with a cleaner approach
CREATE POLICY "block_anonymous_access_to_leads" ON public.leads
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Add audit log entry for this security enhancement
COMMENT ON POLICY "enforce_tenant_isolation_leads" ON public.leads IS 
'RESTRICTIVE policy ensuring users can only access their own tenant data. Added as critical security fix to prevent cross-tenant data exposure.';