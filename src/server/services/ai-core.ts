import type {
  LessonContext,
  LessonPlanContract,
  RagRetrievalResult,
  TaskFeedbackContract,
} from "@/server/lesson/contracts";

const DEFAULT_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? "gpt-4.1-mini";
const USE_REALTIME_AI = process.env.USE_REALTIME_AI === "true";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface GenerateTaskFeedbackArgs {
  plan: LessonPlanContract;
  context: LessonContext;
  retrieval: RagRetrievalResult;
}

interface RealtimeSession {
  id: string;
  client_secret?: { value: string };
  expires_at?: number;
}

class MockAiCore {
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

const JSON_SCHEMA = {
  type: "object",
  required: ["task", "feedback", "meta"],
  properties: {
    task: {
      type: "object",
      required: ["stageId", "prompt", "targets"],
      properties: {
        stageId: { type: "string" },
        prompt: { type: "string" },
        targets: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "id"],
            properties: {
              type: { type: "string" },
              id: { type: "string" },
            },
          },
        },
      },
    },
    feedback: {
      type: "object",
      required: ["summary", "errors", "recommendations"],
      properties: {
        summary: { type: "string" },
        errors: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "snippet", "correction", "severity"],
            properties: {
              type: { type: "string", enum: ["phon", "gram", "lex"] },
              snippet: { type: "string" },
              correction: { type: "string" },
              severity: { type: "integer", minimum: 1, maximum: 3 },
            },
          },
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    meta: {
      type: "object",
      properties: {
        pronunciationScore: { type: "number" },
        confidence: { type: "number" },
        speakingTimeMs: { type: "number" },
      },
    },
  },
} as const;

export class AiCoreService {
  constructor(
    private readonly mock = new MockAiCore(),
    private readonly fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
  ) {}

  async createRealtimeSession(): Promise<RealtimeSession | null> {
    if (!USE_REALTIME_AI || !OPENAI_API_KEY) {
      return null;
    }

    try {
      const response = await this.fetchImpl("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: DEFAULT_REALTIME_MODEL,
          voice: "verse",
          modalities: ["audio", "text"],
        }),
      });

      if (!response.ok) {
        console.warn("[AiCore] Failed to create realtime session", await safeText(response));
        return null;
      }

      const payload = (await response.json()) as RealtimeSession;
      return payload;
    } catch (error) {
      console.error("[AiCore] Realtime session error", error);
      return null;
    }
  }

  async generateTaskFeedback(args: GenerateTaskFeedbackArgs): Promise<TaskFeedbackContract> {
    if (!USE_REALTIME_AI || !OPENAI_API_KEY) {
      return this.mock.generateTaskFeedback(args);
    }

    try {
      const realtimeResult = await this.generateWithOpenAI(args);
      if (realtimeResult) {
        return realtimeResult;
      }
    } catch (error) {
      console.error("[AiCore] Falling back to mock feedback", error);
    }

    return this.mock.generateTaskFeedback(args);
  }

  private async generateWithOpenAI({ plan, context, retrieval }: GenerateTaskFeedbackArgs) {
    const prompt = this.buildPrompt(plan, context, retrieval);

    const response = await this.fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_REALTIME_MODEL,
        input: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: "You are Angie, an adaptive English tutor. Respond strictly with JSON following the provided schema.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "task_feedback",
            schema: JSON_SCHEMA,
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      console.warn("[AiCore] OpenAI response not OK", await safeText(response));
      return null;
    }

    const payload = await response.json();
    const feedback = extractJson(payload) as TaskFeedbackContract | null;
    return feedback;
  }

  private buildPrompt(plan: LessonPlanContract, context: LessonContext, retrieval: RagRetrievalResult) {
    const stage = plan.stages.find((item) => item.id === context.stageId) ?? plan.stages[0];
    return [
      `Lesson ID: ${plan.lessonId}`,
      `Current stage: ${stage.id} (${stage.kind})`,
      `Targets: ${plan.targets.map((target) => `${target.type}:${target.id}`).join(", ")}`,
      `Learner transcript: ${context.transcript ?? "(none)"}`,
      `Signals: ${JSON.stringify(context.signals ?? {})}`,
      `Relevant pedagogy docs: ${retrieval.pedagogyDocs.map((doc) => doc.id).join(", ")}`,
      `Personal memory: ${retrieval.personalMemory.map((item) => item.content).join(" | ")}`,
      `Return structured TASK+FEEDBACK JSON following the schema.`,
    ].join("\n");
  }
}

async function safeText(response: Response) {
  try {
    return await response.text();
  } catch (error) {
    return String(error);
  }
}

function extractJson(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return null;
  const maybe = (payload as { output?: unknown; response?: unknown }).output ??
    (payload as { response?: { output?: unknown } }).response?.output;

  const segments = Array.isArray(maybe) ? maybe : [];
  for (const segment of segments) {
    if (!segment || typeof segment !== "object") continue;
    const content = (segment as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const item of content) {
      if (!item || typeof item !== "object") continue;
      if ((item as { type?: string }).type === "json" && "json" in item) {
        return (item as { json: unknown }).json;
      }
      if ((item as { type?: string }).type === "output_text" && "text" in item) {
        try {
          return JSON.parse((item as { text: string }).text);
        } catch {
          continue;
        }
      }
    }
  }

  if ("content" in (payload as Record<string, unknown>)) {
    const content = (payload as { content?: unknown }).content;
    if (typeof content === "string") {
      try {
        return JSON.parse(content);
      } catch {
        return null;
      }
    }
  }

  return null;
}
