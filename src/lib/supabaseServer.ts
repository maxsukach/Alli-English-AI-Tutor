import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Do not create the client at module load time if env vars are missing; provide a
// lazy getter so the server action can handle missing configuration gracefully.
type SupabaseStub = {
  from: (table: string) => {
    insert: (row: unknown) => {
      select: () => Promise<{ error: Error | null; data: null } | { error: Error | null; data: unknown }>;
    };
  };
};

export function getSupabaseServer(): ReturnType<typeof createClient> | SupabaseStub {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not set. Server actions will fail until configured.');
    // Return a minimal stub with a `from` method that returns an error-like object
    return {
      from: () => ({
        insert: () => ({
          select: async () => ({ error: new Error('Supabase not configured'), data: null }),
        }),
      }),
    };
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export default getSupabaseServer;
