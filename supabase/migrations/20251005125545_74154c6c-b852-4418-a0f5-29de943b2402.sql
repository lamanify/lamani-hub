-- Restrict subscription_config access to super_admins only
-- This prevents competitors from seeing pricing strategy, trial periods, and grace periods

-- Drop the existing policy that allows all authenticated users to view subscription config
DROP POLICY IF EXISTS "authenticated_users_view_subscription_config" ON public.subscription_config;

-- Create a more restrictive policy: only super_admins can view subscription config
CREATE POLICY "super_admins_view_subscription_config" 
ON public.subscription_config 
FOR SELECT 
TO authenticated
USING (is_super_admin(auth.uid()));

-- Super admins can still manage subscription config (this policy already exists but we'll recreate it for clarity)
DROP POLICY IF EXISTS "Super admins can manage subscription config" ON public.subscription_config;

CREATE POLICY "super_admins_manage_subscription_config" 
ON public.subscription_config 
FOR ALL 
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));