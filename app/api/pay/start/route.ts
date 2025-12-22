// app/api/pay/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ppAccessToken, PP_BASE } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PlanKind = "one-day" | "one-month" | "one-year" | "one-life";

type Body = {
  kind?: PlanKind;
  phone?: string; // E.164
  deviceId?: string;
  consent?: boolean; // optionnel: true si déjà approuvé côté /legal avant paiement
};

type Ok = { ok: true; approvalUrl: string };
type Err = { ok: false; error: string; raw?: unknown; debugId?: string };

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

function amountFor(kind: PlanKind): { value: string; label: string } {
  switch (kind) {
    case "one-day":
      return { value: "11.00", label: "One Day" };
    case "one-month":
      return { value: "31.00", label: "One Month" };
    case "one-year":
      return { value: "300.00", label: "One Year" };
    case "one-life":
      return { value: "31000.00", label: "One Life" };
    default:
      return { value: "31.00", label: "One Month" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { kind, phone, deviceId, consent } = (await req.json().catch(() => ({}))) as Body;

    if (kind !== "one-day" && kind !== "one-month" && kind !== "one-year" && kind !== "one-life") {
      return NextResponse.json<Err>({ ok: false, error: "BAD_KIND" }, { status: 400 });
    }
    if (!isE164(phone)) {
      return NextResponse.json<Err>({ ok: false, error: "BAD_PHONE" }, { status: 400 });
    }
    if (!isDeviceId(deviceId)) {
      return NextResponse.json<Err>({ ok: false, error: "BAD_DEVICE_ID" }, { status: 400 });
    }

    const token = await ppAccessToken();

    const B = baseUrl();
    const returnUrl = `${B}/api/pay/return`;
    const cancelUrl = `${B}/api/pay/cancel`;

    const { value, label } = amountFor(kind);

    // Payload souverain (contrat)
    // NOTE: PayPal custom_id max ~127 chars -> garder compact.
    // Ici on fait compact mais clair. (Si tu veux plus long -> on passe en base64url.)
    const customPayload = JSON.stringify({
      phone,
      deviceId,
      kind,
      consent: consent === true,
    });

    const ppBase = PP_BASE.replace(/\/$/, "");
    const createRes = await fetch(`${ppBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: "OB",
            custom_id: customPayload,
            description: `OneBoarding AI — ${label}`,
            amount: {
              currency_code: "EUR",
              value,
            },
          },
        ],
        application_context: {
          brand_name: "OneBoarding AI",
          user_action: "PAY_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
      cache: "no-store",
    });

    const debugId = createRes.headers.get("paypal-debug-id") || undefined;
    const data: any = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      const msg =
        data?.details?.[0]?.issue ||
        data?.message ||
        `PayPal create order failed (HTTP ${createRes.status})`;

      return NextResponse.json<Err>({ ok: false, error: msg, raw: data, debugId }, { status: 500 });
    }

    const links: Array<{ rel?: string; href?: string }> = Array.isArray(data?.links) ? data.links : [];
    const approvalUrl = links.find((l) => l?.rel === "approve")?.href;

    if (!approvalUrl) {
      return NextResponse.json<Err>({ ok: false, error: "NO_APPROVAL_URL", raw: data, debugId }, { status: 500 });
    }

    return NextResponse.json<Ok>({ ok: true, approvalUrl });
  } catch (e: any) {
    return NextResponse.json<Err>({ ok: false, error: e?.message || "SERVER_ERROR" }, { status: 500 });
  }
}
