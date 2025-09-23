"use client";

import { useActionState, useEffect, useRef } from "react";
import { addMetric, addMetricInitialState, type MetricFormState } from "@/app/actions";
import { Form } from "@/components/ui/base/form/form";
import { Input } from "@/components/ui/base/input/input";
import { Button } from "@/components/ui/base/buttons/button";
import { useMemo } from "react";

export type MetricCreateFormProps = {
  action?: typeof addMetric;
  initialState?: MetricFormState;
};

export function MetricCreateForm({
  action,
  initialState,
}: MetricCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const addMetricAction = useMemo(() => action ?? addMetric, [action]);
  const defaultState = useMemo(() => initialState ?? addMetricInitialState, [initialState]);
  const [state, formAction, isPending] = useActionState<MetricFormState, FormData>(
    addMetricAction,
    defaultState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <div className="rounded-2xl border border-secondary bg-primary p-6 shadow-sm">
      <header className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-secondary">Add new metric</h2>
        <p className="text-sm text-tertiary">
          Submit a numeric value to create a new row in the Supabase <code>metrics</code> table.
        </p>
      </header>

      <Form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <Input
          name="value"
          type="number"
          label="Metric value"
          placeholder="42"
          size="md"
          min="0"
          step="1"
          isRequired
          hint="Only numeric values are allowed."
        />

        <Button type="submit" size="md" color="primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save metric"}
        </Button>
      </Form>

      {state.status === "error" && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.message ?? "Unable to create metric."}
        </p>
      )}

      {state.status === "success" && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
          Metric saved to Supabase.
        </p>
      )}
    </div>
  );
}
