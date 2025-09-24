"use client";

import { useEffect, useMemo, useState } from "react";
import type { LessonPlanContract, OrchestratorResult } from "@/server/lesson/contracts";

type ProfileSummary = {
  id: string;
  name?: string | null;
  email?: string | null;
  cefrRange?: string | null;
  isDemo: boolean;
  supabaseUserId?: string | null;
};

type StartLessonResponse = {
  plan: LessonPlanContract;
  profile: ProfileSummary;
  isDemo: boolean;
  supabaseUserId?: string | null;
};

type LessonTurnResponse = {
  result: OrchestratorResult;
  profile: ProfileSummary;
  isDemo: boolean;
  supabaseUserId?: string | null;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json();
}

export function LessonPlayground() {
  const [plan, setPlan] = useState<LessonPlanContract | null>(null);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<OrchestratorResult | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(true);

  useEffect(() => {
    startLesson();
  }, []);

  const currentStage = useMemo(() => plan?.stages.find((stage) => stage.id === currentStageId) ?? null, [plan, currentStageId]);

  async function startLesson() {
    setLoading(true);
    setError(null);
    try {
      const response = await postJson<StartLessonResponse>("/api/lesson/start", {
        preferredTopics: ["travel_a2"],
      });
      setPlan(response.plan);
      setCurrentStageId(response.plan.stages[0]?.id ?? null);
      setResult(null);
      setTranscript("");
      setProfile({ ...response.profile, isDemo: response.isDemo, supabaseUserId: response.supabaseUserId });
      setIsDemo(response.isDemo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function submitTurn() {
    if (!plan || !currentStageId) return;
    setLoading(true);
    setError(null);
    try {
      const turnResponse = await postJson<LessonTurnResponse>("/api/lesson/turn", {
        lessonId: plan.lessonId,
        stageId: currentStageId,
        transcript,
        signals: {
          acc: 0.65,
          rt_ms: transcript.length * 120,
          conf: 2,
        },
      });
      setResult(turnResponse.result);
      setPlan(turnResponse.result.plan);
      setCurrentStageId(turnResponse.result.adaptiveDecision.nextTask?.id ?? turnResponse.result.task.stageId);
      setTranscript("");
      setProfile({ ...turnResponse.profile, isDemo: turnResponse.isDemo, supabaseUserId: turnResponse.supabaseUserId });
      setIsDemo(turnResponse.isDemo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Angie Lesson Orchestrator Playground</h1>
        <p className="text-sm text-muted-foreground">Simulate a lesson turn across Planner → Adaptive → AI Core → SRS as defined in the architecture doc.</p>
        {profile && (
          <div className="rounded border border-emerald-600/40 bg-emerald-500/10 px-3 py-2 text-xs">
            <div className="flex flex-col gap-1">
              <span>
                Profile: <span className="font-mono">{profile.name ?? "(unnamed)"}</span> ({profile.id})
              </span>
              <span>CEFR: {profile.cefrRange ?? "unknown"} · Mode: {isDemo ? "Demo" : "Supabase"}</span>
              {profile.supabaseUserId && <span>Supabase UID: {profile.supabaseUserId}</span>}
            </div>
          </div>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded border p-4 space-y-3 bg-white/5">
          <h2 className="text-lg font-medium">Plan Overview</h2>
          {plan ? (
            <>
              <p className="text-sm text-muted-foreground">Lesson ID: <span className="font-mono text-xs">{plan.lessonId}</span></p>
              <div>
                <h3 className="text-sm font-semibold">Targets</h3>
                <ul className="ml-4 list-disc text-sm">
                  {plan.targets.map((target) => (
                    <li key={target.id} className="font-mono text-xs">{target.type} → {target.id}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Stages</h3>
                <ul className="ml-4 list-disc text-sm">
                  {plan.stages.map((stage) => (
                    <li key={stage.id} className={stage.id === currentStageId ? "font-semibold" : undefined}>
                      {stage.id} · {stage.kind}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Waiting for plan…</p>
          )}
        </div>

        <div className="rounded border p-4 space-y-3 bg-white/5">
          <h2 className="text-lg font-medium">Turn Input</h2>
          {currentStage && (
            <p className="text-sm text-muted-foreground">
              Current stage <span className="font-semibold">{currentStage.id}</span> ({currentStage.kind})
              {currentStage.prompt ? ` – ${currentStage.prompt}` : ""}
            </p>
          )}
          <label className="text-sm font-medium" htmlFor="transcript">Learner Transcript</label>
          <textarea
            id="transcript"
            className="w-full rounded border bg-transparent p-2 text-sm"
            rows={6}
            placeholder="Describe your last trip in English…"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
          />
          <button
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={submitTurn}
            disabled={loading || !plan || !currentStageId}
          >
            {loading ? "Processing…" : "Submit Turn"}
          </button>
          <button
            className="ml-2 rounded border px-3 py-2 text-sm"
            onClick={startLesson}
            disabled={loading}
          >
            Reset Lesson
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </section>

      {result && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded border p-4 space-y-3 bg-white/5">
            <h2 className="text-lg font-medium">AI Feedback</h2>
            <p className="text-sm">{result.feedback.summary}</p>
            <div>
              <h3 className="text-sm font-semibold">Errors</h3>
              <ul className="ml-4 list-disc text-sm">
                {result.feedback.errors.map((error, index) => (
                  <li key={index}>
                    [{error.type}] {error.snippet} → {error.correction} (severity {error.severity})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Recommendations</h3>
              <ul className="ml-4 list-disc text-sm">
                {result.feedback.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded border p-4 space-y-3 bg-white/5">
            <h2 className="text-lg font-medium">Adaptive Decision</h2>
            <p className="text-sm">Decision: <strong>{result.adaptiveDecision.decision.action}</strong> (Δ {result.adaptiveDecision.decision.delta})</p>
            <pre className="rounded bg-black/20 p-3 text-xs">
              {JSON.stringify(result.adaptiveDecision.ability, null, 2)}
            </pre>
            {result.policyViolations && result.policyViolations.length > 0 && (
              <div className="rounded border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
                <h3 className="font-semibold">Policy Flags</h3>
                <ul className="ml-4 list-disc">
                  {result.policyViolations.map((violation) => (
                    <li key={violation.code}>{violation.code}: {violation.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
