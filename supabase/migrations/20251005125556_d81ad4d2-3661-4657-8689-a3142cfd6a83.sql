-- Implement data retention policies for audit_log and webhook_events
-- This helps with GDPR compliance and database performance

-- Create function to clean up old audit logs (default: keep 2 years)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(retention_days integer DEFAULT 730)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.audit_log
  WHERE created_at < now() - (retention_days || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  INSERT INTO public.audit_log (tenant_id, user_id, action, resource_id, details)
  VALUES (
    NULL, -- System operation
    NULL, -- System operation
    'audit_log_cleanup',
    NULL,
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', retention_days,
      'cleanup_timestamp', now()
    )
  );
  
  RETURN deleted_count;
END;
$$;

-- Create function to clean up old webhook events (default: keep 1 year)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events(retention_days integer DEFAULT 365)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.webhook_events
  WHERE created_at < now() - (retention_days || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  INSERT INTO public.audit_log (tenant_id, user_id, action, resource_id, details)
  VALUES (
    NULL, -- System operation
    NULL, -- System operation
    'webhook_events_cleanup',
    NULL,
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', retention_days,
      'cleanup_timestamp', now()
    )
  );
  
  RETURN deleted_count;
END;
$$;

-- Grant execute permissions to authenticated users (for manual cleanup if needed)
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_webhook_events TO authenticated;

-- Note: To enable automatic cleanup, you need to:
-- 1. Enable pg_cron extension in Supabase dashboard
-- 2. Create cron jobs:
--    SELECT cron.schedule('cleanup-audit-logs', '0 2 * * 0', 'SELECT public.cleanup_old_audit_logs();');
--    SELECT cron.schedule('cleanup-webhook-events', '0 3 * * 0', 'SELECT public.cleanup_old_webhook_events();');

COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 'Cleans up audit_log entries older than specified retention period (default: 730 days/2 years). Schedule with pg_cron for automatic execution.';
COMMENT ON FUNCTION public.cleanup_old_webhook_events IS 'Cleans up webhook_events entries older than specified retention period (default: 365 days/1 year). Schedule with pg_cron for automatic execution.';