-- Create table for tracking processed Stripe webhook events (idempotency)
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_event_id 
ON public.processed_stripe_events(event_id);

-- Enable RLS (but allow inserts from service role)
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- Super admins can view processed events
CREATE POLICY "super_admins_view_processed_events"
ON public.processed_stripe_events
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- System can insert processed events (service role bypass)
CREATE POLICY "system_insert_processed_events"
ON public.processed_stripe_events
FOR INSERT
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.processed_stripe_events IS 'Tracks processed Stripe webhook events to ensure idempotency';