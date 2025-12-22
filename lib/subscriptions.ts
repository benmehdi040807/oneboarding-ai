// lib/subscriptions.ts (Orders v2 only)

import { prisma } from "@/lib/db";
import { ppAccessToken, PP_BASE } from "@/lib/paypal";

export type Plan = "ONE_DAY" | "ONE_MONTH" | "ONE_YEAR" | "ONE_LIFE";

export type PayStatus =
  | "APPROVED"
  | "COMPLETED"
  | "CAPTURED"
  | "DENIED"
  | "REFUNDED"
  | "UNKNOWN";

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
      return "ONE_DAY";
    case "one-month":
      return "ONE_MONTH";
    case "one-year":
      return "ONE_YEAR";
    case "one-life":
      return "ONE_LIFE";
    default:
      return "ONE_MONTH"; // fallback “safe”
  }
}

function periodEndFor(plan: Plan, now = new Date()): Date {
  switch (plan) {
    case "ONE_DAY":
      return addDays(now, 1);
    case "ONE_MONTH":
      return addDays(now, 30);
    case "ONE_YEAR":
      return addYears(now, 1);
    case "ONE_LIFE":
      // “Life” = très long droit d’accès souverain
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
export async function applyWebhookChange(evt: {
  event_type: string;
  resource: any;
}): Promise<void> {
  const type = evt?.event_type || "";
  const res = evt?.resource;

  // 1) Determine orderId
  let orderId: string | undefined;

  // Order events
  if (type.startsWith("CHECKOUT.ORDER.")) {
    orderId = res?.id;
  }

  // Capture events
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
  let status: PayStatus = "UNKNOWN";
  if (type === "CHECKOUT.ORDER.APPROVED") status = "APPROVED";
  else if (type === "CHECKOUT.ORDER.COMPLETED") status = "COMPLETED";
  else if (type === "PAYMENT.CAPTURE.COMPLETED") status = "CAPTURED";
  else if (type === "PAYMENT.CAPTURE.DENIED") status = "DENIED";
  else if (type === "PAYMENT.CAPTURE.REFUNDED") status = "REFUNDED";

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
  // - REFUNDED / DENIED => coupe immédiate (marque cancelledAt)
  const shouldCut = status === "REFUNDED" || status === "DENIED";

  // On ne renouvelle l'échéance que si évènement “positif” (paiement réellement confirmé)
  const isPositive = status === "CAPTURED" || status === "COMPLETED";
  const paidEnd = isPositive ? periodEndFor(plan, now) : now;

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
    },
    update: {
      userId: user.id,
      plan,
      status,
      currentPeriodEnd: shouldCut ? now : paidEnd,
      cancelAtPeriodEnd: shouldCut ? true : false,
      ...(shouldCut ? { cancelledAt: now } : {}),
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
        // ne touche pas isFounder
      },
    });
  }
}

/**
 * Accès payé : TRUE si currentPeriodEnd > now
 * et non coupé par REFUNDED/DENIED
 */
export async function userHasPaidAccess(phoneE164: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: { user: { phoneE164 } },
    orderBy: { createdAt: "desc" },
    select: { status: true, currentPeriodEnd: true },
  });

  if (!sub?.currentPeriodEnd) return false;
  if (sub.status === "REFUNDED" || sub.status === "DENIED") return false;

  return sub.currentPeriodEnd > new Date();
}
