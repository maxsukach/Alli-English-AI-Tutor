import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import type { LessonPlanContract, LessonStage, PlannerInput } from "./contracts";

function pickTargets(input: PlannerInput): LessonPlanContract["targets"] {
  const sortedByMistakes = [...(input.history ?? [])].sort((a, b) => (b.mistakes ?? 0) - (a.mistakes ?? 0));
  const primary = sortedByMistakes.slice(0, 2).map((entry) => ({
    type: "structure" as const,
    id: entry.targetId,
  }));
  if (primary.length > 0) {
    return primary;
  }
  const topic = input.preferredTopics?.[0] ?? "travel_a2";
  return [
    { type: "structure", id: `${topic}_pattern` },
    { type: "vocab", id: topic },
  ];
}

function fallbackStages(targets: LessonPlanContract["targets"]): LessonStage[] {
  const topic = targets.find((t) => t.type === "vocab")?.id ?? "travel_a2";
  return [
    {
      id: "warmup",
      kind: "dialogue",
      goal: "activate schema",
      prompt: `Small talk about ${topic.replace(/_/g, " ")}`,
    },
    {
      id: "input",
      kind: "modeling",
      goal: "model target language",
      materials: {
        examples: ["I didn't go", "We didn't travel"],
        kbRefs: ["kb://default/past_simple"],
      },
    },
    {
      id: "task",
      kind: "roleplay",
      goal: "communicative practice",
      prompt: "Roleplay booking a hostel room in English",
      materials: {
        scenario: "booking a hostel",
        successCriteria: ["use past simple negation correctly at least three times"],
      },
      timeouts: { soft: 120 },
    },
    {
      id: "feedback",
      kind: "formative",
      goal: "deliver corrective feedback",
      materials: {
        rubricRef: "rubric://a2/past_simple_clarity",
      },
    },
    {
      id: "review",
      kind: "srs",
      goal: "schedule spaced repetition",
      items: targets.map((target) => ({ type: target.type === "vocab" ? "word" : "pattern", id: target.id })),
    },
  ];
}

export class LessonPlanner {
  async generatePlan(input: PlannerInput): Promise<LessonPlanContract> {
    const lessonId = randomUUID();
    const targets = pickTargets(input);

    const template = await prisma.lessonTemplate.findFirst({
      where: {
        cefr: input.cefr ?? undefined,
        topic: input.preferredTopics?.[0],
      },
      include: {
        taskTemplates: {
          include: {
            taskDifficulties: true,
          },
        },
      },
    });

    const stagesJson = template?.stages;
    const stages: LessonStage[] = Array.isArray(stagesJson)
      ? (stagesJson as unknown as LessonStage[])
      : fallbackStages(targets);

    const planPayload = {
      cefr: input.cefr,
      targets,
      stages,
    };

    await prisma.lessonPlan.create({
      data: {
        lessonId,
        userId: input.profileId,
        plan: planPayload as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      lessonId,
      targets,
      stages,
      branching: {
        onHighError: "repeat_task_variant_b",
        onFastSuccess: "advance_to_extension",
      },
    };
  }
}
