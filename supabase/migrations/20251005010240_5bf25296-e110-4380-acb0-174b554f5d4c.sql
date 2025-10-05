-- =====================================================
-- Drop Existing Schema
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can view all clinics" ON public.clinics;
DROP POLICY IF EXISTS "Users can view their own clinic" ON public.clinics;
DROP POLICY IF EXISTS "Super admins can insert clinics" ON public.clinics;
DROP POLICY IF EXISTS "Clinic owners can update their clinic" ON public.clinics;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Clinic owners can view their staff profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view leads from their clinic" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads to their clinic" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads in their clinic" ON public.leads;
DROP POLICY IF EXISTS "Clinic owners can delete leads in their clinic" ON public.leads;
DROP POLICY IF EXISTS "Users can view consent logs from their clinic" ON public.consent_logs;
DROP POLICY IF EXISTS "Users can insert consent logs to their clinic" ON public.consent_logs;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Clinic owners can view their clinic audit logs" ON public.audit_logs;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_clinics_updated_at ON public.clinics;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);
DROP FUNCTION IF EXISTS public.get_user_clinic_id(UUID);
DROP FUNCTION IF EXISTS public.is_clinic_owner(UUID);

-- Drop tables
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.consent_logs CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;

-- Drop enums
DROP TYPE IF EXISTS public.consent_type;
DROP TYPE IF EXISTS public.lead_status;
DROP TYPE IF EXISTS public.app_role;

-- =====================================================
-- Create New Simplified Schema
-- =====================================================

-- Create Enums
CREATE TYPE public.user_role AS ENUM ('super_admin', 'clinic_admin', 'clinic_user', 'view_only');
CREATE TYPE public.lead_status AS ENUM ('new_inquiry', 'contacted', 'qualified', 'converted', 'lost');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'cancelled', 'past_due');

-- Tenants Table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  subscription_status public.subscription_status NOT NULL DEFAULT 'trial',
  api_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64'),
  dpo_name TEXT,
  dpo_email TEXT,
  dpo_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles Table
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  role public.user_role NOT NULL DEFAULT 'clinic_user',
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads Table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT,
  status public.lead_status NOT NULL DEFAULT 'new_inquiry',
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  consent_ip TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log Table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Tenants indexes
CREATE INDEX idx_tenants_stripe_customer_id ON public.tenants(stripe_customer_id);

-- Profiles indexes
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Leads indexes (critical for multi-tenant performance)
CREATE INDEX idx_leads_tenant_id_created_at ON public.leads(tenant_id, created_at DESC);
CREATE INDEX idx_leads_tenant_id_phone ON public.leads(tenant_id, phone);
CREATE INDEX idx_leads_tenant_id_email ON public.leads(tenant_id, email);
CREATE INDEX idx_leads_tenant_id_status ON public.leads(tenant_id, status);
CREATE INDEX idx_leads_created_by ON public.leads(created_by);
CREATE INDEX idx_leads_modified_by ON public.leads(modified_by);

-- Audit log indexes
CREATE INDEX idx_audit_log_tenant_id_created_at ON public.audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_resource_id ON public.audit_log(resource_id);

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, tenant_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, (SELECT id FROM public.tenants LIMIT 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'clinic_user')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Row-Level Security Policies
-- =====================================================

-- Tenants RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can insert tenants"
ON public.tenants FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Admins can update their tenant"
ON public.tenants FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'clinic_admin')
  )
);

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view profiles in their tenant"
ON public.profiles FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'clinic_admin')
  )
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update profiles in their tenant"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'clinic_admin')
  )
);

-- Leads RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads in their tenant"
ON public.leads FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert leads to their tenant"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update leads in their tenant"
ON public.leads FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
  )
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'clinic_admin', 'clinic_user')
    )
  )
);

CREATE POLICY "Admins can delete leads in their tenant"
ON public.leads FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'clinic_admin')
  )
);

-- Audit Log RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs in their tenant"
ON public.audit_log FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'clinic_admin')
  )
);

CREATE POLICY "Users can insert audit logs to their tenant"
ON public.audit_log FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
  )
);