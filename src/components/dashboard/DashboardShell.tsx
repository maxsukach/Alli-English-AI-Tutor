"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  BarChartSquare02,
  LayoutAlt02,
  Settings02,
  Users01,
  HelpCircle,
} from "@untitledui/react";
import ThemeToggle from "@/components/untitled/ThemeToggle";
import { Button } from "@/components/ui/base/buttons/button";
import { cx } from "@/utils/cx";

export type DashboardShellProps = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutAlt02 },
  { href: "/dashboard/customers", label: "Customers", icon: Users01 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChartSquare02 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings02 },
];

const secondaryNav: NavItem[] = [
  { href: "https://untitledui.com/", label: "Support", icon: HelpCircle },
];

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 text-primary dark:bg-gray-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-secondary bg-primary px-4 py-6 lg:flex">
        <div className="mb-8 px-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand text-white font-semibold">
              AI
            </span>
            <div>
              <p className="text-sm font-semibold text-secondary">Alli English</p>
              <p className="text-xs text-tertiary">AI Tutor Dashboard</p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-6 text-sm">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition duration-150",
                    isActive
                      ? "bg-brand/10 text-brand border border-brand/20"
                      : "text-tertiary hover:bg-primary_hover hover:text-secondary"
                  )}
                >
                  <Icon className={cx("size-4", isActive ? "text-brand" : "text-fg-quaternary") } />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto space-y-1 border-t border-secondary pt-6">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-tertiary transition duration-150 hover:bg-primary_hover hover:text-secondary"
                >
                  <Icon className="size-4 text-fg-quaternary" />
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>

        <div className="mt-6 rounded-xl border border-secondary bg-primary p-4 shadow-sm">
          <p className="text-sm font-semibold text-secondary">Need more features?</p>
          <p className="mt-1 text-xs text-tertiary">
            Upgrade to unlock collaboration, custom insights, and more.
          </p>
          <Button className="mt-4 w-full" size="sm" color="primary">
            Upgrade plan
          </Button>
        </div>
      </aside>

      <div className="flex w-full flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-secondary bg-primary/80 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-tertiary">Dashboard</span>
              <h1 className="text-lg font-semibold text-secondary">Overview</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" color="secondary" href="/">
              Go to app
            </Button>
            <ThemeToggle />
            <div className="flex size-9 items-center justify-center rounded-full border border-secondary bg-primary text-sm font-semibold text-secondary">
              AS
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 bg-gray-50 px-4 py-8 dark:bg-gray-950 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
