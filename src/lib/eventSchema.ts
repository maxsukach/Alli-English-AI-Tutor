export type LessonEventName =
  | "lesson_started"
  | "lesson_turn"
  | "feedback_emitted"
  | "lesson_completed"
  | "lesson_denied"
  | "billing_quota_exhausted";

export interface AnalyticsEnvelope {
  name: LessonEventName | string;
  profileId?: string | null;
  lessonId?: string | null;
  props?: Record<string, unknown>;
  timestamp?: Date;
}

export const KNOWN_EVENTS: LessonEventName[] = [
  "lesson_started",
  "lesson_turn",
  "feedback_emitted",
  "lesson_completed",
  "lesson_denied",
  "billing_quota_exhausted",
];
