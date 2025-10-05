-- =====================================================
-- LamaniHub Multi-Tenant Database Schema
-- Healthcare CRM with Row-Level Security
-- =====================================================

-- Create Enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'clinic_owner', 'clinic_staff');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
CREATE TYPE public.consent_type AS ENUM ('marketing', 'data_processing', 'communication');

-- =====================================================
-- Core Tables
-- =====================================================

-- Clinics Table (Tenant Table)
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles Table (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles Table (SEPARATE - Prevents privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Leads Table (Main CRM Data)
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT,
  status public.lead_status NOT NULL DEFAULT 'new',
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consent Logs Table (PDPA Compliance)
CREATE TABLE public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  consent_type public.consent_type NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs Table (Compliance Tracking)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Security Definer Functions (Prevent RLS Recursion)
-- =====================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user's clinic_id
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Check if user is clinic owner
CREATE OR REPLACE FUNCTION public.is_clinic_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'clinic_owner')
$$;

-- =====================================================
-- Row-Level Security Policies
-- =====================================================

-- Clinics RLS
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all clinics"
ON public.clinics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own clinic"
ON public.clinics FOR SELECT
TO authenticated
USING (id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Super admins can insert clinics"
ON public.clinics FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clinic owners can update their clinic"
ON public.clinics FOR UPDATE
TO authenticated
USING (id = public.get_user_clinic_id(auth.uid()) AND public.is_clinic_owner(auth.uid()));

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Clinic owners can view their staff profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) 
  AND public.is_clinic_owner(auth.uid())
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- User Roles RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Leads RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads from their clinic"
ON public.leads FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert leads to their clinic"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update leads in their clinic"
ON public.leads FOR UPDATE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Clinic owners can delete leads in their clinic"
ON public.leads FOR DELETE
TO authenticated
USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) 
  AND public.is_clinic_owner(auth.uid())
);

-- Consent Logs RLS
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consent logs from their clinic"
ON public.consent_logs FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert consent logs to their clinic"
ON public.consent_logs FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Audit Logs RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clinic owners can view their clinic audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) 
  AND public.is_clinic_owner(auth.uid())
);

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Clinic isolation indexes
CREATE INDEX idx_profiles_clinic_id ON public.profiles(clinic_id);
CREATE INDEX idx_leads_clinic_id ON public.leads(clinic_id);
CREATE INDEX idx_consent_logs_clinic_id ON public.consent_logs(clinic_id);
CREATE INDEX idx_audit_logs_clinic_id ON public.audit_logs(clinic_id);

-- Foreign key indexes
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_created_by ON public.leads(created_by);
CREATE INDEX idx_consent_logs_lead_id ON public.consent_logs(lead_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Status and timestamp indexes
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_consent_logs_consent_type ON public.consent_logs(consent_type);