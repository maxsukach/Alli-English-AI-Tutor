"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com";
const capturePageviews = process.env.NEXT_PUBLIC_POSTHOG_CAPTURE_PAGEVIEWS !== "false";
const captureSessionRecording = process.env.NEXT_PUBLIC_POSTHOG_SESSION_RECORDING === "true";

let initialized = false;

export function PostHogClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!apiKey || initialized || typeof window === "undefined") {
      return;
    }

    posthog.init(apiKey, {
      api_host: apiHost,
      capture_pageview: false,
      autocapture: true,
      persistence: "localStorage",
      disable_session_recording: !captureSessionRecording,
    });

    initialized = true;
  }, []);

  useEffect(() => {
    if (!initialized || !apiKey || !capturePageviews) {
      return;
    }

    const search = searchParams.toString();
    const url = search ? `${pathname}?${search}` : pathname ?? "/";

    posthog.capture("$pageview", {
      $current_url: typeof window !== "undefined" ? `${window.location.origin}${url}` : url,
    });
  }, [pathname, searchParams]);

  return null;
}
