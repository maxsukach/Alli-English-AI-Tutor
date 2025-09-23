import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MetricsTable } from "@/components/dashboard/MetricsTable";

const meta = {
  title: "Dashboard/MetricsTable",
  component: MetricsTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MetricsTable>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs = {
  page: 1,
  pageSize: 10,
  totalItems: 23,
  totalPages: 3,
};

const demoMetrics = Array.from({ length: 10 }).map((_, index) => ({
  id: index + 1,
  value: 45 + index * 3,
  created_at: new Date(Date.now() - index * 60_000).toISOString(),
}));

export const WithData: Story = {
  args: {
    ...baseArgs,
    metrics: demoMetrics,
  },
};

export const Empty: Story = {
  args: {
    ...baseArgs,
    metrics: [],
    totalItems: 0,
    totalPages: 1,
    error: undefined,
  },
};

export const ErrorState: Story = {
  args: {
    ...baseArgs,
    metrics: [],
    error: "Supabase is not configured",
  },
};
