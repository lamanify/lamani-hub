-- Enable real-time updates for tenants table
-- This allows instant subscription status updates in the UI when webhooks modify tenant data

ALTER PUBLICATION supabase_realtime ADD TABLE tenants;