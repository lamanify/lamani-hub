-- Create RPC function to increment property usage count
CREATE OR REPLACE FUNCTION public.increment_property_usage(
  p_tenant_id UUID,
  p_entity TEXT,
  p_key TEXT
)
RETURNS VOID
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

-- Add comment for documentation
COMMENT ON FUNCTION public.increment_property_usage IS 'Increments usage count and updates last_seen_at for a property definition';

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.increment_property_usage TO service_role;