# AI Core Integration

Angie’s AI Core coordinates OpenAI’s Realtime/Responses APIs to produce structured TASK/FEEDBACK output and generate ephemeral audio sessions.

## Architecture Overview

- **Realtime Sessions** – POST `https://api.openai.com/v1/realtime/sessions` with `OPENAI_API_KEY` to obtain an ephemeral `client_secret`. Frontend clients connect over WebRTC/WebSocket using this token when `USE_REALTIME_AI=true`.
- **Structured Feedback** – Server-side calls to `https://api.openai.com/v1/responses` enforce a JSON schema that matches `TaskFeedbackContract`. The orchestrator merges RAG results, lesson context, and policy checks before persisting the feedback to `lesson_runs.feedback_json`.
- **Fallback Mock** – When `USE_REALTIME_AI=false` or the key is missing, the service falls back to a deterministic mock (matching the previous behaviour) so local development works offline.

## Environment Variables

| Variable | Description |
| --- | --- |
| `USE_REALTIME_AI` | Gate to toggle live OpenAI calls. Set to `true` in dev/staging once credentials are configured. |
| `OPENAI_API_KEY` | Standard OpenAI API key with Realtime/Responses access. |
| `OPENAI_REALTIME_MODEL` | Optional override for the realtime model (default `gpt-4.1-mini`). |

## Supabase Auth Binding

Server actions and API routes now rely on the authenticated Supabase user to resolve a `Profile` record:

1. `AuthService` reads cookies via `@supabase/ssr` and calls `supabase.auth.getUser()`.
2. The learner’s `user.id` is mapped to `profiles.user_id`; missing records are created with metadata fields (name, CEFR, L1).
3. If Supabase credentials or a session are absent, the demo profile (`demo-user`) is used.

Required environment variables:

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Project URL. |
| `SUPABASE_ANON_KEY` | Client key for browser/server usage. |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Optional)* private key to allow server-side profile enrichment; keep out of client bundles. |

## Feature Flags

- `USE_REALTIME_AI=false` → mock responses only, no external calls.
- `ENABLE_ANALYTICS_PIPELINE` / `ENABLE_STRIPE_BILLING` remain untouched and are documented in `.env.example` for later modules.

## Testing Notes

- `pnpm lint`, `pnpm typecheck`, and `pnpm test -i` continue to run without hitting OpenAI when the realtime flag is disabled.
- You can manually request an ephemeral session via the `createRealtimeSessionAction` server action (exposed for future client wiring).

## Next Steps

- Wire the playground (or mobile app) to request realtime sessions and stream audio over WebRTC.
- Persist realtime session IDs to `media` for playback auditing.
- Add error telemetry for OpenAI failures to the analytics pipeline once Task 3 is complete.
