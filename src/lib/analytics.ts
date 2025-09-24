import { Buffer } from "node:buffer";
import type { AnalyticsEnvelope } from "./eventSchema";

const ENABLE_ANALYTICS = process.env.ENABLE_ANALYTICS_PIPELINE === "true";
const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL;
const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER;
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD;

export class AnalyticsPipeline {
  constructor(private readonly fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)) {}

  async send(events: AnalyticsEnvelope[]): Promise<void> {
    if (!ENABLE_ANALYTICS) return;
    if (!CLICKHOUSE_URL) {
      console.warn("[AnalyticsPipeline] CLICKHOUSE_URL missing; skipping send");
      return;
    }
    if (events.length === 0) return;

    const payload = events
      .map((event) =>
        JSON.stringify({
          event: event.name,
          timestamp: (event.timestamp ?? new Date()).toISOString(),
          profile_id: event.profileId ?? null,
          lesson_id: event.lessonId ?? null,
          properties: event.props ?? {},
        }),
      )
      .join("\n");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (CLICKHOUSE_USER) {
      const token = Buffer.from(`${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD ?? ""}`).toString("base64");
      headers.Authorization = `Basic ${token}`;
    }

    try {
      const response = await this.fetchImpl(CLICKHOUSE_URL, {
        method: "POST",
        headers,
        body: `${payload}\n`,
      });
      if (!response.ok) {
        const text = await safeText(response);
        console.warn("[AnalyticsPipeline] ClickHouse responded with", response.status, text);
      }
    } catch (error) {
      console.error("[AnalyticsPipeline] Failed to send events", error);
    }
  }
}

async function safeText(response: Response) {
  try {
    return await response.text();
  } catch {
    return "<unavailable>";
  }
}
