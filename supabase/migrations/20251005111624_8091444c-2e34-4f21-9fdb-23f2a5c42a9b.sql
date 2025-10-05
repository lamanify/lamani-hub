-- Phase 2C: Set up cron job to clean up expired API keys
-- Enable required extensions for cron jobs

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to cleanup expired API keys every hour
SELECT cron.schedule(
  'cleanup-expired-api-keys-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://gjnnqeqlxxoiajgklevz.supabase.co/functions/v1/cleanup-expired-api-keys',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqbm5xZXFseHhvaWFqZ2tsZXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NjM0NTcsImV4cCI6MjA3NTEzOTQ1N30.sBMd_Kkuhz5zPfC9LdPCYI1MNjVehrXaHUgEbJ4gssU"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Add comment for documentation
COMMENT ON EXTENSION pg_cron IS 'Phase 2: Scheduled job to clean up expired grace period API keys hourly';

-- Verify cron job was created
SELECT jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'cleanup-expired-api-keys-hourly';