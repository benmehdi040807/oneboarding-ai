// lib/subscriptions.ts
import { prisma } from "@/lib/db";
import { ppGetSubscription, extractPeriodEndFromPP } from "@/lib/paypal";
import type { PlanType, SubStatus } from "@prisma/client";

/** Déduit la clé de plan interne à partir d’un plan_id PayPal */
function inferPlanKeyFromPlanId(planId?: string): "CONTINU" | "PASS1MOIS" | undefined {
  if (!planId) return undefined;
  // Heuristique simple : si l’ID contient "PASS", on considère PASS1MOIS ; sinon CONTINU
  return /PASS/i.test(planId) ? "PASS1MOIS" : "CONTINU";
}

/** Upsert lors de l’approve (retour bouton PayPal côté client) */
export async function linkSubscriptionToUser(opts: {
  phoneE164: string;
  plan: "CONTINU" | "PASS1MOIS";
  paypalSubId: string;
}) {
  const { phoneE164, plan, paypalSubId } = opts;

  // 1) Récup PayPal (status + dates)
  const ppSub = await ppGetSubscription(paypalSubId);
  const status = (ppSub?.status as SubStatus) ?? "ACTIVE";

  // On extrait une date d’échéance exploitable :
  // - abonnement: next_billing_time (si dispo)
  // - pass 1 mois: start_time + 30j (fallback)
  const currentPeriodEnd = extractPeriodEndFromPP(ppSub, plan) ?? null;

  // 2) User upsert (clé = téléphone)
  const user = await prisma.user.upsert({
    where: { phoneE164 },
    update: {},
    create: { phoneE164 },
    select: { id: true },
  });

  // 3) Subscription upsert (clé business = paypalId)
  await prisma.subscription.upsert({
    where: { paypalId: paypalSubId },
    update: {
      userId: user.id,
      plan: plan as PlanType,
      status,
      currentPeriodEnd,
      // Annulé: on honore jusqu’à l’échéance → cancelAtPeriodEnd = true
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

/** Applique un changement d’état reçu via webhook (idempotent) */
export async function applyWebhookChange(evt: {
  event_type: string;
  resource: any;
}) {
  const type = evt.event_type;
  const res = evt.resource;

  // PayPal peut envoyer 'resource.id' OU 'resource.subscription_id'
  const subId: string | undefined = res?.id || res?.subscription_id;
  if (!subId) return;

  // 1) Refetch PayPal pour avoir l’état le plus fiable (dates/status/plan_id)
  const pp = await ppGetSubscription(subId);
  const status = pp?.status as SubStatus | undefined;
  const planKey = inferPlanKeyFromPlanId(pp?.plan_id) ?? "CONTINU";
  const periodEnd = extractPeriodEndFromPP(pp, planKey);

  // 2) Préparer flags selon l’évènement
  let cancelAtPeriodEnd: boolean | undefined = undefined;

  switch (type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      // actif immédiat
      cancelAtPeriodEnd = false;
      break;

    case "BILLING.SUBSCRIPTION.SUSPENDED":
      // on coupe l’accès tout de suite (suspension)
      cancelAtPeriodEnd = true;
      break;

    case "BILLING.SUBSCRIPTION.CANCELLED":
      // on honore jusqu’à la fin de période si connue
      cancelAtPeriodEnd = true;
      break;

    case "BILLING.SUBSCRIPTION.EXPIRED":
      // expiré: plus d’accès (mais on laisse la date telle quelle pour l’historique)
      cancelAtPeriodEnd = true;
      break;

    case "PAYMENT.SALE.COMPLETED":
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
      // Paiement OK / échec de paiement : on journalise simplement.
      // (Tu peux créer un PaymentLog si besoin.)
      break;

    default:
      // autres évents ignorés
      break;
  }

  // 3) Idempotence : updateMany au cas où l’ID n’est pas encore lié (rare)
  await prisma.subscription.updateMany({
    where: { paypalId: subId },
    data: {
      status: status ?? undefined,
      currentPeriodEnd: periodEnd ?? undefined,
      cancelAtPeriodEnd,
      // touche pas au plan ici (il est fixé à l’approve par le client)
    },
  });

  // (Optionnel) si aucun enregistrement n’est trouvé, on ne crée pas
  // de nouvelle subscription ici (on attend le flux d’approve côté client).
}

/** Règle d’accès
 * TRUE si :
 *  - status ACTIVE
 *  - OU status CANCELLED avec currentPeriodEnd dans le futur (on honore jusqu'à l’échéance)
 */
export async function userHasPaidAccess(phoneE164: string) {
  const now = new Date();
  const sub = await prisma.subscription.findFirst({
    where: {
      user: { phoneE164 },
      OR: [
        { status: "ACTIVE" },
        { status: "CANCELLED", currentPeriodEnd: { gt: now } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return !!sub;
}
