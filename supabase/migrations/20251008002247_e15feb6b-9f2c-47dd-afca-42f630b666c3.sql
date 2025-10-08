-- Phase 1: Fix RLS policy for subscription_config
-- Allow authenticated users to read subscription configuration
-- This is necessary for the app to verify subscription status on login

CREATE POLICY "authenticated_users_view_subscription_config"
ON public.subscription_config
FOR SELECT
TO authenticated
USING (true);

-- Add index for better performance on plan_type lookups
CREATE INDEX IF NOT EXISTS idx_subscription_config_plan_type 
ON public.subscription_config(plan_type);