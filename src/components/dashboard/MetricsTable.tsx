import { MetricsPagination } from "@/components/dashboard/MetricsPagination";

export type MetricRow = {
  id: number;
  value: number;
  created_at: string | null;
};

export type MetricsTableProps = {
  metrics: MetricRow[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  error?: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
}

export function MetricsTable({
  metrics,
  page,
  pageSize,
  totalItems,
  totalPages,
  error,
}: MetricsTableProps) {
  const start = metrics.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + metrics.length;

  return (
    <div className="flex flex-col rounded-2xl border border-secondary bg-primary shadow-sm">
      <div className="flex flex-col gap-1 border-b border-secondary px-6 py-4">
        <h2 className="text-lg font-semibold text-secondary">Recent metrics</h2>
        <p className="text-sm text-tertiary">
          {error ?? `Showing ${start}-${end} of ${totalItems} records.`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary text-sm">
          <thead className="bg-gray-50 text-tertiary dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left font-medium uppercase tracking-wide">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left font-medium uppercase tracking-wide">
                Value
              </th>
              <th scope="col" className="px-6 py-3 text-left font-medium uppercase tracking-wide">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary text-secondary">
            {metrics.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-tertiary">
                  {error ?? "No data available yet. Add your first metric using the form."}
                </td>
              </tr>
            ) : (
              metrics.map((metric) => (
                <tr key={metric.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-secondary">
                    {metric.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary">
                    {metric.value}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-tertiary">
                    {formatDate(metric.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3">
        <MetricsPagination page={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
