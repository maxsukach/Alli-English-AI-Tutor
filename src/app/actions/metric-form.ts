export type MetricFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const addMetricInitialState: MetricFormState = { status: "idle" };
