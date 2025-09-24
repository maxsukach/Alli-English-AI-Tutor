import { NextResponse } from "next/server";
import { LessonOrchestrator } from "@/server/lesson/orchestrator";
import { AuthService } from "@/server/services/auth";

const orchestrator = new LessonOrchestrator();
const authService = new AuthService();

export async function POST(request: Request) {
  const body = await request.json();
  const { profile, isDemo, supabaseUserId } = await authService.getProfile();

  const plan = await orchestrator.startLesson({
    profileId: profile.id,
    cefr: body.cefr ?? profile.cefrRange ?? undefined,
    goals: body.goals ?? profile.goals ?? undefined,
    preferredTopics: body.preferredTopics ?? parseInterests(profile.interests),
    history: body.history,
  });

  return NextResponse.json({ plan, profile, isDemo, supabaseUserId });
}

function parseInterests(interests?: string | null) {
  if (!interests) return undefined;
  return interests
    .split(",")
    .map((item: string) => item.trim())
    .filter(Boolean);
}
