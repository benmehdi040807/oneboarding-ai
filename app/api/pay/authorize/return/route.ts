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
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.details?.[0]?.issue ||
      data?.message ||
      `PP_CAPTURE_FAIL_${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function GET(req: NextRequest) {
  const B = baseUrl();
  try {
    const url = new URL(req.url);
    // PayPal renvoie généralement ?token=<ORDER_ID> pour Orders v2
    const orderId =
      url.searchParams.get("token") ||
      url.searchParams.get("order_id") ||
      url.searchParams.get("ba_token");

    if (!orderId) {
      return NextResponse.redirect(`${B}/?device_error=NO_ORDER_ID`, 302);
    }

    // 1) Capture l’ordre
    const capture = await captureOrder(orderId);

    // id de capture (si dispo)
    let payref: string | undefined;
    try {
      payref =
        capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
        capture?.id ||
        undefined;
    } catch {}

    // 2) Retrouve l’intent initial pour récupérer user/device
    const intent = await prisma.deviceOrderIntent.findUnique({
      where: { orderId },
      include: { user: true },
    });

    // Marque comme CAPTURED si possible (sans bloquer en cas d’échec)
    await prisma.deviceOrderIntent
      .update({
        where: { orderId },
        data: { status: "CAPTURED" },
      })
      .catch(() => {});

    const phoneE164 = intent?.user?.phoneE164 || "";
    const deviceId = intent?.deviceId || "";

    // 3) Redirige → flags propres pour AuthorizeReturnBridge (et cookie court)
    const redirectUrl = new URL(B);
    redirectUrl.searchParams.set("device_authorized", "1");
    if (phoneE164) redirectUrl.searchParams.set("phone", phoneE164);
    if (deviceId) redirectUrl.searchParams.set("device", deviceId);
    if (payref) redirectUrl.searchParams.set("payref", payref);

    const res = NextResponse.redirect(redirectUrl.toString(), 302);
    // Cookie “ok” (fallback pour bridge), courte durée
    res.cookies.set("ob.deviceAuth", "ok", {
      path: "/",
      httpOnly: false,    // lisible côté client (bridge)
      sameSite: "lax",
      secure: true,
      maxAge: 60,         // 1 minute suffit
    });
    return res;
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message || "AUTHORIZE_RETURN_ERROR");
    return NextResponse.redirect(`${B}/?device_error=${msg}`, 302);
  }
  }
