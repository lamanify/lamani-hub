-- Add indexes for faster authentication queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON public.tenants(id, subscription_status);

-- Add comment for documentation
COMMENT ON INDEX idx_profiles_user_id IS 'Speeds up profile lookups by user_id during authentication';
COMMENT ON INDEX idx_user_roles_user_id IS 'Speeds up role checks during authentication';
COMMENT ON INDEX idx_tenants_subscription_status IS 'Speeds up subscription status checks';