// lib/subscriptions.ts
import { prisma } from "@/lib/db";
import { ppGetSubscription, extractPeriodEndFromPP } from "@/lib/paypal";

// Types TS (au lieu des enums Prisma)
export type PlanType = "CONTINU" | "PASS1MOIS";
export type SubStatus =
  | "APPROVAL_PENDING"
  | "APPROVED"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED";

/** Upsert lors de l’approve (post-paiement) */
export async function linkSubscriptionToUser(opts: {
  phoneE164: string;
  plan: PlanType;
  paypalSubId: string;
}) {
  const { phoneE164, plan, paypalSubId } = opts;

  // 1) Récup PayPal pour status & échéance
  const ppSub = await ppGetSubscription(paypalSubId);
  const status = ((ppSub?.status as string) || "ACTIVE") as SubStatus;
  const currentPeriodEnd = extractPeriodEndFromPP(ppSub, plan) ?? null;

  // 2) User upsert
  const user = await prisma.user.upsert({
    where: { phoneE164 },
    update: {},
    create: { phoneE164 },
    select: { id: true },
  });

  // 3) Subscription upsert
  await prisma.subscription.upsert({
    where: { paypalId: paypalSubId },
    update: {
      userId: user.id,
      plan,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: status === "CANCELLED" ? true : undefined,
    },
    create: {
      paypalId: paypalSubId,
      userId: user.id,
      plan,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: status === "CANCELLED",
    },
  });

  return { userId: user.id, status, currentPeriodEnd };
}

/** Applique un changement d’état reçu via webhook (idempotent) */
export async function applyWebhookChange(evt: {
  event_type: string;
  resource: any;
}) {
  const type = evt.event_type;
  const res = evt.resource;
  const subId = res?.id || res?.subscription_id;
  if (!subId) return;

  // Refetch fiable
  const pp = await ppGetSubscription(subId);
  const status = (pp?.status as SubStatus | undefined) ?? undefined;

  // Déduire l’échéance courante
  const planGuess: PlanType =
    pp?.plan_id && typeof pp.plan_id === "string" && pp.plan_id.includes("PASS")
      ? "PASS1MOIS"
      : "CONTINU";
  const periodEnd = extractPeriodEndFromPP(pp, planGuess);

  let cancelAtPeriodEnd: boolean | undefined = undefined;

  switch (type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      cancelAtPeriodEnd = false;
      break;
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      cancelAtPeriodEnd = true; // accès coupé immédiat
      break;
    case "BILLING.SUBSCRIPTION.CANCELLED":
      cancelAtPeriodEnd = true; // on honore jusqu’à échéance
      break;
    case "BILLING.SUBSCRIPTION.EXPIRED":
      cancelAtPeriodEnd = true;
      break;
    default:
      break;
  }

  await prisma.subscription.updateMany({
    where: { paypalId: subId },
    data: {
      status: status ?? undefined,
      currentPeriodEnd: periodEnd ?? undefined,
      cancelAtPeriodEnd,
    },
  });
}

/** Règle d’accès : TRUE si actif OU (annulé mais pas encore arrivé à l’échéance) */
export async function userHasPaidAccess(phoneE164: string) {
  const sub = await prisma.subscription.findFirst({
    where: {
      user: { phoneE164 },
      OR: [
        { status: "ACTIVE" },
        {
          status: "CANCELLED",
          currentPeriodEnd: { gt: new Date() },
        },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return !!sub;
}
