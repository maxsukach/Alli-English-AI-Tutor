import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Decorator } from "@storybook/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { MetricsTable } from "@/components/dashboard/MetricsTable";

const mockRouter: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  hmrRefresh: () => {},
  push: () => {},
  replace: () => {},
  prefetch: () => {},
};

const RouterDecorator: Decorator = (Story) => (
  <AppRouterContext.Provider value={mockRouter}>
    <PathnameContext.Provider value="/dashboard">
      <SearchParamsContext.Provider value={new URLSearchParams()}>
        <Story />
      </SearchParamsContext.Provider>
    </PathnameContext.Provider>
  </AppRouterContext.Provider>
);

const meta = {
  title: "Dashboard/MetricsTable",
  component: MetricsTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [RouterDecorator],
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
