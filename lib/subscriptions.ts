// lib/subscriptions.ts
import { prisma } from "@/lib/db";

/**
 * Orders-only (PayPal Checkout Orders v2)
 * - On stocke l'orderId PayPal dans subscription.paypalId
 * - Le droit d'accès est basé sur currentPeriodEnd (date de fin)
 *
 * IMPORTANT:
 * - APPROVED ≠ forcément payé (selon ton flow).
 * - L'accès "payé" est accordé quand CAPTURED (PAYMENT.CAPTURE.COMPLETED),
 *   ou si toi tu captures dans /pay/return et tu mets déjà CAPTURED.
 */

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */
export type PlanType = "one-day" | "one-month" | "one-year" | "one-life";

export type SubStatus =
  | "APPROVAL_PENDING" // created locally, waiting user approval
  | "APPROVED" // checkout approved by user
  | "CAPTURED" // payment captured
  | "DENIED" // capture denied
  | "REFUNDED"; // refunded later (dispute/refund)

/* -------------------------------------------------------------------------- */
/*                               Durations helper                             */
/* -------------------------------------------------------------------------- */
function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function computePeriodEnd(plan: PlanType, from: Date): Date {
  switch (plan) {
    case "one-day":
      return addDays(from, 1);
    case "one-month":
      return addDays(from, 30);
    case "one-year":
      return addDays(from, 365);
    case "one-life":
      // "Life" = accès quasi-perpétuel : 100 ans (suffisant en pratique)
      return addDays(from, 365 * 100);
    default:
      return addDays(from, 30);
  }
}

/* -------------------------------------------------------------------------- */
/*                         Order ↔ User linking (Return)                       */
/* -------------------------------------------------------------------------- */
/**
 * À appeler dans /api/pay/return (ou dès que tu as orderId + phone + plan)
 * Objectif:
 * - garantir l’existence du user (phoneE164)
 * - upsert subscription (paypalId=orderId)
 * - poser une échéance "souveraine" (currentPeriodEnd) basée sur le plan
 */
export async function linkOrderToUser(opts: {
  phoneE164: string;
  plan: PlanType;
  paypalOrderId: string;
  // si tu captures immédiatement dans /pay/return, tu peux passer CAPTURED
  status?: SubStatus;
}): Promise<{ userId: string; status: SubStatus; currentPeriodEnd: Date }> {
  const { phoneE164, plan, paypalOrderId } = opts;

  const now = new Date();
  const status: SubStatus = opts.status ?? "APPROVED";
  const currentPeriodEnd = computePeriodEnd(plan, now);

  // 1) User upsert
  const user = await prisma.user.upsert({
    where: { phoneE164 },
    update: {},
    create: { phoneE164 },
    select: { id: true },
  });

  // 2) Subscription upsert (idempotent by paypalId = orderId)
  await prisma.subscription.upsert({
    where: { paypalId: paypalOrderId },
    update: {
      userId: user.id,
      plan,
      status,
      currentPeriodEnd,
      // one-shot access => pas de "cancelAtPeriodEnd"
      cancelAtPeriodEnd: false,
    },
    create: {
      paypalId: paypalOrderId,
      userId: user.id,
      plan,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  return { userId: user.id, status, currentPeriodEnd };
}

/* -------------------------------------------------------------------------- */
/*                            Webhook (Orders/Captures)                        */
/* -------------------------------------------------------------------------- */
function extractOrderIdFromWebhook(type: string, resource: any): string | undefined {
  if (!type || !resource) return undefined;

  // Orders events: resource.id = orderId
  if (type.startsWith("CHECKOUT.ORDER.")) {
    return resource?.id;
  }

  // Capture events: orderId usually in supplementary_data.related_ids.order_id
  if (type.startsWith("PAYMENT.CAPTURE.")) {
    return (
      resource?.supplementary_data?.related_ids?.order_id ||
      resource?.supplementary_data?.related_ids?.orderId ||
      undefined
    );
  }

  return undefined;
}

function mapWebhookTypeToStatus(type: string): SubStatus | undefined {
  switch (type) {
    case "CHECKOUT.ORDER.APPROVED":
      return "APPROVED";
    case "CHECKOUT.ORDER.COMPLETED":
      // Selon config, ça peut arriver sans capture exploitable.
      // On le traite comme APPROVED (le vrai "paid" reste CAPTURED).
      return "APPROVED";
    case "PAYMENT.CAPTURE.COMPLETED":
      return "CAPTURED";
    case "PAYMENT.CAPTURE.DENIED":
      return "DENIED";
    case "PAYMENT.CAPTURE.REFUNDED":
      return "REFUNDED";
    default:
      return undefined;
  }
}

/**
 * Webhook handler appelé depuis /api/paypal/webhook
 * Ici, on ne "devine" pas le plan.
 * On update uniquement si on retrouve une ligne via paypalId=orderId.
 */
export async function applyWebhookChange(evt: {
  event_type: string;
  resource: any;
}): Promise<void> {
  const type = evt?.event_type;
  const resource = evt?.resource;
  if (!type || !resource) return;

  const orderId = extractOrderIdFromWebhook(type, resource);
  if (!orderId) return;

  const nextStatus = mapWebhookTypeToStatus(type);
  if (!nextStatus) return;

  // Pour CAPTURED: on laisse currentPeriodEnd tel quel (déjà fixé au moment du return)
  // Pour REFUNDED: on coupe l’accès immédiatement (currentPeriodEnd = now)
  const now = new Date();

  await prisma.subscription.updateMany({
    where: { paypalId: orderId },
    data: {
      status: nextStatus,
      ...(nextStatus === "REFUNDED" ? { currentPeriodEnd: now } : {}),
      cancelAtPeriodEnd: false,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                               Access entitlement                            */
/* -------------------------------------------------------------------------- */
/**
 * TRUE si:
 * - subscription.status === CAPTURED
 * - ET currentPeriodEnd > now
 *
 * (On ne donne PAS accès sur APPROVED par défaut.
 *  Si tu veux donner accès dès APPROVED, dis-le et je te change la règle.)
 */
export async function userHasPaidAccess(phoneE164: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: { user: { phoneE164 } },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      currentPeriodEnd: true,
      plan: true,
      createdAt: true,
    },
  });

  if (!sub) return false;

  const now = new Date();
  const end = sub.currentPeriodEnd ?? sub.createdAt; // sécurité
  if (end <= now) return false;

  // accès payé: uniquement si CAPTURED
  return sub.status === "CAPTURED";
}
