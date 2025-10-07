-- Create daily cron job to expire trial accounts
SELECT cron.schedule(
  'expire-trial-accounts',
  '0 1 * * *', -- Run at 1 AM daily
  $$
  WITH expired_trials AS (
    UPDATE public.tenants
    SET subscription_status = 'inactive'
    WHERE subscription_status IN ('trial', 'trialing')
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at < now()
    RETURNING id, name
  )
  INSERT INTO public.audit_log (tenant_id, user_id, action, resource_id, details)
  SELECT 
    id,
    NULL,
    'trial_expired',
    id::text,
    jsonb_build_object(
      'tenant_name', name,
      'expired_at', now(),
      'previous_status', 'trial'
    )
  FROM expired_trials;
  $$
);

-- Also update any trials that should have expired already
UPDATE public.tenants
SET subscription_status = 'inactive'
WHERE subscription_status IN ('trial', 'trialing')
  AND trial_ends_at IS NOT NULL
  AND trial_ends_at < now();