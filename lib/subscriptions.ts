import { prisma } from "@/lib/db";
import { ppGetSubscription, extractPeriodEndFromPP } from "@/lib/paypal";
import { PlanType, SubStatus } from "@prisma/client";

/** Upsert lors de l’approve (post-paiement) */
export async function linkSubscriptionToUser(opts: {
  phoneE164: string;
  plan: "CONTINU" | "PASS1MOIS";
  paypalSubId: string;
}) {
  const { phoneE164, plan, paypalSubId } = opts;

  // 1) Récup PayPal pour status & échéance
  const ppSub = await ppGetSubscription(paypalSubId);
  const status = (ppSub?.status as SubStatus) ?? "ACTIVE";
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
      plan: plan as PlanType,
      status,
      currentPeriodEnd,
      // Par défaut: on ne coupe pas immédiat si cancel → on honorera jusqu'à l’échéance
      cancelAtPeriodEnd: status === "CANCELLED" ? true : undefined,
    },
    create: {
      paypalId: paypalSubId,
      userId: user.id,
      plan: plan as PlanType,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: status === "CANCELLED",
    },
  });

  return { userId: user.id, status, currentPeriodEnd };
}

/** Applique un changement d’état reçu via webhook */
export async function applyWebhookChange(evt: {
  event_type: string;
  resource: any;
}) {
  const type = evt.event_type;
  const res = evt.resource;
  const subId = res?.id || res?.subscription_id;
  if (!subId) return;

  // Refetch pour info fiable (dates / status)
  let status: SubStatus | undefined;
  let periodEnd: Date | null | undefined = undefined;
  let cancelAtPeriodEnd: boolean | undefined;

  const pp = await ppGetSubscription(subId);
  status = pp?.status as SubStatus | undefined;

  // S’il y a une date de prochain cycle → on s’en sert comme "échéance d’accès"
  const planGuess: "CONTINU" | "PASS1MOIS" | undefined =
    pp?.plan_id && typeof pp.plan_id === "string" && pp.plan_id.includes("PASS")
      ? "PASS1MOIS"
      : "CONTINU";
  periodEnd = extractPeriodEndFromPP(pp, planGuess ?? "CONTINU");

  switch (type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      cancelAtPeriodEnd = false;
      break;
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      // accès coupé immédiatement
      cancelAtPeriodEnd = true;
      break;
    case "BILLING.SUBSCRIPTION.CANCELLED":
      // on honore jusqu'à échéance → cancelAtPeriodEnd = true
      cancelAtPeriodEnd = true;
      // si PayPal n’expose plus next_billing_time après cancel, on garde l’ancienne en base si déjà connue
      break;
    case "BILLING.SUBSCRIPTION.EXPIRED":
      cancelAtPeriodEnd = true;
      break;
    default:
      // autres événements: on ne modifie pas cancelAtPeriodEnd
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
