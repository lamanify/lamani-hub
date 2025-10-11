-- Remove old plaintext api_key column default and ensure schema is ready for hashed keys
-- The api_key column will be deprecated in favor of api_key_hash and api_key_prefix

ALTER TABLE public.tenants 
  ALTER COLUMN api_key DROP DEFAULT;

-- Ensure api_key_prefix has no default (will be set by signup function)
ALTER TABLE public.tenants 
  ALTER COLUMN api_key_prefix DROP DEFAULT;

-- Add index on api_key_prefix for faster lookups during API authentication
CREATE INDEX IF NOT EXISTS idx_tenants_api_key_prefix ON public.tenants(api_key_prefix);