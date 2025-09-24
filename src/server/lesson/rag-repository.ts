import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import type { LessonPlanContract, RagRetrievalResult } from "./contracts";

export class RagRepository {
  async retrieve(plan: LessonPlanContract): Promise<RagRetrievalResult> {
    const vocabTargets = plan.targets.filter((target) => target.type === "vocab");
    const topics = vocabTargets.map((target) => target.id);
    const cefrPrefix = plan.targets
      .map((target) => target.id.split(".")[0])
      .find((prefix) => /[A-C][1-2]/.test(prefix ?? ""));

    const orFilters: Prisma.KbDocWhereInput[] = [];
    if (topics.length > 0) {
      orFilters.push({ topic: { in: topics } });
    }
    if (cefrPrefix) {
      orFilters.push({ cefr: cefrPrefix });
    }

    type KbDocRecord = Awaited<ReturnType<typeof prisma.kbDoc.findMany>>[number];
    const docs: KbDocRecord[] = await prisma.kbDoc.findMany({
      where: orFilters.length > 0 ? { OR: orFilters } : undefined,
      take: 5,
    });

    const recentErrors = await prisma.errorLog.findMany({
      where: {
        lessonRun: {
          lessonId: plan.lessonId,
        },
      },
      orderBy: { occurredAt: "desc" },
      take: 5,
    });

    return {
      personalMemory: recentErrors.map((entry, index) => ({
        id: entry.id,
        content: `${entry.snippet} → ${entry.correction}`,
        score: Math.max(0.2, 1 - index * 0.1),
      })),
      pedagogyDocs: docs.map((doc: KbDocRecord) => ({
        id: doc.externalRef,
        content: typeof doc.content === "string" ? doc.content : JSON.stringify(doc.content),
        score: 0.8,
      })),
    };
  }
}
