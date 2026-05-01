import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://xdrokyklrmfiwrfwgtgc.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkcm9reWtscm1maXdyZndndGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzA1OTYsImV4cCI6MjA5MTk0NjU5Nn0.lQs5UIMKClfqjgyPusYTd41-G-haPKyrFmcJDPOG7EA';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? DEFAULT_SUPABASE_URL).trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
