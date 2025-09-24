export type LessonTargetType = "structure" | "vocab" | "pronunciation" | "fluency" | "listening";

export interface LessonTarget {
  type: LessonTargetType;
  id: string;
}

export type StageKind =
  | "dialogue"
  | "modeling"
  | "roleplay"
  | "formative"
  | "srs"
  | "extension"
  | "diagnostic";

export interface StageTimeouts {
  soft?: number;
  hard?: number;
}

export interface StageMaterial {
  kbRefs?: string[];
  examples?: string[];
  rubricRef?: string;
  successCriteria?: string[];
  scenario?: string;
}

export interface LessonStage {
  id: string;
  kind: StageKind;
  goal?: string;
  prompt?: string;
  materials?: StageMaterial;
  timeouts?: StageTimeouts;
  items?: Array<{ type: "word" | "pattern"; id: string }>;
}

export interface PlanBranching {
  onHighError?: string;
  onFastSuccess?: string;
  onLowConfidence?: string;
}

export interface LessonPlanContract {
  lessonId: string;
  targets: LessonTarget[];
  stages: LessonStage[];
  branching?: PlanBranching;
}

export interface AdaptiveDecisionContract {
  lessonId: string;
  stageId: string;
  ability: Record<string, { theta: number; sigma: number }>;
  decision: {
    action: "advance" | "repeat" | "remediate";
    delta: 1 | 0 | -1;
  };
  nextTask?: {
    id: string;
    difficulty: number;
    variant?: string;
  };
  rationale: {
    signals: Record<string, number>;
    rule: string;
  };
}

export interface TaskFeedbackContract {
  task: {
    stageId: string;
    prompt: string;
    targets: LessonTarget[];
  };
  feedback: {
    summary: string;
    errors: Array<{
      type: "phon" | "gram" | "lex";
      snippet: string;
      correction: string;
      severity: 1 | 2 | 3;
    }>;
    recommendations: string[];
  };
  meta: {
    pronunciationScore?: number;
    confidence?: number;
    speakingTimeMs?: number;
  };
}

export interface LessonContext {
  profileId: string;
  lessonId: string;
  stageId: string;
  transcript?: string;
  partialCaptions?: string[];
  signals?: Record<string, number>;
}

export interface OrchestratorResult {
  plan: LessonPlanContract;
  task: TaskFeedbackContract["task"];
  feedback: TaskFeedbackContract["feedback"];
  adaptiveDecision: AdaptiveDecisionContract;
  telemetry: {
    events: Array<{ name: string; props: Record<string, unknown> }>;
  };
  policyViolations?: PolicyViolation[];
}

export interface RagRetrievalResult {
  personalMemory: Array<{ id: string; content: string; score: number }>;
  pedagogyDocs: Array<{ id: string; content: string; score: number }>;
}

export interface PolicyViolation {
  code: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyResult {
  valid: boolean;
  violations: PolicyViolation[];
  redactedPrompt?: string;
}

export interface PlannerInput {
  profileId: string;
  cefr?: string;
  goals?: string;
  history?: Array<{ targetId: string; mistakes: number }>;
  preferredTopics?: string[];
}

export interface AdaptiveInput {
  profileId: string;
  lessonId: string;
  stageId: string;
  signals: Record<string, number>;
}
