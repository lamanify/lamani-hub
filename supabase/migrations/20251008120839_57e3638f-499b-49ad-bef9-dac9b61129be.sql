-- Allow super admins to update any tenant's subscription status
CREATE POLICY "super_admin_update_tenants"
ON public.tenants
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));