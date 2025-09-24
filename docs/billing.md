# Billing & Entitlements

Angie enforces subscription access through the `Entitlement` table and Stripe webhooks.

## Data Model

`Entitlement` columns:

- `profile_id` – FK to `Profile`.
- `plan` – human-readable or Stripe price identifier.
- `status` – `ACTIVE`, `TRIAL`, `PAST_DUE`, `CANCELED`.
- `quota_lessons` / `lessons_used` – numeric quota and consumption.
- `renews_at` – next renewal timestamp.
- `stripe_customer_id` / `stripe_subscription_id` – Stripe linkage.
- `metadata` – JSON for custom flags (e.g., experimental quotas).

## Lesson Gating

1. `startLessonAction` calls `BillingService.assertLessonAllowance()`.
2. If disabled (`ENABLE_STRIPE_BILLING=false`), all lessons are allowed.
3. Otherwise, an active entitlement must exist and have remaining quota.
4. On success, we increment `lessons_used` and emit `lesson_started` analytics.
5. On failure, `lesson_denied` analytics fire and the client receives an error payload.

## Stripe Webhook

- Route: `POST /api/stripe/webhook`
- Requires `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` and `ENABLE_STRIPE_BILLING=true`.
- Supported events:
  - `customer.subscription.created|updated` – upsert entitlement, map `metadata.profileId`, optional `metadata.lessonQuota`.
  - `customer.subscription.deleted` – mark entitlement `CANCELED`.
  - `invoice.payment_failed` – mark `PAST_DUE`.
  - `invoice.payment_succeeded` – reset usage and mark `ACTIVE`.

Stripe metadata expectations:

```
subscription.metadata = {
  profileId: "<Profile.id>",
  plan: "pro",
  lessonQuota: "100"
}
```

## Environment Variables

See `.env.example` for:

- `ENABLE_STRIPE_BILLING`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID` (optional helper for client-side checkout)

## Local Development

- With billing disabled, seeded entitlement (`demo_pro`) allows unlimited play.
- To simulate quota exhaustion, set `quota_lessons` & `lessons_used` manually via Prisma Studio.
- Webhook handler tolerates missing configuration and returns `{ skipped: true }` to ease local runs.
