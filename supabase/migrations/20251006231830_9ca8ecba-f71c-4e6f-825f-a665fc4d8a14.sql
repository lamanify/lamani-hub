-- Create cron job to automatically suspend accounts after grace period expires
-- Runs every hour to check for expired grace periods
SELECT cron.schedule(
  'auto-suspend-expired-grace-periods',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT auto_suspend_expired_grace_periods();
  $$
);

-- Create cron job to deactivate expired comp accounts
-- Runs daily at 2 AM to check for expired comped accounts
SELECT cron.schedule(
  'deactivate-expired-comps',
  '0 2 * * *', -- Daily at 2 AM
  $$
  UPDATE public.tenants
  SET subscription_status = 'inactive'
  WHERE is_comped = true
    AND comp_expires_at IS NOT NULL
    AND comp_expires_at < now()
    AND subscription_status != 'inactive';
  
  -- Log the operation
  INSERT INTO public.audit_log (tenant_id, user_id, action, resource_id, details)
  SELECT 
    id,
    NULL,
    'comp_expired_deactivation',
    id,
    jsonb_build_object(
      'comp_expires_at', comp_expires_at,
      'deactivated_at', now()
    )
  FROM public.tenants
  WHERE is_comped = true
    AND comp_expires_at IS NOT NULL
    AND comp_expires_at < now()
    AND subscription_status = 'inactive';
  $$
);

-- Create cron job to cleanup old audit logs
-- Runs weekly on Sunday at 3 AM, keeps 2 years of logs
SELECT cron.schedule(
  'cleanup-old-audit-logs',
  '0 3 * * 0', -- Weekly on Sunday at 3 AM
  $$
  SELECT cleanup_old_audit_logs(730); -- 730 days = 2 years
  $$
);

-- Create cron job to cleanup old webhook events
-- Runs weekly on Sunday at 4 AM, keeps 1 year of events
SELECT cron.schedule(
  'cleanup-old-webhook-events',
  '0 4 * * 0', -- Weekly on Sunday at 4 AM
  $$
  SELECT cleanup_old_webhook_events(365); -- 365 days = 1 year
  $$
);