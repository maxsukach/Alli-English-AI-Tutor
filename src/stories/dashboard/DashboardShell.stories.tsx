import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import DashboardShell from "@/components/dashboard/DashboardShell";

const meta = {
  title: "Dashboard/Layout",
  component: DashboardShell,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      router: {
        pathname: "/dashboard",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DashboardShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DashboardShell>
      <div className="space-y-6 rounded-2xl border border-dashed border-secondary bg-primary p-10 text-center text-tertiary">
        <p className="text-sm">Inject your dashboard content here.</p>
      </div>
    </DashboardShell>
  ),
};
