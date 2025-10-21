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

/**
 * Upsert lors du retour d’approval (post-paiement) :
 * - garantit l’existence de l’utilisateur (par phone)
 * - attache/actualise la souscription PayPal (status + échéance)
 */
export async function linkSubscriptionToUser(opts: {
  phoneE164: string;
  plan: PlanType;
  paypalSubId: string;
}): Promise<{ userId: string; status: SubStatus; currentPeriodEnd: Date | null }> {
  const { phoneE164, plan, paypalSubId } = opts;

  // 1) Lecture PayPal → status + échéance
  const ppSub = await ppGetSubscription(paypalSubId).catch(() => undefined as any);
  const status = ((ppSub?.status as string) || "ACTIVE") as SubStatus;
  const currentPeriodEnd = extractPeriodEndFromPP(ppSub, plan) ?? null;

  // 2) User upsert
  const user = await prisma.user.upsert({
    where: { phoneE164 },
    update: {},
    create: { phoneE164 },
    select: { id: true },
  });

  // 3) Subscription upsert (idempotent par paypalId)
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

/**
 * Applique un changement d’état reçu via webhook PayPal (idempotent).
 * On refetch la souscription chez PayPal pour se baser sur la vérité source.
 */
export async function applyWebhookChange(evt: {
  event_type: string;
  resource: any;
}): Promise<void> {
  const type = evt?.event_type;
  const res = evt?.resource;
  const subId: string | undefined = res?.id || res?.subscription_id;
  if (!type || !subId) return;

  // Refetch fiable (source of truth)
  const pp = await ppGetSubscription(subId).catch(() => undefined as any);
  const status = (pp?.status as SubStatus | undefined) ?? undefined;

  // Heuristique plan (CONTINU vs PASS1MOIS) si on n’a pas l’info locale
  const planGuess: PlanType =
    pp?.plan_id && typeof pp.plan_id === "string" && pp.plan_id.includes("PASS")
      ? "PASS1MOIS"
      : "CONTINU";

  // Échéance (pour PASS1MOIS et/ou info PayPal côté plan)
  const periodEnd = extractPeriodEndFromPP(pp, planGuess) ?? undefined;

  let cancelAtPeriodEnd: boolean | undefined;

  switch (type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      cancelAtPeriodEnd = false;
      break;
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      // Accès coupé immédiat par prudence
      cancelAtPeriodEnd = true;
      break;
    case "BILLING.SUBSCRIPTION.CANCELLED":
      // On honore jusqu’à échéance si connue
      cancelAtPeriodEnd = true;
      break;
    case "BILLING.SUBSCRIPTION.EXPIRED":
      cancelAtPeriodEnd = true;
      break;
    // Autres types possibles (paiement échoué etc.) : on laisse le status PayPal trancher
    default:
      break;
  }

  await prisma.subscription.updateMany({
    where: { paypalId: subId },
    data: {
      status: status ?? undefined,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
    },
  });

  // NB: Si plus tard on veut gérer l’auth device via un paiement 1 € (order/capture),
  // on traitera ces events (ex: PAYMENT.CAPTURE.COMPLETED) ailleurs, pas ici.
}

/**
 * Droit d’accès : TRUE si
 * - ACTIVE
 * - ou CANCELLED mais pas encore arrivé à l’échéance (currentPeriodEnd future)
 */
export async function userHasPaidAccess(phoneE164: string): Promise<boolean> {
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
