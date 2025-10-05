-- Create property_definitions table
CREATE TABLE public.property_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity text NOT NULL DEFAULT 'lead',
  key text NOT NULL,
  label text NOT NULL,
  data_type text NOT NULL DEFAULT 'string',
  is_system boolean NOT NULL DEFAULT false,
  
  -- Usage tracking
  usage_count integer DEFAULT 0,
  last_seen_at timestamptz,
  
  -- Display settings
  show_in_list boolean DEFAULT true,
  show_in_form boolean DEFAULT true,
  is_required boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  
  -- Validation
  options jsonb,
  description text,
  
  -- PDPA
  is_sensitive boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (tenant_id, entity, key)
);

CREATE INDEX property_definitions_tenant_idx ON public.property_definitions(tenant_id, entity);
CREATE INDEX property_definitions_key_idx ON public.property_definitions(key);

CREATE TRIGGER property_definitions_updated_at 
BEFORE UPDATE ON public.property_definitions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create webhook_events table
CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  source text NOT NULL,
  payload_raw jsonb NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status text NOT NULL,
  error_message text,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX webhook_events_tenant_idx ON public.webhook_events(tenant_id, created_at DESC);
CREATE INDEX webhook_events_lead_idx ON public.webhook_events(lead_id);
CREATE INDEX webhook_events_status_idx ON public.webhook_events(status);

-- Add custom column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS custom jsonb DEFAULT '{}'::jsonb;

-- Create GIN index for fast custom field queries
CREATE INDEX IF NOT EXISTS leads_custom_gin_idx ON public.leads USING gin (custom jsonb_path_ops);

-- Enable RLS on property_definitions
ALTER TABLE public.property_definitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_definitions
CREATE POLICY "users_view_tenant_properties"
ON public.property_definitions FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "admins_manage_tenant_properties"
ON public.property_definitions FOR ALL TO authenticated
USING (
  (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()) 
   AND is_admin(auth.uid()))
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Enable RLS on webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_events
CREATE POLICY "users_view_tenant_webhooks"
ON public.webhook_events FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "system_insert_webhooks"
ON public.webhook_events FOR INSERT TO authenticated
WITH CHECK (true);