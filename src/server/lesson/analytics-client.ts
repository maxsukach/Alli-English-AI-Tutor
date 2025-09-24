import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

interface AnalyticsEvent {
  name: string;
  props: Record<string, unknown>;
}

export class AnalyticsClient {
  async record(profileId: string | null, events: AnalyticsEvent[]) {
    if (events.length === 0) return;
    await prisma.event.createMany({
      data: events.map((event) => ({
        profileId: profileId ?? undefined,
        eventName: event.name,
        props: event.props as Prisma.InputJsonValue,
      })),
    });
  }
}
