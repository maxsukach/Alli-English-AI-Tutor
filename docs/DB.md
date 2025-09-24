# Database Guide

This project uses **PostgreSQL** via Prisma ORM. The schema is derived from the system architecture document (`docs/angie-architecture.md`) and models the core tutoring entities:

- `Profile` – learner metadata, progress state, and personalization attributes.
- `LessonPlan` / `LessonRun` – planned vs. executed lesson flows.
- `ErrorLog` – phonological/grammatical/lexical errors captured per turn.
- `SrsQueue` – spaced-repetition scheduling per target item.
- `AdaptiveAbility` / `AdaptiveEvent` – ability estimates and adaptation rationale.
- `KbDoc` – pedagogy knowledge-base documents and embeddings.
- `Media` – audio/transcript artifacts tied to lesson runs.
- `Event` – analytics events for downstream pipelines.

## Migrations

Prisma migrations live under `prisma/migrations`. To apply the latest schema in development:

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init_core_schema
```

This will create/update the local database defined by `DATABASE_URL`.

## Seeding

A lightweight seed script (`prisma/seed.ts`) inserts:

- A demo learner profile (`demo-user`).
- A reference `KbDoc` for A2 past simple negatives.
- A starter lesson plan + run with example feedback, error log, SRS entry, analytics event, and audio media.

Run the seed after migrations:

```bash
pnpm seed
```

You can inspect the records with Prisma Studio:

```bash
pnpm prisma studio
```

## Operational Notes

- Foreign keys and indexes mirror the architecture requirements (profiles → lesson runs, lesson runs → errors/adaptive events/media/events).
- Soft feature toggles for downstream integrations are exposed via `.env.example` (`USE_REALTIME_AI`, `ENABLE_ANALYTICS_PIPELINE`, `ENABLE_STRIPE_BILLING`).
- Keep destructive operations out of production; this setup is intended for local development only.
