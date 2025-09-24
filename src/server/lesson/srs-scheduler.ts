import { SrsItemType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { LessonPlanContract } from "./contracts";

interface ScheduleArgs {
  profileId: string;
  plan: LessonPlanContract;
  performanceDelta: number;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export class SrsScheduler {
  async schedule({ profileId, plan, performanceDelta }: ScheduleArgs) {
    const baseInterval = performanceDelta > 0 ? 3 : performanceDelta < 0 ? 1 : 2;
    const queueItems = plan.targets.map((target) => {
      const itemType = target.type === "vocab" ? SrsItemType.WORD : SrsItemType.PATTERN;
      return {
        profileId,
        itemId: target.id,
        itemType,
        dueAt: addDays(new Date(), baseInterval),
        ease: Math.max(1.3, 2.3 + performanceDelta * 0.5),
        interval: baseInterval,
      };
    });

    await prisma.$transaction(
      queueItems.map((item) =>
        prisma.srsQueue.upsert({
          where: {
            profileId_itemId_itemType: {
              profileId: item.profileId,
              itemId: item.itemId,
              itemType: item.itemType,
            },
          },
          create: item,
          update: {
            dueAt: item.dueAt,
            ease: item.ease,
            interval: item.interval,
          },
        }),
      ),
    );
  }
}
