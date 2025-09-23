"use client";

import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

export default function ThemeProviderClient({ children }: Props) {
  useEffect(() => {
      const stored = localStorage.getItem("theme");
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const isDark = stored ? stored === "dark" : prefersDark;

      const root = document.documentElement;
      if (isDark) root.classList.add("dark-mode");
      else root.classList.remove("dark-mode");

      // ensure color-scheme meta exists for proper form controls / built-in UI
      let meta = document.querySelector('meta[name="color-scheme"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "color-scheme");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", isDark ? "dark" : "light");
    // ignore errors from localStorage/matchMedia in restricted environments
    // (e.g. edge cases in server tooling)
  }, []);

  // Render children immediately (we don't want a flash of empty content). mount flag
  // is available for future enhancements (e.g. show loading until mounted).
  return <>{children}</>;
}
