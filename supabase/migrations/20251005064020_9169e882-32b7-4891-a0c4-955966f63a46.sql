-- Fix 1: Create security definer function to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Fix 2: Drop and recreate profiles RLS policies without recursion
DROP POLICY IF EXISTS "admins_view_tenant_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_tenant_profiles" ON public.profiles;

CREATE POLICY "admins_view_tenant_profiles" ON public.profiles
FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "admins_update_tenant_profiles" ON public.profiles
FOR UPDATE USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) 
  AND public.is_admin(auth.uid())
);

-- Fix 3: Explicit DENY policy for anonymous access to leads (PII protection)
CREATE POLICY "deny_anonymous_access_to_leads" ON public.leads
FOR ALL TO anon
USING (false);

-- Fix 4: Add explicit DENY policy for anonymous access to tenants (billing data protection)
CREATE POLICY "deny_anonymous_access_to_tenants" ON public.tenants
FOR ALL TO anon
USING (false);

-- Fix 5: Update all security definer functions to have explicit search_path
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

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_suspend_expired_grace_periods()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tenants
  SET subscription_status = 'suspended'
  WHERE subscription_status = 'past_due'
    AND grace_period_ends_at IS NOT NULL
    AND grace_period_ends_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_past_due_grace_period()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grace_days integer;
BEGIN
  IF NEW.subscription_status = 'past_due' AND OLD.subscription_status != 'past_due' THEN
    SELECT grace_period_days INTO _grace_days
    FROM public.subscription_config
    WHERE plan_type = NEW.plan_type;
    
    NEW.grace_period_ends_at := now() + (_grace_days || ' days')::interval;
  END IF;
  
  IF NEW.subscription_status != 'past_due' THEN
    NEW.grace_period_ends_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_property_usage(p_tenant_id uuid, p_entity text, p_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.property_definitions
  SET 
    usage_count = COALESCE(usage_count, 0) + 1,
    last_seen_at = now()
  WHERE tenant_id = p_tenant_id
    AND entity = p_entity
    AND key = p_key;
END;
$$;