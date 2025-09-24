"use server";

import { LessonOrchestrator } from "@/server/lesson/orchestrator";
import { AuthService } from "@/server/services/auth";

const orchestrator = new LessonOrchestrator();
const authService = new AuthService();

interface StartLessonPayload {
  cefr?: string;
  goals?: string;
  preferredTopics?: string[];
  history?: Array<{ targetId: string; mistakes: number }>;
}

interface LessonTurnPayload {
  lessonId?: string;
  stageId?: string;
  transcript?: string;
  signals?: Record<string, number>;
}

export async function startLessonAction(payload: StartLessonPayload) {
  const { profile, isDemo, supabaseUserId } = await authService.getProfile();
  const plan = await orchestrator.startLesson({
    profileId: profile.id,
    cefr: payload.cefr ?? profile.cefrRange ?? undefined,
    goals: payload.goals ?? profile.goals ?? undefined,
    preferredTopics: payload.preferredTopics ?? parseInterests(profile.interests),
    history: payload.history,
  });

  return {
    plan,
    profile,
    isDemo,
    supabaseUserId,
  };
}

export async function lessonTurnAction(payload: LessonTurnPayload) {
  const { profile, isDemo, supabaseUserId } = await authService.getProfile();
  const result = await orchestrator.handleTurn({
    profileId: profile.id,
    lessonId: payload.lessonId,
    stageId: payload.stageId,
    transcript: payload.transcript,
    signals: payload.signals,
  });

  return {
    result,
    profile,
    isDemo,
    supabaseUserId,
  };
}

export async function createRealtimeSessionAction() {
  const session = await orchestrator.createRealtimeSession();
  return session;
}

function parseInterests(interests?: string | null) {
  if (!interests) return undefined;
  return interests
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
