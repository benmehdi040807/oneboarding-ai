// app/api/pay/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PLAN_IDS, ppAccessToken, PP_BASE } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function baseUrl() {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "https://oneboardingai.com";
  return b.endsWith("/") ? b.slice(0, -1) : b;
}

/**
 * Body JSON:
 * { kind: "subscription" | "one-month", phone: string }
 *
 * Retour:
 * { ok: true, approvalUrl: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { kind, phone } = await req.json().catch(() => ({}));

    if (kind !== "subscription" && kind !== "one-month") {
      return NextResponse.json({ ok: false, error: "BAD_KIND" }, { status: 400 });
    }
    if (typeof phone !== "string" || !phone.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "BAD_PHONE" }, { status: 400 });
    }

    // Map UI -> PayPal PLAN_IDS keys
    const planKey = kind === "subscription" ? "CONTINU" : "PASS1MOIS";
    const planId = PLAN_IDS[planKey];
    if (!planId) {
      return NextResponse.json({ ok: false, error: "PLAN_ID_MISSING" }, { status: 500 });
    }

    const token = await ppAccessToken();

    const B = baseUrl();
    const returnUrl = `${B}/?paid=1`;
    const cancelUrl = `${B}/?cancel=1`;

    // Création de la souscription
    // https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_create
    const createRes = await fetch(`${PP_BASE.replace(/\/$/, "")}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2)}`, // idempotence
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: phone, // pour le rattacher au webhook
        application_context: {
          brand_name: "OneBoarding AI",
          user_action: "SUBSCRIBE_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
      cache: "no-store",
    });

    const data = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      const msg =
        data?.details?.[0]?.issue ||
        data?.message ||
        `PayPal create subscription failed (HTTP ${createRes.status})`;
      return NextResponse.json({ ok: false, error: msg, raw: data }, { status: 500 });
    }

    const links = Array.isArray(data?.links) ? data.links : [];
    const approve = links.find((l: any) => l?.rel === "approve")?.href;

    if (!approve) {
      return NextResponse.json(
        { ok: false, error: "NO_APPROVAL_URL", raw: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, approvalUrl: approve });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500 }
    );
  }
      }
