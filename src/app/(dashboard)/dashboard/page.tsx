import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { MetricCreateForm } from "@/components/dashboard/MetricCreateForm";
import { MetricsTable, type MetricRow } from "@/components/dashboard/MetricsTable";
import { SimpleLine } from "@/components/charts/SimpleLine";
import { TrendUp01, TrendDown01 } from "@untitledui/react";

const PAGE_SIZE = 10;

type MetricsResponse = {
  metrics: MetricRow[];
  total: number;
  error?: string;
};

const fetchMetricsPage = cache(async (page: number): Promise<MetricsResponse> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      metrics: [],
      total: 0,
      error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load data.",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("metrics")
    .select("id, value, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (error) {
    console.error("Supabase select error", error);
    return {
      metrics: [],
      total: 0,
      error: error.message ?? "Failed to load data from Supabase.",
    };
  }

  return {
    metrics: data ?? [],
    total: count ?? 0,
  };
});

function getLatestValue(metrics: MetricRow[]): number | null {
  return metrics.length > 0 ? metrics[0].value : null;
}

function getAverageValue(metrics: MetricRow[]): number | null {
  if (metrics.length === 0) return null;
  const sum = metrics.reduce((acc, item) => acc + (item.value ?? 0), 0);
  return Number.isFinite(sum) ? Number(sum / metrics.length) : null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const currentPageRaw = Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page;
  const parsedPage = Number(currentPageRaw ?? 1);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const { metrics, total, error } = await fetchMetricsPage(page);
  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE));
  const latestValue = getLatestValue(metrics);
  const averageValue = getAverageValue(metrics);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-secondary bg-primary p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm text-tertiary">
            <span>Latest metric</span>
            <TrendUp01 className="size-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-secondary">
            {latestValue ?? "—"}
          </p>
          <p className="mt-1 text-xs text-tertiary">Most recent value synced from Supabase.</p>
        </article>

        <article className="rounded-2xl border border-secondary bg-primary p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm text-tertiary">
            <span>Average on page</span>
            <TrendDown01 className="size-4 text-sky-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-secondary">
            {averageValue === null ? "—" : averageValue.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-tertiary">
            Arithmetic mean of the metrics displayed on the current page.
          </p>
        </article>

        <article className="rounded-2xl border border-secondary bg-primary p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm text-tertiary">
            <span>Total records</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-secondary dark:bg-gray-800">
              PAGE {page}
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-secondary">{total}</p>
          <p className="mt-1 text-xs text-tertiary">Records stored in the Supabase <code>metrics</code> table.</p>
        </article>

        <article className="rounded-2xl border border-secondary bg-primary p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm text-tertiary">
            <span>Live trend</span>
            <span className="text-xs text-tertiary">placeholder</span>
          </div>
          <div className="mt-3">
            <SimpleLine />
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <MetricsTable
            metrics={metrics}
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={total}
            totalPages={totalPages}
            error={error}
          />
        </div>
        <div className="xl:col-span-4">
          <MetricCreateForm />
        </div>
      </section>
    </div>
  );
}
