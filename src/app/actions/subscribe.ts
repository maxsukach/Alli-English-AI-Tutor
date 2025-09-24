"use server";

import { createClient } from '@supabase/supabase-js';

type Result = {
  success: boolean;
  message?: string;
};

export async function subscribeAction(formData: FormData): Promise<Result> {
  try {
    const email = formData.get('email');
    if (!email || typeof email !== 'string') {
      return { success: false, message: 'Email is required' };
    }

    // Trim and basic validation
    const clean = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      return { success: false, message: 'Invalid email format' };
    }

    // Insert into 'leads' table. Replace with your table name.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return { success: false, message: 'Supabase not configured on server' };
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from('leads').insert({ email: clean });

    if (error) {
      console.error('Supabase insert error', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch {
    console.error('subscribeAction error');
    return { success: false, message: 'unknown error' };
  }
}
