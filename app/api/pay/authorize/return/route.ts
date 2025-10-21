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

function maxDevices(): number {
  const n = Number(process.env.NEXT_PUBLIC_MAX_DEVICES ?? 3);
  return Number.isFinite(n) && n > 0 ? n : 3;
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
    const err: any = new Error(msg);
    err.raw = data;
    throw err;
  }
  return data;
}

/** Essaie d'extraire phone/device depuis la réponse PayPal (fallback si on n'a pas trouvé l'intent DB). */
function extractPhoneDeviceFromPP(capture: any): { phone?: string; device?: string } {
  try {
    const pu = capture?.purchase_units?.[0];
    // On avait mis custom_id = `${phone}::${device}` à la création
    const cid: string | undefined =
      pu?.payments?.captures?.[0]?.custom_id ??
      pu?.custom_id ??
      undefined;
    if (cid && cid.includes("::")) {
      const [phone, device] = cid.split("::");
      if (phone?.startsWith("+") && device) return { phone, device };
    }
  } catch {}
  return {};
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

    // Indication éventuelle depuis la création d'ordre
    const revokeFlag = url.searchParams.get("revoke") === "1";

    // 1) Capture l’ordre (source of truth)
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
    //    (c'est la voie normale). Sinon fallback via custom_id PayPal.
    const intent = await prisma.deviceOrderIntent.findUnique({
      where: { orderId },
      include: { user: true },
    });

    // Best-effort: marque comme CAPTURED
    prisma.deviceOrderIntent
      .update({ where: { orderId }, data: { status: "CAPTURED", completedAt: new Date() } })
      .catch(() => { /* noop */ });

    let phoneE164 = intent?.user?.phoneE164 || "";
    let deviceId = intent?.deviceId || "";

    if (!phoneE164 || !deviceId) {
      const fromPP = extractPhoneDeviceFromPP(capture);
      phoneE164 = phoneE164 || fromPP.phone || "";
      deviceId  = deviceId  || fromPP.device || "";
    }

    if (!phoneE164 || !phoneE164.startsWith("+") || !deviceId) {
      // On n'a pas assez d'info pour attacher l'appareil
      const msg = encodeURIComponent("MISSING_PHONE_OR_DEVICE");
      return NextResponse.redirect(`${B}/?device_error=${msg}`, 302);
    }

    // 3) Enregistrer/activer l'appareil en base
    const user = await prisma.user.findUnique({ where: { phoneE164 }, select: { id: true } });

    if (user) {
      // a) Upsert de l'appareil courant -> authorized:true
      await prisma.device.upsert({
        where: { userId_deviceId: { userId: user.id, deviceId } },
        update: { authorized: true, revokedAt: null, lastSeenAt: new Date() },
        create: {
          userId: user.id,
          deviceId,
          authorized: true,
          lastSeenAt: new Date(),
        },
      });

      // b) Si on nous a demandé de révoquer le plus ancien ET qu'on dépasse la limite → soft revoke
      if (revokeFlag) {
        const max = maxDevices();
        const devices = await prisma.device.findMany({
          where: { userId: user.id, authorized: true },
          orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
          select: { id: true, deviceId: true },
        });
        if (devices.length > max) {
          const candidate = devices.find((d) => d.deviceId !== deviceId) || devices[0];
          if (candidate) {
            await prisma.device.update({
              where: { id: candidate.id },
              data: { authorized: false, revokedAt: new Date() },
            }).catch(() => { /* noop */ });
          }
        }
      }
    }

    // 4) Redirige → flags propres pour AuthorizeReturnBridge (et cookie court)
    const redirectUrl = new URL(B);
    redirectUrl.searchParams.set("device_authorized", "1");
    if (phoneE164) redirectUrl.searchParams.set("phone", phoneE164);
    if (deviceId)  redirectUrl.searchParams.set("device", deviceId);
    if (payref)    redirectUrl.searchParams.set("payref", String(payref));

    const res = NextResponse.redirect(redirectUrl.toString(), 302);

    // Cookie “ok” (fallback pour bridge), courte durée
    res.cookies.set("ob.deviceAuth", "ok", {
      path: "/",
      httpOnly: false, // lisible côté client (bridge)
      sameSite: "lax",
      secure: true,
      maxAge: 60,      // 1 minute suffit
    });

    return res;
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message || "AUTHORIZE_RETURN_ERROR");
    return NextResponse.redirect(`${B}/?device_error=${msg}`, 302);
  }
      }
