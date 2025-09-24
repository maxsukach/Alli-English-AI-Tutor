import type { PlannerInput, LessonContext, OrchestratorResult, LessonPlanContract } from "./contracts";
import { LessonPlanner } from "./planner";
import { AdaptiveEngine } from "./adaptive-engine";
import { PolicyEngine } from "./policy-engine";
import { AiCoreService } from "@/server/services/ai-core";
import { RagRepository } from "./rag-repository";
import { PronunciationService } from "./pronunciation-service";
import { SrsScheduler } from "./srs-scheduler";
import { LessonRepository } from "./lesson-repository";
import { AnalyticsClient } from "./analytics-client";
import { prisma } from "@/lib/prisma";

interface HandleTurnArgs {
  profileId: string;
  lessonId?: string;
  stageId?: string;
  transcript?: string;
  signals?: Record<string, number>;
}

function parsePlan(plan: unknown): Partial<LessonPlanContract> {
  if (!plan || typeof plan !== "object") {
    throw new Error("Lesson plan is missing");
  }
  return plan as Partial<LessonPlanContract>;
}

export class LessonOrchestrator {
  constructor(
    private readonly planner = new LessonPlanner(),
    private readonly adaptive = new AdaptiveEngine(),
    private readonly policy = new PolicyEngine(),
    private readonly ai = new AiCoreService(),
    private readonly rag = new RagRepository(),
    private readonly pronunciation = new PronunciationService(),
    private readonly srs = new SrsScheduler(),
    private readonly repo = new LessonRepository(),
    private readonly analytics = new AnalyticsClient(),
  ) {}

  async startLesson(args: PlannerInput) {
    const plan = await this.planner.generatePlan(args);
    await this.repo.ensureLessonRun(args.profileId, plan);
    return plan;
  }

  async handleTurn({ profileId, lessonId, stageId, transcript, signals }: HandleTurnArgs): Promise<OrchestratorResult> {
    const plan = await this.getOrCreatePlan(profileId, lessonId);
    await this.repo.ensureLessonRun(profileId, plan);

    const activeStage = plan.stages.find((stage) => stage.id === stageId) ?? plan.stages[0];
    if (!activeStage) {
      throw new Error("Lesson plan lacks stages");
    }

    const promptPolicy = activeStage.prompt ? await this.policy.validatePrompt(activeStage.prompt) : { valid: true, violations: [] };

    const pronunciationAnalysis = await this.pronunciation.analyze({ transcript });

    const context: LessonContext = {
      profileId,
      lessonId: plan.lessonId,
      stageId: activeStage.id,
      transcript,
      signals: {
        ...(signals ?? {}),
        pron: pronunciationAnalysis.score,
      },
    };

    const retrieval = await this.rag.retrieve(plan);
    const feedback = await this.ai.generateTaskFeedback({ plan, context, retrieval });

    if (pronunciationAnalysis.hints.length > 0) {
      feedback.feedback.recommendations.push(...pronunciationAnalysis.hints);
    }

    const feedbackPolicy = await this.policy.validateFeedback(feedback.feedback);
    const policyViolations = [...(promptPolicy.violations ?? []), ...(feedbackPolicy.violations ?? [])];

    const adaptiveDecision = await this.adaptive.recommend(
      {
        profileId,
        lessonId: plan.lessonId,
        stageId: activeStage.id,
        signals: context.signals ?? {},
      },
      plan,
    );

    await this.repo.recordFeedback(plan.lessonId, feedback);
    await this.srs.schedule({
      profileId,
      plan,
      performanceDelta: adaptiveDecision.decision.delta,
    });

    await this.analytics.record(profileId, [
      {
        name: "lesson_turn",
        props: {
          lessonId: plan.lessonId,
          stageId: activeStage.id,
          decision: adaptiveDecision.decision.action,
          policyViolations: policyViolations.map((violation) => violation.code),
        },
      },
    ]);

    return {
      plan,
      task: feedback.task,
      feedback: feedback.feedback,
      adaptiveDecision,
      telemetry: {
        events: [
          {
            name: "lesson_turn",
            props: {
              signals: context.signals,
              nextTask: adaptiveDecision.nextTask,
            },
          },
        ],
      },
      policyViolations: policyViolations.length > 0 ? policyViolations : undefined,
    };
  }

  private async getOrCreatePlan(profileId: string, lessonId?: string) {
    if (lessonId) {
      const storedPlan = await prisma.lessonPlan.findUnique({
        where: { lessonId },
      });
      if (!storedPlan) {
        throw new Error("Requested lesson plan not found");
      }
      const parsed = parsePlan(storedPlan.plan);
      return this.hydratePlan(parsed, storedPlan.lessonId);
    }

    const existingPlan = await prisma.lessonPlan.findFirst({
      where: { userId: profileId },
      orderBy: { createdAt: "desc" },
    });

    if (existingPlan) {
      const parsed = parsePlan(existingPlan.plan);
      return this.hydratePlan(parsed, existingPlan.lessonId);
    }

    const newPlan = await this.planner.generatePlan({ profileId });
    await this.repo.ensureLessonRun(profileId, newPlan);
    return newPlan;
  }

  private hydratePlan(partial: Partial<LessonPlanContract>, lessonId: string): LessonPlanContract {
    return {
      lessonId,
      targets: partial.targets ?? [],
      stages: partial.stages ?? [],
      branching: partial.branching,
    };
  }

  async createRealtimeSession() {
    return this.ai.createRealtimeSession();
  }
}
