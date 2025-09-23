"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PaginationPageDefault } from "@/components/ui/application/pagination/pagination";

export type MetricsPaginationProps = {
  page: number;
  totalPages: number;
};

export function MetricsPagination({ page, totalPages }: MetricsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const queryWithoutPage = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    return params;
  }, [searchParams]);

  return (
    <PaginationPageDefault
      page={page}
      total={totalPages}
      onPageChange={(candidate) => {
        const nextPage = Math.max(1, Math.min(totalPages, candidate));
        const params = new URLSearchParams(queryWithoutPage);
        if (nextPage > 1) {
          params.set("page", String(nextPage));
        }
        const search = params.toString();
        router.push(search ? `${pathname}?${search}` : pathname, { scroll: false });
      }}
    />
  );
}
