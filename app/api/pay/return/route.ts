// app/api/pay/return/route.ts (Orders v2 only)
import { NextRequest, NextResponse } from "next/server";
import { ppAccessToken, PP_BASE } from "@/lib/paypal";
import { prisma } from "@/lib/db";
import { PLANS, STATUSES } from "@/lib/subscription-constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Kinds transportés dans custom_id (front -> backend)
type PlanKind = "one-day" | "one-month" | "one-year" | "one-life";

// Status PayPal / système (normalisés)
type SubStatus =
  | typeof STATUSES.APPROVED
  | typeof STATUSES.CAPTURED
  | typeof STATUSES.DENIED
  | typeof STATUSES.REFUNDED
  | typeof STATUSES.UNKNOWN;

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function baseUrl(): string {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "https://oneboardingai.com";
  return b.endsWith("/") ? b.slice(0, -1) : b;
}

function isE164(p?: string): p is string {
  return typeof p === "string" && p.startsWith("+") && p.length >= 6;
}

function isDeviceId(d?: string): d is string {
  return typeof d === "string" && d.trim().length >= 8;
}

function isPlanKind(k?: string): k is PlanKind {
  return k === "one-day" || k === "one-month" || k === "one-year" || k === "one-life";
}

function planFromKind(kind?: string): string {
  const k = isPlanKind(kind) ? kind : "one-month";
  switch (k) {
    case "one-day":
      return PLANS.ONE_DAY;
    case "one-month":
      return PLANS.ONE_MONTH;
    case "one-year":
      return PLANS.ONE_YEAR;
    case "one-life":
      return PLANS.ONE_LIFE;
    default:
      return PLANS.ONE_MONTH;
  }
}

function computePeriodEnd(plan: string, from: Date): Date {
  switch (plan) {
    case PLANS.ONE_DAY:
      return addDays(from, 1);
    case PLANS.ONE_MONTH:
      return addDays(from, 30);
    case PLANS.ONE_YEAR:
      return addDays(from, 365);
    case PLANS.ONE_LIFE:
      return addDays(from, 365 * 100);
    default:
      return addDays(from, 30);
  }
}

async function ppGetOrder(orderId: string) {
  const token = await ppAccessToken();
  const ppBase = PP_BASE.replace(/\/$/, "");
  const res = await fetch(`${ppBase}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: any = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    data,
    debugId: res.headers.get("paypal-debug-id") || undefined,
  };
}

async function ppCaptureOrder(orderId: string) {
  const token = await ppAccessToken();
  const ppBase = PP_BASE.replace(/\/$/, "");
  const res = await fetch(`${ppBase}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  const data: any = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    data,
    debugId: res.headers.get("paypal-debug-id") || undefined,
  };
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
    const phone = (typeof parsed?.p === "string" ? parsed.p : parsed?.phone) as string | undefined;
    const deviceIdRaw = typeof parsed?.d === "string" ? parsed.d : parsed?.deviceId;
    const kind = (typeof parsed?.k === "string" ? parsed.k : parsed?.kind) as string | undefined;

    const consent = typeof parsed?.c === "boolean" ? parsed.c : parsed?.consent === true;

    const deviceId =
      typeof deviceIdRaw === "string" && deviceIdRaw.trim().length >= 8
        ? deviceIdRaw.trim()
        : undefined;

    return { phone, deviceId, kind, consent };
  } catch {
    // ultra-legacy: phone in clear
    if (isE164(rawCustom)) return { phone: rawCustom };
    return {};
  }
}

/**
 * /api/pay/return (Orders v2)
 * - PayPal renvoie ?token=<orderId>
 * - On GET order -> custom_id (p/d/k/c ou legacy)
 * - On CAPTURE order (intent=CAPTURE)
 * - On crée user/subscription/device/session + cookie
 */
export async function GET(req: NextRequest) {
  const B = baseUrl();
  const now = new Date();

  try {
    const url = new URL(req.url);

    const orderId =
      url.searchParams.get("token") ||
      url.searchParams.get("order_id") ||
      url.searchParams.get("checkout_id");

    if (!orderId) {
      return NextResponse.redirect(`${B}/?paid_error=NO_ORDER_ID`, 302);
    }

    // 1) GET order (custom_id + status)
    const ord = await ppGetOrder(orderId);
    if (!ord.ok) {
      return NextResponse.redirect(`${B}/?paid_error=PP_GET_ORDER_${ord.status}`, 302);
    }

    const pu0 = Array.isArray(ord.data?.purchase_units) ? ord.data.purchase_units[0] : undefined;
    const rawCustom: string | undefined = pu0?.custom_id;

    const { phone, deviceId, kind, consent } = parseCustomId(rawCustom);

    const phoneE164 = phone;
    if (!isE164(phoneE164)) {
      return NextResponse.redirect(`${B}/?paid_error=NO_PHONE`, 302);
    }

    // ✅ plan normalisé DB (PLANS.*)
    const plan = planFromKind(kind);

    // 2) CAPTURE
    // - si déjà capturé / déjà complété => on accepte si order.status === COMPLETED
    let finalStatus: SubStatus = STATUSES.APPROVED;

    const cap = await ppCaptureOrder(orderId);

    if (cap.ok) {
      finalStatus = STATUSES.CAPTURED;
    } else {
      const st0 = String(ord.data?.status || "");
      if (st0 === "COMPLETED") {
        finalStatus = STATUSES.CAPTURED;
      } else if (cap.status === 409 || cap.status === 422) {
        const ord2 = await ppGetOrder(orderId);
        const st2 = String(ord2.data?.status || "");
        if (st2 === "COMPLETED") {
          finalStatus = STATUSES.CAPTURED;
        } else {
          return NextResponse.redirect(`${B}/?paid_error=PP_CAPTURE_${cap.status}`, 302);
        }
      } else {
        return NextResponse.redirect(`${B}/?paid_error=PP_CAPTURE_${cap.status}`, 302);
      }
    }

    // 3) USER : create if needed (consentAt only if new user + consent true)
    let user = await prisma.user.findUnique({
      where: { phoneE164 },
      select: { id: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneE164,
          ...(consent === true ? { consentAt: now } : {}),
        },
        select: { id: true },
      });
    }

    const userId = user.id;

    // 4) SUBSCRIPTION : upsert (paypalId = orderId)
    const currentPeriodEnd = computePeriodEnd(plan, now);

    await prisma.subscription.upsert({
      where: { paypalId: orderId },
      create: {
        userId,
        paypalId: orderId,
        plan, // ✅ PLANS.*
        status: finalStatus, // ✅ STATUSES.*
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      update: {
        userId,
        plan,
        status: finalStatus,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    // 5) DEVICE + SESSION
    let sessionId: string | null = null;
    let sessionExpiresAt: Date | null = null;

    if (isDeviceId(deviceId)) {
      const ua = req.headers.get("user-agent") ?? undefined;

      const existingDeviceCount = await prisma.device.count({ where: { userId } });
      const isFounder = existingDeviceCount === 0;

      const deviceRecord = await prisma.device.upsert({
        where: { userId_deviceId: { userId, deviceId } },
        create: {
          userId,
          deviceId,
          label: null,
          platform: null,
          userAgent: ua,
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
          userAgent: ua,
        },
        select: { deviceId: true },
      });

      // Session DB : 30 jours (inchangé)
      const exp = addDays(now, 30);
      const session = await prisma.session.create({
        data: {
          userId,
          deviceId: deviceRecord.deviceId,
          expiresAt: exp,
          revokedAt: null,
        },
        select: { id: true, expiresAt: true },
      });

      sessionId = session.id;
      sessionExpiresAt = session.expiresAt;
    }

    // 6) Redirect + cookie
    const res = NextResponse.redirect(`${B}/?paid=1`, 302);

    if (sessionId && sessionExpiresAt) {
      res.cookies.set("ob_session", sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        expires: sessionExpiresAt,
      });
    }

    return res;
  } catch (e: any) {
    const msg = e?.message || "PAY_RETURN_ERROR";
    return NextResponse.redirect(`${baseUrl()}/?paid_error=${encodeURIComponent(msg)}`, 302);
  }
  }
