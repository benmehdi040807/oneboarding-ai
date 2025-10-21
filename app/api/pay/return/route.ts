// app/api/pay/return/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PLAN_IDS, ppGetSubscription } from "@/lib/paypal";
import { linkSubscriptionToUser, type PlanType } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function baseUrl() {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "https://oneboardingai.com";
  return b.endsWith("/") ? b.slice(0, -1) : b;
}

/**
 * PayPal renvoie généralement:
 *  - `subscription_id` (Subscriptions v1)
 *  - parfois `token` / `ba_token` selon le flow
 *
 * On:
 *  1) refetch la souscription
 *  2) récupère `custom_id` (= phoneE164 qu’on a posé à la création)
 *  3) déduit le plan via `plan_id` -> PLAN_IDS
 *  4) upsert en base (user + subscription)
 *  5) redirige vers /?paid=1 pour UX
 */
export async function GET(req: NextRequest) {
  const B = baseUrl();
  try {
    const url = new URL(req.url);
    const subId =
      url.searchParams.get("subscription_id") ||
      url.searchParams.get("token") ||
      url.searchParams.get("ba_token");

    if (!subId) {
      return NextResponse.redirect(`${B}/?paid_error=NO_SUBSCRIPTION_ID`, 302);
    }

    const pp = await ppGetSubscription(subId);

    // phoneE164 placé dans custom_id à la création
    const phoneE164: string | undefined = pp?.custom_id || pp?.subscriber?.custom_id;
    if (!phoneE164 || !phoneE164.startsWith("+")) {
      return NextResponse.redirect(`${B}/?paid_error=NO_PHONE`, 302);
    }

    // Mapper plan via plan_id
    const planId: string | undefined = pp?.plan_id;
    let plan: PlanType = "CONTINU";
    if (planId && String(planId) === String(PLAN_IDS.PASS1MOIS)) {
      plan = "PASS1MOIS";
    }

    await linkSubscriptionToUser({ phoneE164, plan, paypalSubId: subId });

    return NextResponse.redirect(`${B}/?paid=1`, 302);
  } catch (e: any) {
    return NextResponse.redirect(
      `${baseUrl()}/?paid_error=${encodeURIComponent(e?.message || "PAY_RETURN_ERROR")}`,
      302
    );
  }
}
