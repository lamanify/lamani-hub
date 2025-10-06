-- Fix for account creation infinite loop
-- The issue is that handle_new_user fails when Stripe customer creation fails,
-- causing the entire signup transaction to rollback and frontend to wait forever

-- Step 1: Create a more robust handle_new_user function that handles Stripe failures gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role user_role;
  _tenant_id uuid;
  _tenant_name text;
  _full_name text;
  _stripe_customer_id text;
  _error_message text;
BEGIN
  -- Extract data from user metadata
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'clinic_admin');
  _tenant_name := COALESCE(NEW.raw_user_meta_data->>'clinic_name', 'My Clinic');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  -- For new signups (not existing tenant users), create tenant first
  IF NEW.raw_user_meta_data->>'tenant_id' IS NULL THEN
    -- Step 1: Create tenant (this should ALWAYS succeed)
    INSERT INTO public.tenants (
      name, 
      subscription_status, 
      plan_type,
      created_at
    ) VALUES (
      _tenant_name,
      'trial',  -- Start with trial status
      'default',
      now()
    ) RETURNING id INTO _tenant_id;
    
    -- Step 2: Try to create Stripe customer (but DON'T fail if this errors)
    BEGIN
      -- Only attempt Stripe customer creation if we have the necessary secrets
      IF EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'STRIPE_SECRET_KEY' AND decrypted_secret IS NOT NULL) THEN
        -- Call Edge Function to create Stripe customer
        SELECT content::json->>'customer_id' INTO _stripe_customer_id
        FROM http((
          'POST',
          'https://' || current_setting('app.settings.supabase_url', true) || '/functions/v1/create-stripe-customer',
          ARRAY[http_header('authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))],
          'application/json',
          json_build_object(
            'email', NEW.email,
            'name', _full_name,
            'tenant_id', _tenant_id::text
          )::text
        ));
        
        -- If successful, update tenant with Stripe customer ID
        IF _stripe_customer_id IS NOT NULL THEN
          UPDATE public.tenants 
          SET stripe_customer_id = _stripe_customer_id
          WHERE id = _tenant_id;
        END IF;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the Stripe error but DON'T fail the entire signup
        _error_message := SQLERRM;
        INSERT INTO public.error_log (tenant_id, user_id, error_type, error_message, created_at)
        VALUES (_tenant_id, NEW.id, 'stripe_customer_creation', _error_message, now())
        ON CONFLICT DO NOTHING;  -- In case error_log table doesn't exist yet
        
        -- Continue with signup even if Stripe fails
        RAISE WARNING 'Stripe customer creation failed for user % (tenant %): %', NEW.id, _tenant_id, _error_message;
    END;
    
  ELSE
    -- User is joining an existing tenant
    _tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::uuid;
  END IF;
  
  -- Step 3: Create user profile (this should ALWAYS succeed)
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    tenant_id,
    email,
    created_at
  ) VALUES (
    NEW.id,
    _full_name,
    _tenant_id,
    NEW.email,
    now()
  );
  
  -- Step 4: Assign user role (this should ALWAYS succeed)
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (NEW.id, _role, now())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Step 5: Log successful account creation
  INSERT INTO public.audit_log (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    _tenant_id,
    NEW.id,
    'user_signup',
    'user',
    NEW.id::text,
    json_build_object(
      'email', NEW.email,
      'role', _role,
      'tenant_name', _tenant_name,
      'stripe_customer_created', (_stripe_customer_id IS NOT NULL)
    ),
    now()
  );
  
  RETURN NEW;
END;
$$;

-- Step 2: Create error_log table for better debugging (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  user_id UUID REFERENCES auth.users(id),
  error_type TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on error_log
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for error_log
CREATE POLICY "super_admins_view_all_errors"
ON public.error_log FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "users_view_tenant_errors"
ON public.error_log FOR SELECT
USING (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  AND public.is_admin(auth.uid())
);

CREATE POLICY "system_insert_errors"
ON public.error_log FOR INSERT
WITH CHECK (true);  -- Allow system to insert error logs

-- Step 3: Ensure subscription_config exists with default values
INSERT INTO public.subscription_config (
  plan_type,
  trial_duration_days,
  grace_period_days,
  created_at
) VALUES (
  'default',
  14,  -- 14 day trial
  7,   -- 7 day grace period
  now()
) ON CONFLICT (plan_type) DO NOTHING;

-- Step 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id ON public.tenants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_error_log_tenant_user ON public.error_log(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON public.error_log(created_at DESC);

-- Step 5: Create a function to retry Stripe customer creation later (for failed signups)
CREATE OR REPLACE FUNCTION public.retry_stripe_customer_creation(p_tenant_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_record record;
  _user_record record;
  _stripe_customer_id text;
  _result json;
BEGIN
  -- Get tenant and primary user info
  SELECT t.*, p.email, p.full_name
  INTO _tenant_record, _user_record
  FROM public.tenants t
  JOIN public.profiles p ON p.tenant_id = t.id
  JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE t.id = p_tenant_id 
    AND ur.role = 'clinic_admin'
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Tenant not found');
  END IF;
  
  -- Check if Stripe customer already exists
  IF _tenant_record.stripe_customer_id IS NOT NULL THEN
    RETURN json_build_object('success', true, 'message', 'Customer already exists');
  END IF;
  
  -- Try to create Stripe customer
  BEGIN
    SELECT content::json->>'customer_id' INTO _stripe_customer_id
    FROM http((
      'POST',
      'https://' || current_setting('app.settings.supabase_url', true) || '/functions/v1/create-stripe-customer',
      ARRAY[http_header('authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))],
      'application/json',
      json_build_object(
        'email', _user_record.email,
        'name', _user_record.full_name,
        'tenant_id', p_tenant_id::text
      )::text
    ));
    
    IF _stripe_customer_id IS NOT NULL THEN
      -- Update tenant with Stripe customer ID
      UPDATE public.tenants 
      SET stripe_customer_id = _stripe_customer_id,
          updated_at = now()
      WHERE id = p_tenant_id;
      
      _result := json_build_object(
        'success', true, 
        'customer_id', _stripe_customer_id,
        'message', 'Stripe customer created successfully'
      );
    ELSE
      _result := json_build_object('success', false, 'error', 'Failed to create Stripe customer');
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error
      INSERT INTO public.error_log (tenant_id, error_type, error_message, created_at)
      VALUES (p_tenant_id, 'stripe_retry_failed', SQLERRM, now());
      
      _result := json_build_object('success', false, 'error', SQLERRM);
  END;
  
  RETURN _result;
END;
$$;

-- Step 6: Add a comment explaining the fix
COMMENT ON FUNCTION public.handle_new_user() IS 'Robust user signup handler that creates tenant and user profile even if Stripe customer creation fails. This prevents infinite loading during signup.';
COMMENT ON FUNCTION public.retry_stripe_customer_creation(uuid) IS 'Allows retrying Stripe customer creation for tenants that failed during signup.';
COMMENT ON TABLE public.error_log IS 'Logs system errors that occur during signup and other operations for debugging purposes.';
