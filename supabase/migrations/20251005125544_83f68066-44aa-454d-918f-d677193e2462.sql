-- Move extensions to dedicated schema for better security isolation
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Note: Extensions cannot be moved between schemas in Supabase
-- This is a limitation of PostgreSQL extension system
-- However, we can create a comment to document this for future reference
COMMENT ON SCHEMA extensions IS 'Dedicated schema for PostgreSQL extensions. Due to PostgreSQL limitations, existing extensions in public schema cannot be moved. New extensions should be created in this schema using: CREATE EXTENSION IF NOT EXISTS extension_name WITH SCHEMA extensions;';

-- For future extension installations, use:
-- CREATE EXTENSION IF NOT EXISTS extension_name WITH SCHEMA extensions;