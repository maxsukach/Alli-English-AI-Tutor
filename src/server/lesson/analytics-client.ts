import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { AnalyticsPipeline } from "@/lib/analytics";
import type { AnalyticsEnvelope } from "@/lib/eventSchema";

interface AnalyticsEvent {
  name: string;
  props: Record<string, unknown>;
  lessonId?: string | null;
  timestamp?: Date;
}

export class AnalyticsClient {
  constructor(private readonly pipeline = new AnalyticsPipeline()) {}

  async record(profileId: string | null, events: AnalyticsEvent[]) {
    if (events.length === 0) return;

    await prisma.event.createMany({
      data: events.map((event) => ({
        profileId: profileId ?? undefined,
        eventName: event.name,
        props: {
          ...(event.props ?? {}),
          ...(event.lessonId ? { lessonId: event.lessonId } : {}),
        } as Prisma.InputJsonValue,
        recordedAt: event.timestamp ?? undefined,
      })),
    });

    const envelopes: AnalyticsEnvelope[] = events.map((event) => ({
      name: event.name,
      profileId,
      lessonId: event.lessonId ?? null,
      props: event.props,
      timestamp: event.timestamp,
    }));

    await this.pipeline.send(envelopes);
  }
}
