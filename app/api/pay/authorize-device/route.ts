// app/api/pay/authorize-device/route.ts
"use server";

import { NextResponse } from "next/server";
import { ppAccessToken, PP_BASE } from "@/lib/paypal";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReqBody = {
  phoneE164?: string;
  deviceId?: string;
  amount?: string;        // optionnel (défaut 1.00)
  currency?: string;      // optionnel (défaut EUR)
  return_url?: string;    // (ignoré si non fourni : on force notre /api/pay/authorize/return)
  cancel_url?: string;    // idem
  revokeOldest?: boolean; // flag passé à la route de return
};

type Ok  = { ok: true; approvalUrl: string; orderId: string };
type Err = { ok: false; error: string; raw?: unknown; debugId?: string };

const DEFAULT_AMOUNT   = "1.00";
const DEFAULT_CURRENCY = "EUR";

function sanitizeAmount(a?: string) {
  if (!a) return DEFAULT_AMOUNT;
  const m = a.match(/^\d+(\.\d{1,2})?$/);
  return m ? a : DEFAULT_AMOUNT;
}

function baseUrl() {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "https://oneboardingai.com";
  return b.endsWith("/") ? b.slice(0, -1) : b;
}

async function createOrder(
  token: string,
  opts: { amount: string; currency: string; return_url: string; cancel_url: string; custom_id: string }
): Promise<{ data: any; debugId?: string }> {
  const url = `${PP_BASE.replace(/\/$/, "")}/v2/checkout/orders`;

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: opts.currency,
          value: opts.amount,
        },
        description: "Autorisation appareil OneBoarding AI",
        // Utile pour retrouver phone/device côté PayPal (logs, dashboard)
        custom_id: opts.custom_id,
      },
    ],
    application_context: {
      brand_name: "OneBoarding AI",
      user_action: "PAY_NOW",
      return_url: opts.return_url,
      cancel_url: opts.cancel_url,
      shipping_preference: "NO_SHIPPING",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      // Idempotence légère pour éviter des doublons sur retry réseau
      "PayPal-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const debugId = res.headers.get("paypal-debug-id") || undefined;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      (data?.details && data.details[0]?.issue) ||
      data?.message ||
      `PP_ORDER_FAIL ${res.status}`;
    const err: any = new Error(msg);
    err.debugId = debugId;
    err.raw = data;
    throw err;
  }

  return { data, debugId };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ReqBody;

    const phoneE164 = body.phoneE164;
    const deviceId  = body.deviceId;

    if (typeof phoneE164 !== "string" || !phoneE164.startsWith("+")) {
      return NextResponse.json<Err>({ ok: false, error: "BAD_PHONE" }, { status: 400 });
    }
    if (typeof deviceId !== "string" || !deviceId.trim()) {
      return NextResponse.json<Err>({ ok: false, error: "BAD_DEVICE_ID" }, { status: 400 });
    }

    // 1) Vérifier que l'utilisateur existe (membre)
    const user = await prisma.user.findUnique({ where: { phoneE164 }, select: { id: true } });
    if (!user) {
      return NextResponse.json<Err>({ ok: false, error: "NO_USER" }, { status: 404 });
    }

    // 2) Préparer order PayPal (1 € par défaut)
    const amount   = sanitizeAmount(body.amount);
    const currency = (body.currency || DEFAULT_CURRENCY).toUpperCase();

    const B = baseUrl();

    // On passe TOUJOURS par notre handler de retour (capture + redirection propre lue par AuthorizeReturnBridge)
    const return_url =
      body.return_url ||
      `${B}/api/pay/authorize/return?phone=${encodeURIComponent(phoneE164)}&device=${encodeURIComponent(deviceId)}&revoke=${body.revokeOldest ? "1" : "0"}`;

    const cancel_url =
      body.cancel_url ||
      `${B}/?device_error=cancelled`;

    const token = await ppAccessToken();
    const { data: order, debugId } = await createOrder(token, {
      amount,
      currency,
      return_url,
      cancel_url,
      custom_id: `${phoneE164}::${deviceId}`,
    });

    const approvalUrl: string | undefined = Array.isArray(order?.links)
      ? order.links.find((l: any) => l?.rel === "approve")?.href
      : undefined;
    const orderId: string | undefined = order?.id;

    if (!approvalUrl || !orderId) {
      return NextResponse.json<Err>(
        { ok: false, error: "NO_APPROVAL_URL", raw: order, debugId },
        { status: 500 }
      );
    }

    // 3) Journaliser l’intent pour suivi / webhook (best effort)
    await prisma.deviceOrderIntent.create({
      data: {
        userId: user.id,
        deviceId,
        orderId,
        amount,
        currency,
        status: "CREATED",
        payload: JSON.stringify({ return_url, cancel_url }),
      },
    }).catch(() => { /* ne bloque pas le flux */ });

    return NextResponse.json<Ok>({ ok: true, approvalUrl, orderId });
  } catch (e: any) {
    console.error("PAY_AUTHORIZE_DEVICE_ERR", e);
    return NextResponse.json<Err>(
      { ok: false, error: e?.message || "SERVER_ERROR", raw: e?.raw, debugId: e?.debugId },
      { status: 500 }
    );
  }
}
