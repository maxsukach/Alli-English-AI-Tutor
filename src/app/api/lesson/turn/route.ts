import { NextResponse } from "next/server";
import { LessonOrchestrator } from "@/server/lesson/orchestrator";
import { AuthService } from "@/server/services/auth";

const orchestrator = new LessonOrchestrator();
const authService = new AuthService();

export async function POST(request: Request) {
  const body = await request.json();
  const { profile, isDemo, supabaseUserId } = await authService.getProfile();

  const result = await orchestrator.handleTurn({
    profileId: profile.id,
    lessonId: body.lessonId,
    stageId: body.stageId,
    transcript: body.transcript,
    signals: body.signals,
  });

  return NextResponse.json({ result, profile, isDemo, supabaseUserId });
}
