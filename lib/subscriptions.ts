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

// Petit util pour les durées "logiques" (Pass 1 mois, etc.)
function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Upsert lors du retour d’approval (post-paiement) :
 * - garantit l’existence de l’utilisateur (par phone)
 * - attache/actualise la souscription PayPal (status + échéance)
 *
 * NB : on applique un fallback pour PASS1MOIS si PayPal
 * ne fournit aucune échéance claire.
 */
export async function linkSubscriptionToUser(opts: {
  phoneE164: string;
  plan: PlanType;
  paypalSubId: string;
}): Promise<{ userId: string; status: SubStatus; currentPeriodEnd: Date | null }> {
  const { phoneE164, plan, paypalSubId } = opts;

  // 1) Lecture PayPal → status + échéance
  const ppSub = await ppGetSubscription(paypalSubId).catch(
    () => undefined as any
  );
  const status = ((ppSub?.status as string) || "ACTIVE") as SubStatus;

  let currentPeriodEnd = extractPeriodEndFromPP(ppSub, plan) ?? null;

  // Fallback pour PASS1MOIS : si PayPal ne fournit pas d'échéance claire,
  // on considère "date d'aujourd'hui + 30 jours"
  if (!currentPeriodEnd && plan === "PASS1MOIS") {
    currentPeriodEnd = addDays(new Date(), 30);
  }

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
 *
 * NB : ici on **n’applique pas** le fallback 30 jours.
 * On laisse le currentPeriodEnd déjà posé par /pay/return,
 * et on ne le modifie que si PayPal fournit une info plus précise.
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

  // Échéance issue DIRECTEMENT de PayPal (si fournie)
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
      // Profil terminé côté PayPal, mais on laisse l’échéance jouer
      cancelAtPeriodEnd = true;
      break;
    // Autres types possibles : on laisse le status PayPal trancher
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
}

/**
 * Droit d’accès : TRUE si
 * - plan CONTINU avec status cohérent
 * - ou PASS1MOIS (même EXPIRED) mais période d’un mois non échue.
 *
 * currentPeriodEnd = "date souveraine de fin du dernier droit d’accès payé".
 */
export async function userHasPaidAccess(phoneE164: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      user: { phoneE164 },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      createdAt: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (!sub) return false;
  const now = new Date();

  // ---------- Plan CONTINU ----------
  if (sub.plan === "CONTINU") {
    // Abonnement actif
    if (sub.status === "ACTIVE") {
      return true;
    }

    // CANCELLED / EXPIRED mais avec période encore en cours
    if (
      (sub.status === "CANCELLED" || sub.status === "EXPIRED") &&
      sub.currentPeriodEnd &&
      sub.currentPeriodEnd > now
    ) {
      return true;
    }

    return false;
  }

  // ---------- Plan PASS1MOIS ----------
  // Échéance logique = currentPeriodEnd, sinon createdAt + 30 jours
  const logicalEnd =
    sub.currentPeriodEnd ?? addDays(sub.createdAt, 30);

  if (!logicalEnd || logicalEnd <= now) {
    // Période terminée
    return false;
  }

  // Pendant cette période, on considère que ces status donnent accès :
  switch (sub.status) {
    case "ACTIVE":
    case "APPROVED":
    case "APPROVAL_PENDING":
    case "CANCELLED":
    case "EXPIRED":
      return true;
    default:
      return false;
  }
}
