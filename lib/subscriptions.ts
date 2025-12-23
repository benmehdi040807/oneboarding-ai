// lib/subscriptions.ts (Orders v2 only)

import { prisma } from "@/lib/db";
import { ppAccessToken, PP_BASE } from "@/lib/paypal";
import { PLANS, STATUSES, type Plan, type PayStatus } from "@/lib/subscription-constants";

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function addYears(base: Date, years: number): Date {
  const d = new Date(base.getTime());
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function isE164(p?: string): p is string {
  return typeof p === "string" && p.startsWith("+") && p.length >= 6;
}

function planFromKind(kind?: string): Plan {
  switch ((kind || "").toLowerCase()) {
    case "one-day":
      return PLANS.ONE_DAY;
    case "one-month":
      return PLANS.ONE_MONTH;
    case "one-year":
      return PLANS.ONE_YEAR;
    case "one-life":
      return PLANS.ONE_LIFE;
    default:
      return PLANS.ONE_MONTH; // fallback “safe”
  }
}

function periodEndFor(plan: Plan, now = new Date()): Date {
  switch (plan) {
    case PLANS.ONE_DAY:
      return addDays(now, 1);
    case PLANS.ONE_MONTH:
      return addDays(now, 30);
    case PLANS.ONE_YEAR:
      return addYears(now, 1);
    case PLANS.ONE_LIFE:
      return addYears(now, 200);
  }
}

async function ppGetOrder(orderId: string): Promise<any> {
  const token = await ppAccessToken();
  const r = await fetch(`${PP_BASE.replace(/\/$/, "")}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error("PP_ORDER_FETCH");
  return r.json();
}

function trimDeviceId(v: any): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length >= 8 ? s : undefined;
}

function parseCustomId(rawCustom?: string): {
  phone?: string;
  deviceId?: string;
  kind?: string;
  consent?: boolean;
} {
  if (!rawCustom || typeof rawCustom !== "string") return {};

  try {
    const parsed = JSON.parse(rawCustom);

    // NEW compact format: p/d/k/c
    const p = parsed?.p;
    const d = parsed?.d;
    const k = parsed?.k;
    const c = parsed?.c;

    // legacy verbose format: phone/deviceId/kind/consent
    const phone = (typeof p === "string" ? p : parsed?.phone) as string | undefined;
    const deviceId = trimDeviceId(typeof d === "string" ? d : parsed?.deviceId);
    const kind = (typeof k === "string" ? k : parsed?.kind) as string | undefined;

    const consent = typeof c === "boolean" ? c : parsed?.consent === true;

    return { phone, deviceId, kind, consent };
  } catch {
    // ultra-legacy: phone in clear
    if (isE164(rawCustom)) return { phone: rawCustom };
    return {};
  }
}

/**
 * Orders v2 webhook handler (domain-level)
 * - event_type: CHECKOUT.ORDER.* or PAYMENT.CAPTURE.*
 * - resource: event resource
 */
export async function applyWebhookChange(evt: { event_type: string; resource: any }): Promise<void> {
  const type = evt?.event_type || "";
  const res = evt?.resource;

  // 1) Determine orderId
  let orderId: string | undefined;

  if (type.startsWith("CHECKOUT.ORDER.")) {
    orderId = res?.id;
  }

  if (!orderId && type.startsWith("PAYMENT.CAPTURE.")) {
    orderId = res?.supplementary_data?.related_ids?.order_id || undefined;
  }

  if (!orderId || typeof orderId !== "string") return;

  // 2) Fetch order as source of truth (for custom_id)
  const order = await ppGetOrder(orderId).catch(() => null);
  if (!order) return;

  const pu0 = Array.isArray(order?.purchase_units) ? order.purchase_units[0] : undefined;
  const rawCustom: string | undefined = pu0?.custom_id;

  const { phone, deviceId, kind, consent } = parseCustomId(rawCustom);
  if (!isE164(phone)) return;

  // 3) Map status
  let status: PayStatus = STATUSES.UNKNOWN;

  if (type === "CHECKOUT.ORDER.APPROVED") status = STATUSES.APPROVED;
  else if (type === "CHECKOUT.ORDER.COMPLETED") status = STATUSES.COMPLETED;
  else if (type === "PAYMENT.CAPTURE.COMPLETED") status = STATUSES.CAPTURED;
  else if (type === "PAYMENT.CAPTURE.DENIED") status = STATUSES.DENIED;
  else if (type === "PAYMENT.CAPTURE.REFUNDED") status = STATUSES.REFUNDED;

  const now = new Date();
  const plan = planFromKind(kind);

  // 4) Upsert user (consentAt seulement si user nouveau + consent true)
  const existing = await prisma.user.findUnique({
    where: { phoneE164: phone },
    select: { id: true },
  });

  const user = existing
    ? existing
    : await prisma.user.create({
        data: {
          phoneE164: phone,
          ...(consent === true ? { consentAt: now } : {}),
        },
        select: { id: true },
      });

  // 5) Upsert “Subscription” = accès payé (paypalId = orderId)
  // Règle souveraine :
  // - CAPTURED / COMPLETED => donne droit d'accès
  // - REFUNDED / DENIED => coupe immédiate
  const shouldCut = status === STATUSES.REFUNDED || status === STATUSES.DENIED;

  const isPositive =
    status === STATUSES.CAPTURED || status === STATUSES.COMPLETED || status === STATUSES.APPROVED;

  const paidEnd = isPositive ? periodEndFor(plan, now) : now;

  // ✅ Patch : si événement positif => on “réactive” et on nettoie cancelledAt
  const shouldClearCancellation = isPositive && !shouldCut;

  await prisma.subscription.upsert({
    where: { paypalId: orderId },
    create: {
      userId: user.id,
      paypalId: orderId,
      plan,
      status,
      currentPeriodEnd: shouldCut ? now : paidEnd,
      cancelAtPeriodEnd: shouldCut ? true : false,
      ...(shouldCut ? { cancelledAt: now } : {}),
      ...(shouldClearCancellation ? { cancelledAt: null } : {}),
    },
    update: {
      userId: user.id,
      plan,
      status,
      currentPeriodEnd: shouldCut ? now : paidEnd,
      cancelAtPeriodEnd: shouldCut ? true : false,
      ...(shouldCut ? { cancelledAt: now } : {}),
      ...(shouldClearCancellation ? { cancelledAt: null } : {}),
    },
  });

  // 6) Device authorize (si deviceId présent) — seulement si pas de cut
  if (deviceId && !shouldCut) {
    const existingCount = await prisma.device.count({ where: { userId: user.id } });
    const isFounder = existingCount === 0;

    await prisma.device.upsert({
      where: { userId_deviceId: { userId: user.id, deviceId } },
      create: {
        userId: user.id,
        deviceId,
        authorized: true,
        revokedAt: null,
        lastSeenAt: now,
        firstAuthorizedAt: now,
        isFounder,
      },
      update: {
        authorized: true,
        revokedAt: null,
        lastSeenAt: now,
      },
    });
  }
}

/**
 * Évalue l’accès à partir d’une subscription (pure function)
 * Règle:
 * - denied/refunded => non
 * - cancelledAt posé => non (désactivation humaine immédiate)
 * - currentPeriodEnd > now => oui
 */
export function hasPaidAccessFromSub(
  sub:
    | {
        status?: string | null;
        currentPeriodEnd?: Date | null;
        cancelledAt?: Date | null;
      }
    | null
): boolean {
  if (!sub?.currentPeriodEnd) return false;

  const st = String(sub.status || "").toUpperCase();
  if (st === STATUSES.REFUNDED || st === STATUSES.DENIED) return false;

  // Désactivation volontaire => coupe immédiate (même si date future)
  if (sub.cancelledAt) return false;

  return sub.currentPeriodEnd > new Date();
}

/**
 * Accès payé : TRUE si currentPeriodEnd > now
 * et non coupé par REFUNDED/DENIED/CANCELLED (cancelledAt)
 *
 * Micro-optimisation:
 * - si tu as déjà chargé la dernière subscription (route status), passe-la ici -> 0 requête DB.
 */
export async function userHasPaidAccess(
  phoneE164: string,
  preloadedSub?: { status: string | null; currentPeriodEnd: Date | null; cancelledAt: Date | null } | null
): Promise<boolean> {
  if (!isE164(phoneE164)) return false;

  if (preloadedSub) {
    return hasPaidAccessFromSub(preloadedSub);
  }

  const sub = await prisma.subscription.findFirst({
    where: { user: { phoneE164 } },
    orderBy: { createdAt: "desc" },
    select: { status: true, currentPeriodEnd: true, cancelledAt: true },
  });

  return hasPaidAccessFromSub(sub);
  }
