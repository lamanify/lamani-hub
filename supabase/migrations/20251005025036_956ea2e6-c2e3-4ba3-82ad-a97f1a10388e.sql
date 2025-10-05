-- Add 'suspended' to subscription_status enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'suspended';

-- Create subscription_config table
CREATE TABLE IF NOT EXISTS public.subscription_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type text NOT NULL UNIQUE,
  trial_duration_days integer NOT NULL DEFAULT 14,
  grace_period_days integer NOT NULL DEFAULT 7,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_config
ALTER TABLE public.subscription_config ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read subscription config
CREATE POLICY "Anyone can read subscription config"
ON public.subscription_config
FOR SELECT
TO authenticated
USING (true);

-- Only super admins can modify subscription config
CREATE POLICY "Super admins can manage subscription config"
ON public.subscription_config
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Insert default config values
INSERT INTO public.subscription_config (plan_type, trial_duration_days, grace_period_days)
VALUES 
  ('default', 14, 7),
  ('beta', 90, 7)
ON CONFLICT (plan_type) DO NOTHING;

-- Add plan_type and grace_period_ends_at to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'default' REFERENCES public.subscription_config(plan_type),
ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamp with time zone;

-- Create function to auto-suspend tenants with expired grace periods
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

-- Create function to set grace period when status changes to past_due
CREATE OR REPLACE FUNCTION public.handle_past_due_grace_period()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grace_days integer;
BEGIN
  -- If status changed to past_due, set grace period end date
  IF NEW.subscription_status = 'past_due' AND OLD.subscription_status != 'past_due' THEN
    -- Get grace period days from config
    SELECT grace_period_days INTO _grace_days
    FROM public.subscription_config
    WHERE plan_type = NEW.plan_type;
    
    -- Set grace period end date
    NEW.grace_period_ends_at := now() + (_grace_days || ' days')::interval;
  END IF;
  
  -- Clear grace period if status is not past_due
  IF NEW.subscription_status != 'past_due' THEN
    NEW.grace_period_ends_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for grace period handling
DROP TRIGGER IF EXISTS handle_past_due_grace_period_trigger ON public.tenants;
CREATE TRIGGER handle_past_due_grace_period_trigger
BEFORE UPDATE OF subscription_status ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.handle_past_due_grace_period();