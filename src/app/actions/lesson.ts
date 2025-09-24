"use server";

import { LessonOrchestrator } from "@/server/lesson/orchestrator";
import { AuthService } from "@/server/services/auth";
import { BillingService } from "@/lib/billing";
import { AnalyticsClient } from "@/server/lesson/analytics-client";

const orchestrator = new LessonOrchestrator();
const authService = new AuthService();
const billingService = new BillingService();
const analyticsClient = new AnalyticsClient();

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
  const billingGate = await billingService.assertLessonAllowance(profile.id);
  if (!billingGate.allowed) {
    await analyticsClient.record(profile.id, [
      {
        name: "lesson_denied",
        props: {
          reason: billingGate.reason,
          plan: billingGate.plan,
          remaining: billingGate.remaining,
        },
      },
    ]);

    return {
      plan: null,
      profile,
      isDemo,
      supabaseUserId,
      billing: billingGate,
      error: {
        code: billingGate.reason ?? "not_allowed",
        message:
          billingGate.reason === "quota_exhausted"
            ? "Lesson quota exhausted"
            : billingGate.reason === "no_entitlement"
              ? "No active subscription"
              : "Billing disabled",
      },
    };
  }

  const plan = await orchestrator.startLesson({
    profileId: profile.id,
    cefr: payload.cefr ?? profile.cefrRange ?? undefined,
    goals: payload.goals ?? profile.goals ?? undefined,
    preferredTopics: payload.preferredTopics ?? parseInterests(profile.interests),
    history: payload.history,
  });

  await billingService.recordLessonUsage(billingGate);

  const billingState = {
    ...billingGate,
    lessonsUsed:
      typeof billingGate.lessonsUsed === "number" ? billingGate.lessonsUsed + 1 : billingGate.lessonsUsed,
    remaining:
      typeof billingGate.remaining === "number" ? Math.max(0, billingGate.remaining - 1) : billingGate.remaining,
  };

  await analyticsClient.record(profile.id, [
    {
      name: "lesson_started",
      lessonId: plan.lessonId,
      props: {
        plan: plan.targets,
        billing: billingState,
      },
    },
  ]);

  return {
    plan,
    profile,
    isDemo,
    supabaseUserId,
    billing: billingState,
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
