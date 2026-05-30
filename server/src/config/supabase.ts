import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { config } from './env';

// Admin client (service role) — for server-side operations that bypass RLS
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws as any,
    },
  }
);

// Anon client — for operations that should respect RLS
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    realtime: {
      transport: ws as any,
    },
  }
);
