/**
 * Lazy Supabase Client singleton.
 *
 * Only initializes when SUPABASE_URL is configured.
 * Call getSupabase() when you need access to Supabase SDK features
 * (e.g. storage, realtime, RLS-based queries).
 */

let _supabase: any = null;

export function getSupabase() {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    _supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return _supabase;
  } catch (err) {
    console.warn('⚠️  Supabase client not available. Install @supabase/supabase-js to enable.');
    return null;
  }
}
