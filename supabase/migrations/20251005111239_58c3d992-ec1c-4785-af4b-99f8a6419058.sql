-- Phase 2A: Database Schema Changes for API Key Hashing and Grace Period
-- Add columns to support bcrypt hashing and grace period enforcement

-- ============================================================================
-- TENANTS TABLE - API Key Security Enhancement
-- ============================================================================

-- Add api_key_hash column to store bcrypt hashed API keys
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS api_key_hash TEXT;

COMMENT ON COLUMN public.tenants.api_key_hash IS 
'Bcrypt hash of the API key. Replaces plaintext api_key column for security.';

-- Add api_key_prefix column for efficient tenant lookup (first 8 chars of key)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS api_key_prefix TEXT;

COMMENT ON COLUMN public.tenants.api_key_prefix IS 
'First 8 characters of API key for efficient tenant lookup without exposing full key.';

-- Create index on api_key_prefix for fast lookups
CREATE INDEX IF NOT EXISTS idx_tenants_api_key_prefix 
ON public.tenants(api_key_prefix);

-- Add old_api_key_hash column to support 60-minute grace period
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS old_api_key_hash TEXT;

COMMENT ON COLUMN public.tenants.old_api_key_hash IS 
'Previous API key hash. Valid for 60 minutes after regeneration to allow smooth transition.';

-- Add old_api_key_expires_at column to track grace period expiration
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS old_api_key_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.tenants.old_api_key_expires_at IS 
'Expiration timestamp for old_api_key_hash. Set to NOW() + 60 minutes on regeneration.';

-- Create index on old_api_key_expires_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_tenants_old_api_key_expires_at 
ON public.tenants(old_api_key_expires_at) 
WHERE old_api_key_expires_at IS NOT NULL;

-- ============================================================================
-- NOTES
-- ============================================================================
-- The plaintext api_key column will be dropped in Phase 2E after successful migration
-- All new API keys will be hashed using bcrypt (cost factor 10)
-- API key prefix enables O(1) tenant lookup while maintaining security
-- Grace period prevents integration downtime during key rotation