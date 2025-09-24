import type {
  LessonContext,
  LessonPlanContract,
  RagRetrievalResult,
  TaskFeedbackContract,
} from "./contracts";

interface GenerateTaskFeedbackArgs {
  plan: LessonPlanContract;
  context: LessonContext;
  retrieval: RagRetrievalResult;
}

export class AiCoreClient {
  async generateTaskFeedback({ plan, context, retrieval }: GenerateTaskFeedbackArgs): Promise<TaskFeedbackContract> {
    const activeStage = plan.stages.find((stage) => stage.id === context.stageId) ?? plan.stages[0];

    const summary = this.composeSummary(activeStage, context);
    const errors = this.estimateErrors(context);
    const recommendations = this.composeRecommendations(retrieval, activeStage);

    return {
      task: {
        stageId: activeStage.id,
        prompt: activeStage.prompt ?? "Let’s practice your target structure.",
        targets: plan.targets,
      },
      feedback: {
        summary,
        errors,
        recommendations,
      },
      meta: {
        pronunciationScore: context.signals?.pron ?? 0.7,
        confidence: context.signals?.conf ?? 2,
        speakingTimeMs: context.signals?.rt_ms ?? 5000,
      },
    };
  }

  private composeSummary(stage: LessonPlanContract["stages"][number], context: LessonContext) {
    const base = `Stage ${stage.id} focused on ${stage.goal ?? stage.kind}.`;
    if (!context.transcript) {
      return `${base} You stayed mostly silent, so we should try again with more detail.`;
    }
    return `${base} You produced ${context.transcript.split(" ").length} words and we will target clearer negative past forms.`;
  }

  private estimateErrors(context: LessonContext): TaskFeedbackContract["feedback"]["errors"] {
    if (!context.transcript) {
      return [
        {
          type: "lex",
          snippet: "(no output)",
          correction: "Try describing your last trip in at least three sentences.",
          severity: 3,
        },
      ];
    }

    const containsDidnt = /didn't/i.test(context.transcript);
    if (!containsDidnt) {
      return [
        {
          type: "gram",
          snippet: context.transcript.slice(0, 80),
          correction: "Use the auxiliary 'didn't' for negative past simple sentences.",
          severity: 2,
        },
      ];
    }
    return [
      {
        type: "phon",
        snippet: "didn't",
        correction: "Soften the /d/ release: say 'didn't' with a glottal stop.",
        severity: 1,
      },
    ];
  }

  private composeRecommendations(
    retrieval: RagRetrievalResult,
    stage: LessonPlanContract["stages"][number],
  ): string[] {
    const docs = retrieval.pedagogyDocs.slice(0, 2).map((doc) => `Review ${doc.id}`);
    const personal = retrieval.personalMemory.slice(0, 1).map((item) => `Revisit your earlier mistake: ${item.content}`);
    const successCriteria = stage.materials?.successCriteria ?? [];
    return [...successCriteria, ...docs, ...personal];
  }
}
