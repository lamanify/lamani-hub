-- Add Stripe tracking fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer ON public.tenants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_subscription ON public.tenants(stripe_subscription_id);

-- Add comment for documentation
COMMENT ON COLUMN public.tenants.stripe_subscription_id IS 'Stripe subscription ID for tracking active subscriptions';
COMMENT ON COLUMN public.tenants.subscription_current_period_end IS 'End date of current billing period';
COMMENT ON COLUMN public.tenants.trial_ends_at IS 'End date of trial period';