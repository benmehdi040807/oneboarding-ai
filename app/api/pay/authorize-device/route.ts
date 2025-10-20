// app/api/pay/authorize-device/route.ts
import { NextResponse } from "next/server";
import { ppAccessToken, PP_BASE } from "@/lib/paypal";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 0;

type ReqBody = {
  phoneE164: string;
  deviceId: string;
  // optional: amount / currency
  amount?: string;
  currency?: string;
  return_url?: string; // where PayPal should redirect after approval
  cancel_url?: string;
};

const AMOUNT = "1.00";
const CURRENCY = "EUR";

async function createOrder(token: string, opts: { amount: string; currency: string; return_url: string; cancel_url: string }) {
  const url = `${PP_BASE.replace?.(/\/$/, "") || PP_BASE}/v2/checkout/orders`;
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
    const j = await res.text().catch(() => "");
    throw new Error(`PP_ORDER_FAIL ${res.status} ${j}`);
  }

  const j = await res.json();
  return j;
}

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json().catch(() => ({} as ReqBody));
    const { phoneE164, deviceId } = body || ({} as ReqBody);

    if (!phoneE164 || !phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "BAD_PHONE" }, { status: 400 });
    }
    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json({ ok: false, error: "BAD_DEVICE_ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phoneE164 } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 404 });
    }

    const amount = body.amount || AMOUNT;
    const currency = body.currency || CURRENCY;

    // Build return/cancel urls (caller should pass real ones; fallback to root)
    const return_url = body.return_url || `${process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.tld"}/?paypal_return=1`;
    const cancel_url = body.cancel_url || `${process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.tld"}/?paypal_cancel=1`;

    const token = await ppAccessToken();

    const order = await createOrder(token, { amount, currency, return_url, cancel_url });

    const approval = (order?.links || []).find((l: any) => l.rel === "approve")?.href;
    const orderId = order?.id;

    if (!approval) {
      return NextResponse.json({ ok: false, error: "NO_APPROVAL_URL", raw: order }, { status: 500 });
    }

    // Store a lightweight intent in DB to link orderId -> device/user so webhook can finalize (optional)
    await prisma.deviceAuthorizationIntent?.create?.({
      // Note: this only works if you added a corresponding model. Instead, we'll create a History row
      // as a durable record tying the order -> user/device. If you prefer a dedicated table, add it.
      data: {
        // This block will fail if model doesn't exist. So as safe default we write to History table
      },
    }).catch(() => null);

    // As safe fallback, create a History record to trace the intent (so you can correlate orderId later)
    try {
      await prisma.history.create({
        data: {
          userId: user.id,
          plan: "DEVICE_AUTH",
          templateId: "paypal_order_intent",
          inputJson: JSON.stringify({ deviceId, orderId }),
          outputText: `paypal_order_intent:${orderId}`,
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true, approvalUrl: approval, orderId });
  } catch (e: any) {
    console.error("PAY_AUTHORIZE_DEVICE_ERR", e);
    return NextResponse.json({ ok: false, error: e?.message || "SERVER_ERROR" }, { status: 500 });
  }
  }
