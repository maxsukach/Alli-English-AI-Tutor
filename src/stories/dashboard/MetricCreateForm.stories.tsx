import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MetricCreateForm } from "@/components/dashboard/MetricCreateForm";

type MetricFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const meta = {
  title: "Dashboard/MetricCreateForm",
  component: MetricCreateForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MetricCreateForm>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockAction = async (_state: MetricFormState, formData: FormData): Promise<MetricFormState> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const value = Number(formData.get("value"));
  if (!Number.isFinite(value)) {
    return { status: "error", message: "Enter a numeric value." };
  }
  if (value < 0) {
    return { status: "error", message: "Only non-negative values are allowed." };
  }
  return { status: "success" };
};

export const Default: Story = {
  args: {
    action: mockAction,
  },
};

export const ErrorState: Story = {
  args: {
    action: async () => ({ status: "error", message: "Supabase not configured" }),
  },
};
