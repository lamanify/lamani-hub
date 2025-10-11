import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Fallback values in case environment variables aren't injected properly
const FALLBACK_SUPABASE_URL = 'https://gjnnqeqlxxoiajgklevz.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqbm5xZXFseHhvaWFqZ2tsZXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NjM0NTcsImV4cCI6MjA3NTEzOTQ1N30.sBMd_Kkuhz5zPfC9LdPCYI1MNjVehrXaHUgEbJ4gssU';

// Try to use environment variables first, fallback to hardcoded values if not available
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
