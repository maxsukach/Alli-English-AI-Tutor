import { NextResponse } from "next/server";
import Stripe from "stripe";
import { BillingService } from "@/lib/billing";

export const runtime = "nodejs";

const ENABLE_BILLING = process.env.ENABLE_STRIPE_BILLING === "true";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const billingService = new BillingService();

export async function POST(request: Request) {
  if (!ENABLE_BILLING) {
    return NextResponse.json({ skipped: true });
  }

  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    console.warn("[StripeWebhook] Stripe keys not configured");
    return NextResponse.json({ skipped: true });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    console.error("[StripeWebhook] Signature verification failed", message);
    return new Response(`Webhook Error: ${message}`, {
      status: 400,
    });
  }

  await billingService.applyStripeEvent(event);

  return NextResponse.json({ received: true });
}
