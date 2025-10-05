-- Fix leads table RLS policies to explicitly block anonymous access
-- Drop existing policies
DROP POLICY IF EXISTS "super_admin_all_leads" ON public.leads;
DROP POLICY IF EXISTS "users_own_tenant_leads_select" ON public.leads;
DROP POLICY IF EXISTS "users_insert_tenant_leads" ON public.leads;
DROP POLICY IF EXISTS "users_update_tenant_leads" ON public.leads;
DROP POLICY IF EXISTS "admins_delete_tenant_leads" ON public.leads;
DROP POLICY IF EXISTS "enforce_tenant_isolation_leads" ON public.leads;
DROP POLICY IF EXISTS "block_anonymous_access_to_leads" ON public.leads;

-- Recreate policies with explicit authentication checks
-- Super admins can view all leads (must be authenticated)
CREATE POLICY "super_admin_all_leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND is_super_admin(auth.uid())
);

-- Users can view leads in their own tenant (must be authenticated)
CREATE POLICY "users_own_tenant_leads_select" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id IN (
    SELECT profiles.tenant_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- Users can insert leads in their own tenant (must be authenticated)
CREATE POLICY "users_insert_tenant_leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id IN (
    SELECT profiles.tenant_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- Users with proper roles can update leads in their tenant (must be authenticated)
CREATE POLICY "users_update_tenant_leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id IN (
    SELECT profiles.tenant_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'super_admin'::user_role) 
    OR has_role(auth.uid(), 'clinic_admin'::user_role) 
    OR has_role(auth.uid(), 'clinic_user'::user_role)
  )
);

-- Admins can delete leads in their tenant (must be authenticated)
CREATE POLICY "admins_delete_tenant_leads" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id IN (
    SELECT profiles.tenant_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
  AND is_admin(auth.uid())
);

-- Enforce tenant isolation for all operations (must be authenticated)
CREATE POLICY "enforce_tenant_isolation_leads" 
ON public.leads 
FOR ALL 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    tenant_id = get_user_tenant_id(auth.uid()) 
    OR is_super_admin(auth.uid())
  )
);

-- Explicitly deny all anonymous access (anon role)
CREATE POLICY "deny_anonymous_access_to_leads" 
ON public.leads 
FOR ALL 
TO anon
USING (false);