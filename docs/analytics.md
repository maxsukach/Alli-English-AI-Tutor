# Analytics Pipeline

Angie emits structured lesson events both to Postgres (`Event` table) and an external ClickHouse cluster for high-volume analytics.

## Events

| Event | Trigger |
| --- | --- |
| `lesson_started` | After billing permits a session and the planner issues a plan. |
| `lesson_turn` | Each learner turn processed by the orchestrator/adaptive engine. |
| `feedback_emitted` | Immediately after feedback is stored for a turn. |
| `lesson_completed` | When no further stage is suggested (session ended). |
| `lesson_denied` | Billing/auth prevented session start. |
| `billing_quota_exhausted` | Stripe quota enforced and prevented a lesson. |

Each payload contains:

```json
{
  "event": "lesson_turn",
  "timestamp": "2025-09-24T10:00:00.000Z",
  "profile_id": "...",
  "lesson_id": "...",
  "properties": { /* JSON */ }
}
```

## Configuration

Set the following environment variables (see `.env.example`):

- `ENABLE_ANALYTICS_PIPELINE=true` to enable external dispatch.
- `CLICKHOUSE_URL` – full HTTP endpoint (e.g., `https://clickhouse.example.com:8443/?query=INSERT%20INTO%20angie.events%20FORMAT%20JSONEachRow`).
- `CLICKHOUSE_USER` / `CLICKHOUSE_PASSWORD` for Basic auth (optional).

When disabled, events remain in Postgres only.

## Deployment Notes

- The pipeline batches events per request (newline-delimited JSON). Ensure the ClickHouse query matches the table schema.
- Failures are logged but non-fatal; the application continues.
- Billing and orchestrator modules can add new events without code churn—declare names in `src/lib/eventSchema.ts`.
