// app/api/pay/authorize-device/route.ts
import { NextResponse } from "next/server";
import { ppAccessToken, PP_BASE } from "@/lib/paypal";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReqBody = {
  phoneE164: string;
  deviceId: string;
  amount?: string;           // optionnel (par défaut 1.00)
  currency?: string;         // optionnel (par défaut EUR)
  return_url?: string;       // optionnel: où PayPal doit renvoyer (après approval)
  cancel_url?: string;       // optionnel: où PayPal doit renvoyer (annulation)
};

const DEFAULT_AMOUNT = "1.00";
const DEFAULT_CURRENCY = "EUR";

function sanitizeAmount(a?: string) {
  // Format "X.YY" simple ; si invalide -> défaut
  if (!a) return DEFAULT_AMOUNT;
  const m = a.match(/^\d+(\.\d{1,2})?$/);
  return m ? a : DEFAULT_AMOUNT;
}

function baseUrl() {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "";
  if (!b) return "https://your-domain.tld";
  return b.endsWith("/") ? b.slice(0, -1) : b;
}

async function createOrder(
  token: string,
  opts: { amount: string; currency: string; return_url: string; cancel_url: string }
) {
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
      },
    ],
    application_context: {
      brand_name: "OneBoarding AI",
      user_action: "PAY_NOW",
      return_url: opts.return_url,
      cancel_url: opts.cancel_url,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PP_ORDER_FAIL ${res.status} ${text}`);
  }

  return res.json();
}

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json().catch(() => ({} as ReqBody));
    const { phoneE164, deviceId } = body || ({} as ReqBody);

    if (typeof phoneE164 !== "string" || !phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "BAD_PHONE" }, { status: 400 });
    }
    if (typeof deviceId !== "string" || !deviceId.trim()) {
      return NextResponse.json({ ok: false, error: "BAD_DEVICE_ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phoneE164 } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 404 });
    }

    const amount = sanitizeAmount(body.amount);
    const currency = (body.currency || DEFAULT_CURRENCY).toUpperCase();

    // URLs de retour/annulation
    const B = baseUrl();
    const return_url =
      body.return_url ||
      `${B}/?paypal_return=1&purpose=authorize_device&device=${encodeURIComponent(deviceId)}`;
    const cancel_url =
      body.cancel_url ||
      `${B}/?paypal_cancel=1&purpose=authorize_device&device=${encodeURIComponent(deviceId)}`;

    // Créer l'Order PayPal (CAPTURE)
    const token = await ppAccessToken();
    const order = await createOrder(token, { amount, currency, return_url, cancel_url });

    const approvalUrl =
      (order?.links || []).find((l: any) => l?.rel === "approve")?.href || null;
    const orderId = order?.id as string | undefined;

    if (!approvalUrl || !orderId) {
      return NextResponse.json(
        { ok: false, error: "NO_APPROVAL_URL", raw: order },
        { status: 500 }
      );
    }

    // Journalisation durable (tracabilité) via History
    // Permet au webhook de recoller l’intent (user/device ↔ orderId).
    try {
      await prisma.history.create({
        data: {
          userId: user.id,
          plan: "DEVICE_AUTH",
          templateId: "paypal_order_intent",
          inputJson: JSON.stringify({
            deviceId,
            orderId,
            amount,
            currency,
            createdAt: new Date().toISOString(),
          }),
          outputText: `paypal_order_intent:${orderId}`,
        },
      });
    } catch {
      // Ne bloque pas le flux si l'écriture de log échoue
    }

    return NextResponse.json({ ok: true, approvalUrl, orderId });
  } catch (e: any) {
    console.error("PAY_AUTHORIZE_DEVICE_ERR", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
