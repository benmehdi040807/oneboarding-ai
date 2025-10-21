// app/api/pay/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PLAN_IDS, ppAccessToken, PP_BASE } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PlanKind = "subscription" | "one-month";
type Body = { kind?: PlanKind; phone?: string };
type Ok = { ok: true; approvalUrl: string };
type Err = { ok: false; error: string; raw?: unknown; debugId?: string };

function baseUrl(): string {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "https://oneboardingai.com";
  return b.endsWith("/") ? b.slice(0, -1) : b;
}

function isE164(p?: string): p is string {
  return typeof p === "string" && p.startsWith("+") && p.length >= 6;
}

/**
 * Body: { kind: "subscription" | "one-month", phone: string }
 * Rsp : { ok: true, approvalUrl: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { kind, phone } = (await req.json().catch(() => ({}))) as Body;

    if (kind !== "subscription" && kind !== "one-month") {
      return NextResponse.json<Err>({ ok: false, error: "BAD_KIND" }, { status: 400 });
    }
    if (!isE164(phone)) {
      return NextResponse.json<Err>({ ok: false, error: "BAD_PHONE" }, { status: 400 });
    }

    // UI -> PayPal plan mapping
    const planKey = kind === "subscription" ? "CONTINU" : "PASS1MOIS";
    const planId = PLAN_IDS[planKey];
    if (!planId) {
      return NextResponse.json<Err>({ ok: false, error: "PLAN_ID_MISSING" }, { status: 500 });
    }

    const token = await ppAccessToken();

    const B = baseUrl();
    // ⇩⇩ on passe par nos handlers (link DB puis redirige UX)
    const returnUrl = `${B}/api/pay/return`;
    const cancelUrl = `${B}/api/pay/cancel`;

    // https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_create
    const ppBase = PP_BASE.replace(/\/$/, "");
    const createRes = await fetch(`${ppBase}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // idempotency légère pour éviter les doublons en cas de retry réseau
        "PayPal-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        // souvent utile pour obtenir l’objet complet dès la création
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        plan_id: planId,
        // on met notre identifiant utilisateur ici pour le récupérer sur /return et via webhook
        custom_id: phone,
        application_context: {
          brand_name: "OneBoarding AI",
          user_action: "SUBSCRIBE_NOW",
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
        `PayPal create subscription failed (HTTP ${createRes.status})`;
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
