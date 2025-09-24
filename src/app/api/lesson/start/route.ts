import { NextResponse } from "next/server";
import { LessonOrchestrator } from "@/server/lesson/orchestrator";

const orchestrator = new LessonOrchestrator();

export async function POST(request: Request) {
  const body = await request.json();
  const plan = await orchestrator.startLesson({
    profileId: body.profileId,
    cefr: body.cefr,
    goals: body.goals,
    preferredTopics: body.preferredTopics,
    history: body.history,
  });
  return NextResponse.json(plan);
}
