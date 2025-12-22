// app/api/pay/return/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ppAccessToken, PP_BASE } from "@/lib/paypal";
import { prisma } from "@/lib/db";
import type { PlanType, SubStatus } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function computePeriodEnd(plan: PlanType, from: Date): Date {
  switch (plan) {
    case "one-day":
      return addDays(from, 1);
    case "one-month":
      return addDays(from, 30);
    case "one-year":
      return addDays(from, 365);
    case "one-life":
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
  return { ok: res.ok, status: res.status, data, debugId: res.headers.get("paypal-debug-id") || undefined };
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
  return { ok: res.ok, status: res.status, data, debugId: res.headers.get("paypal-debug-id") || undefined };
}

/**
 * /api/pay/return (Orders v2)
 * - PayPal renvoie ?token=<orderId>
 * - On GET order -> custom_id (phone/deviceId/kind/consent)
 * - On CAPTURE order (intent=CAPTURE)
 * - On crée user/subscription/device/session
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

    // 1) Lire l'order (pour récupérer custom_id)
    const ord = await ppGetOrder(orderId);
    if (!ord.ok) {
      return NextResponse.redirect(`${B}/?paid_error=PP_GET_ORDER_${ord.status}`, 302);
    }

    const pu0 = Array.isArray(ord.data?.purchase_units) ? ord.data.purchase_units[0] : undefined;
    const rawCustom: string | undefined = pu0?.custom_id;

    let phoneFromCustom: string | undefined;
    let deviceIdFromCustom: string | undefined;
    let kindFromCustom: string | undefined;
    let consentFromCustom: boolean | undefined;

    if (rawCustom) {
      try {
        const parsed = JSON.parse(rawCustom);
        phoneFromCustom = parsed?.phone;
        deviceIdFromCustom = parsed?.deviceId;
        kindFromCustom = parsed?.kind;
        consentFromCustom = parsed?.consent === true;
      } catch {
        // legacy: phone seul
        if (isE164(rawCustom)) phoneFromCustom = rawCustom;
      }
    }

    const phoneE164 = phoneFromCustom;
    if (!isE164(phoneE164)) {
      return NextResponse.redirect(`${B}/?paid_error=NO_PHONE`, 302);
    }

    const deviceId =
      deviceIdFromCustom && deviceIdFromCustom.trim().length >= 8
        ? deviceIdFromCustom.trim()
        : undefined;

    const plan: PlanType =
      kindFromCustom === "one-day" || kindFromCustom === "one-month" || kindFromCustom === "one-year" || kindFromCustom === "one-life"
        ? (kindFromCustom as PlanType)
        : "one-month";

    // 2) CAPTURE immédiat (activation instantanée)
    //    - si déjà capturé, PayPal peut renvoyer une erreur -> on retombe sur GET order status
    let finalStatus: SubStatus = "APPROVED";
    const cap = await ppCaptureOrder(orderId);

    if (cap.ok) {
      finalStatus = "CAPTURED";
    } else {
      // Si la capture échoue parce que déjà capturée, on accepte si l'order est COMPLETED
      const status = String(ord.data?.status || "");
      if (status === "COMPLETED") finalStatus = "CAPTURED";
      else if (cap.status === 422 || cap.status === 409) {
        // re-fetch pour confirmer
        const ord2 = await ppGetOrder(orderId);
        const st2 = String(ord2.data?.status || "");
        if (st2 === "COMPLETED") finalStatus = "CAPTURED";
        else return NextResponse.redirect(`${B}/?paid_error=PP_CAPTURE_${cap.status}`, 302);
      } else {
        return NextResponse.redirect(`${B}/?paid_error=PP_CAPTURE_${cap.status}`, 302);
      }
    }

    // 3) USER : create if needed (consentAt only if consent===true and user new)
    let user = await prisma.user.findUnique({
      where: { phoneE164 },
      select: { id: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneE164,
          ...(consentFromCustom === true ? { consentAt: now } : {}),
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
        plan,
        status: finalStatus,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      update: {
        userId,
        plan,
        status: finalStatus,
        currentPeriodEnd, // souverain (durée)
        cancelAtPeriodEnd: false,
      },
    });

    // 5) DEVICE + SESSION (identique à ton flow)
    let sessionId: string | null = null;
    let sessionExpiresAt: Date | null = null;

    if (deviceId) {
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
