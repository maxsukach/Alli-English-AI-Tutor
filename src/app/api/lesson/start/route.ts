import { NextResponse } from "next/server";
import { LessonOrchestrator } from "@/server/lesson/orchestrator";
import { AuthService } from "@/server/services/auth";
import { BillingService } from "@/lib/billing";
import { AnalyticsClient } from "@/server/lesson/analytics-client";

const orchestrator = new LessonOrchestrator();
const authService = new AuthService();
const billingService = new BillingService();
const analyticsClient = new AnalyticsClient();

export async function POST(request: Request) {
  const body = await request.json();
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

    return NextResponse.json({
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
    });
  }

  const plan = await orchestrator.startLesson({
    profileId: profile.id,
    cefr: body.cefr ?? profile.cefrRange ?? undefined,
    goals: body.goals ?? profile.goals ?? undefined,
    preferredTopics: body.preferredTopics ?? parseInterests(profile.interests),
    history: body.history,
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

  return NextResponse.json({ plan, profile, isDemo, supabaseUserId, billing: billingState });
}

function parseInterests(interests?: string | null) {
  if (!interests) return undefined;
  return interests
    .split(",")
    .map((item: string) => item.trim())
    .filter(Boolean);
}
