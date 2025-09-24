import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { AnalyticsPipeline } from "./analytics";
import type { AnalyticsEnvelope } from "./eventSchema";

const ENABLE_BILLING = process.env.ENABLE_STRIPE_BILLING === "true";

export interface BillingGateResult {
  allowed: boolean;
  reason?: "billing_disabled" | "no_entitlement" | "quota_exhausted" | "status_not_active";
  plan?: string | null;
  remaining?: number | null;
  quotaLessons?: number | null;
  lessonsUsed?: number | null;
  entitlementId?: string | null;
}

export class BillingService {
  constructor(private readonly analytics = new AnalyticsPipeline()) {}

  async assertLessonAllowance(profileId: string): Promise<BillingGateResult> {
    if (!ENABLE_BILLING) {
      return { allowed: true, reason: "billing_disabled" };
    }

    const entitlement = await prisma.entitlement.findFirst({
      where: {
        profileId,
        status: {
          in: ["ACTIVE", "TRIAL"],
        },
      },
      orderBy: [{ renewsAt: "desc" }, { createdAt: "desc" }],
    });

    if (!entitlement) {
      await this.emitBillingEvent(profileId, {
        name: "lesson_denied",
        profileId,
        props: {
          reason: "no_entitlement",
        },
      });
      return { allowed: false, reason: "no_entitlement" };
    }

    const quota = entitlement.quotaLessons ?? null;
    const used = entitlement.lessonsUsed ?? 0;
    const remaining = quota != null ? quota - used : null;

    if (quota != null && remaining !== null && remaining <= 0) {
      await this.emitBillingEvent(profileId, {
        name: "billing_quota_exhausted",
        profileId,
        props: {
          plan: entitlement.plan,
          quota: quota,
          used,
        },
      });
      return {
        allowed: false,
        reason: "quota_exhausted",
        plan: entitlement.plan,
        remaining: 0,
        quotaLessons: quota,
        lessonsUsed: used,
        entitlementId: entitlement.id,
      };
    }

    return {
      allowed: true,
      plan: entitlement.plan,
      remaining,
      quotaLessons: quota,
      lessonsUsed: used,
      entitlementId: entitlement.id,
    };
  }

  async recordLessonUsage(result: BillingGateResult): Promise<void> {
    if (!ENABLE_BILLING) return;
    if (!result.entitlementId) return;

    await prisma.entitlement.update({
      where: { id: result.entitlementId },
      data: {
        lessonsUsed: {
          increment: 1,
        },
      },
    });
  }

  async applyStripeEvent(event: Stripe.Event): Promise<void> {
    if (!ENABLE_BILLING) return;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await this.upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await this.cancelSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await this.markPastDue(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_succeeded":
        await this.refreshFromInvoice(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  }

  private async upsertSubscription(subscription: Stripe.Subscription) {
    const profileId = subscription.metadata?.profileId;
    if (!profileId) {
      console.warn("[BillingService] Subscription missing profileId metadata", subscription.id);
      return;
    }

    const plan =
      subscription.metadata?.plan ??
      subscription.items.data[0]?.price?.nickname ??
      subscription.items.data[0]?.price?.id ??
      "stripe_plan";

    const quotaLessons = parseInt(subscription.metadata?.lessonQuota ?? "", 10);
    const renewsAt = getCurrentPeriodEnd(subscription);
    const status = mapStripeStatus(subscription.status);

    await prisma.entitlement.upsert({
      where: {
        profileId_plan: {
          profileId,
          plan,
        },
      },
      update: {
        status,
        quotaLessons: Number.isFinite(quotaLessons) ? quotaLessons : null,
        renewsAt,
        stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
        stripeSubscriptionId: subscription.id,
        metadata: subscription.metadata,
      },
      create: {
        profileId,
        plan,
        status,
        quotaLessons: Number.isFinite(quotaLessons) ? quotaLessons : null,
        renewsAt,
        stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
        stripeSubscriptionId: subscription.id,
        metadata: subscription.metadata,
      },
    });
  }

  private async cancelSubscription(subscription: Stripe.Subscription) {
    const profileId = subscription.metadata?.profileId;
    if (!profileId) return;

    await prisma.entitlement.updateMany({
      where: {
        profileId,
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: "CANCELED",
      },
    });
  }

  private async markPastDue(invoice: Stripe.Invoice) {
    const subscriptionId = getSubscriptionId(invoice);
    if (!subscriptionId) return;

    await prisma.entitlement.updateMany({
      where: {
        stripeSubscriptionId: subscriptionId,
      },
      data: {
        status: "PAST_DUE",
      },
    });
  }

  private async refreshFromInvoice(invoice: Stripe.Invoice) {
    const subscriptionId = getSubscriptionId(invoice);
    if (!subscriptionId) return;

    await prisma.entitlement.updateMany({
      where: {
        stripeSubscriptionId: subscriptionId,
      },
      data: {
        status: "ACTIVE",
        lessonsUsed: 0,
        renewsAt: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
      },
    });
  }

  private async emitBillingEvent(profileId: string, event: AnalyticsEnvelope) {
    await this.analytics.send([{ ...event, profileId }]);
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status): "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELED" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIAL";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "ACTIVE";
  }
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  return typeof periodEnd === "number" ? new Date(periodEnd * 1000) : null;
}

function getSubscriptionId(invoice: Stripe.Invoice) {
  const data = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription;
  if (!data) return undefined;
  return typeof data === "string" ? data : data.id;
}
