import { NextResponse } from "next/server";
import { LessonOrchestrator } from "@/server/lesson/orchestrator";

const orchestrator = new LessonOrchestrator();

export async function POST(request: Request) {
  const body = await request.json();
  const result = await orchestrator.handleTurn({
    profileId: body.profileId,
    lessonId: body.lessonId,
    stageId: body.stageId,
    transcript: body.transcript,
    signals: body.signals,
  });
  return NextResponse.json(result);
}
