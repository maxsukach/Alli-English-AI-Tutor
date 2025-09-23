"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type MetricFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const addMetricInitialState: MetricFormState = { status: "idle" };

export async function addMetric(
  _prevState: MetricFormState,
  formData: FormData,
): Promise<MetricFormState> {
  const rawValue = formData.get("value");
  if (rawValue === null || rawValue === "") {
    return { status: "error", message: "Metric value is required." };
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return { status: "error", message: "Metric value must be a number." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { status: "error", message: "Supabase environment variables are missing." };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from("metrics").insert({ value });

  if (error) {
    console.error("Supabase insert error", error);
    return {
      status: "error",
      message: error.message ?? "Failed to create metric.",
    };
  }

  revalidatePath("/dashboard");

  return { status: "success" };
}
