import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

let cached: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase client env vars are not configured (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)");
  }

  if (!cached) {
    cached = createClient(supabaseUrl, supabaseAnonKey);
  }

  return cached;
}

export const supabase = getSupabaseClient();
