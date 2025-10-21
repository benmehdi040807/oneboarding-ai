// app/api/pay/authorize/return/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ppAccessToken, PP_BASE } from "@/lib/paypal";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function baseUrl() {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "https://oneboardingai.com";
  return b.endsWith("/") ? b.slice(0, -1) : b;
}

async function captureOrder(orderId: string) {
  const token = await ppAccessToken();
  const url = `${PP_BASE.replace(/\/$/, "")}/v2/checkout/orders/${orderId}/capture`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Idempotency (soft) pour éviter double-capture si back/refresh
      "PayPal-Request-Id": `cap-${orderId}`,
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data?.details && data.details[0]?.issue) ||
      data?.message ||
      `PP_CAPTURE_FAIL_${res.status}`;
    throw Object.assign(new Error(msg), { data });
  }
  return data;
}

/**
 * Retour PayPal pour l'autorisation "1 €" (Orders v2)
 * PayPal renvoie typiquement ?token=<orderId>
 */
export async function GET(req: NextRequest) {
  const B = baseUrl();

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("token") || url.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.redirect(`${B}/?device_error=NO_ORDER_ID`, 302);
    }

    // 1) Retrouver l'intent local (pour deviceId & userId)
    const intent = await prisma.deviceOrderIntent.findFirst({
      where: { orderId },
      select: { id: true, userId: true, deviceId: true, status: true },
    });

    if (!intent) {
      return NextResponse.redirect(`${B}/?device_error=INTENT_NOT_FOUND`, 302);
    }

    // 2) Capturer l'ordre PayPal
    const cap = await captureOrder(orderId);

    // 3) Vérifier statut
    const purchaseUnits = Array.isArray(cap?.purchase_units) ? cap.purchase_units : [];
    const payments = purchaseUnits[0]?.payments;
    const captures = Array.isArray(payments?.captures) ? payments.captures : [];
    const capture = captures[0];
    const capStatus: string = (capture?.status as string) || (cap?.status as string) || "";
    const ok = (capStatus || "").toUpperCase() === "COMPLETED";

    // 4) Informations utiles
    const paymentRef: string | undefined = capture?.id || cap?.id;
    const deviceId = intent.deviceId || undefined;

    // Récup phone pour le bridge UI
    const user = await prisma.user.findUnique({
      where: { id: intent.userId },
      select: { phoneE164: true },
    });
    const phoneE164 = user?.phoneE164 || "";

    // 5) Mise à jour base (journalisation)
    await prisma.deviceOrderIntent.update({
      where: { id: intent.id },
      data: {
        status: ok ? "CAPTURED" : "FAILED",
        paymentRef: paymentRef || null,
        capturedAt: ok ? new Date() : null,
        payload: cap ? JSON.stringify(cap) : undefined,
      },
    }).catch(() => { /* ne bloque pas le flux UX */ });

    // 6) Redirect UX → page d’accueil avec flags propres
    if (ok) {
      const u = new URL(B);
      u.searchParams.set("device_authorized", "1");
      if (phoneE164) u.searchParams.set("phone", phoneE164);
      if (deviceId) u.searchParams.set("device", deviceId);
      if (paymentRef) u.searchParams.set("payref", paymentRef);
      return NextResponse.redirect(u.toString(), 302);
    } else {
      return NextResponse.redirect(`${B}/?device_error=CAPTURE_NOT_COMPLETED`, 302);
    }
  } catch (e: any) {
    return NextResponse.redirect(
      `${B}/?device_error=${encodeURIComponent(e?.message || "AUTHORIZE_RETURN_ERROR")}`,
      302
    );
  }
}
