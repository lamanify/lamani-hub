-- Step 1: Drop ALL existing RLS policies first to remove dependencies on profiles.role
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can insert tenants" ON public.tenants;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their tenant" ON public.profiles;

DROP POLICY IF EXISTS "Users can view leads in their tenant" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads to their tenant" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads in their tenant" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads in their tenant" ON public.leads;

DROP POLICY IF EXISTS "Admins can view audit logs in their tenant" ON public.audit_log;
DROP POLICY IF EXISTS "Users can insert audit logs to their tenant" ON public.audit_log;

-- Step 2: Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'clinic_admin')
  )
$$;

-- Step 4: Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 5: Update handle_new_user trigger to populate user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role user_role;
  _tenant_id uuid;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'clinic_user');
  _tenant_id := COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, (SELECT id FROM public.tenants LIMIT 1));
  
  INSERT INTO public.profiles (user_id, full_name, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    _tenant_id
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;

-- Step 6: Drop the role column from profiles (safe now that policies are removed)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Step 7: Create secure RLS policies for TENANTS
CREATE POLICY "super_admin_all_tenants"
ON public.tenants FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "users_own_tenant"
ON public.tenants FOR SELECT
USING (id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "admins_update_tenant"
ON public.tenants FOR UPDATE
USING (
  id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  AND public.is_admin(auth.uid())
);

CREATE POLICY "super_admins_insert_tenants"
ON public.tenants FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

-- Step 8: Create secure RLS policies for PROFILES
CREATE POLICY "users_own_profile"
ON public.profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "admins_view_tenant_profiles"
ON public.profiles FOR SELECT
USING (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  AND public.is_admin(auth.uid())
);

CREATE POLICY "users_insert_own_profile"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins_update_tenant_profiles"
ON public.profiles FOR UPDATE
USING (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  AND public.is_admin(auth.uid())
);

-- Step 9: Create secure RLS policies for LEADS
CREATE POLICY "super_admin_all_leads"
ON public.leads FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "users_own_tenant_leads_select"
ON public.leads FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "users_insert_tenant_leads"
ON public.leads FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "users_update_tenant_leads"
ON public.leads FOR UPDATE
USING (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'clinic_admin')
    OR public.has_role(auth.uid(), 'clinic_user')
  )
);

CREATE POLICY "admins_delete_tenant_leads"
ON public.leads FOR DELETE
USING (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  AND public.is_admin(auth.uid())
);

-- Step 10: Create secure RLS policies for AUDIT_LOG
CREATE POLICY "super_admin_all_audit"
ON public.audit_log FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "users_view_tenant_audit"
ON public.audit_log FOR SELECT
USING (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  AND public.is_admin(auth.uid())
);

CREATE POLICY "users_insert_audit"
ON public.audit_log FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

-- Step 11: Create RLS policies for USER_ROLES table
CREATE POLICY "users_view_own_roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "super_admins_view_all_roles"
ON public.user_roles FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admins_manage_roles"
ON public.user_roles FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));