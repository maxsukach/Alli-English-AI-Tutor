import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type SupabaseStub = {
  from: (table: string) => {
    insert: (row: unknown) => {
      select: () => Promise<{ error: Error | null; data: null } | { error: Error | null; data: unknown }>;
    };
  };
};

export async function getSupabaseServer(): Promise<SupabaseClient | SupabaseStub> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are not set. Server calls will fail until configured.");
    return {
      from: () => ({
        insert: () => ({
          select: async () => ({ error: new Error("Supabase not configured"), data: null }),
        }),
      }),
    };
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        return;
      },
      remove() {
        return;
      },
    },
    auth: {
      persistSession: false,
    },
  });
}

export default getSupabaseServer;
