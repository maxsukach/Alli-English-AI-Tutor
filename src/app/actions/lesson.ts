"use server";

import { LessonOrchestrator } from "@/server/lesson/orchestrator";

const orchestrator = new LessonOrchestrator();

interface StartLessonPayload {
  profileId: string;
  cefr?: string;
  goals?: string;
  preferredTopics?: string[];
}

interface LessonTurnPayload {
  profileId: string;
  lessonId?: string;
  stageId?: string;
  transcript?: string;
  signals?: Record<string, number>;
}

export async function startLessonAction(payload: StartLessonPayload) {
  const plan = await orchestrator.startLesson(payload);
  return plan;
}

export async function lessonTurnAction(payload: LessonTurnPayload) {
  const result = await orchestrator.handleTurn(payload);
  return result;
}
