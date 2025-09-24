import { prisma } from "@/lib/prisma";
import type { LessonPlanContract, TaskFeedbackContract } from "./contracts";

export class LessonRepository {
  async ensureLessonRun(profileId: string, plan: LessonPlanContract) {
    return prisma.lessonRun.upsert({
      where: { lessonId: plan.lessonId },
      update: {},
      create: {
        lessonId: plan.lessonId,
        profileId,
        targetStructures: plan.targets.filter((target) => target.type === "structure").map((target) => target.id),
        targetVocab: plan.targets.filter((target) => target.type === "vocab").map((target) => target.id),
      },
    });
  }

  async recordFeedback(lessonId: string, feedback: TaskFeedbackContract) {
    const lessonRun = await prisma.lessonRun.findUnique({
      where: { lessonId },
    });
    if (!lessonRun) return;

    await prisma.lessonRun.update({
      where: { id: lessonRun.id },
      data: {
        feedbackJson: feedback.feedback,
      },
    });

    if (feedback.feedback.errors.length > 0) {
      await prisma.errorLog.createMany({
        data: feedback.feedback.errors.map((error) => ({
          profileId: lessonRun.profileId,
          lessonRunId: lessonRun.id,
          errorType: error.type.toUpperCase() as "PHON" | "GRAM" | "LEX",
          snippet: error.snippet,
          correction: error.correction,
          severity: error.severity,
        })),
      });
    }
  }
}
