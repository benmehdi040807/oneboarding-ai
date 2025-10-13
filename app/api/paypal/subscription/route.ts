// app/api/paypal/subscription/route.ts
import { NextResponse } from "next/server";
import { paypalAccessToken, paypalGetSubscription, PLAN_IDS } from "@/lib/paypal";
import { Store } from "@/lib/store";

type PlanKey = keyof typeof PLAN_IDS; // "CONTINU" | "PASS1MOIS"

export async function POST(req: Request) {
  try {
    const { phoneE164, plan, subscriptionID } = await req.json() as {
      phoneE164: string; plan: PlanKey; subscriptionID: string;
    };

    if (!phoneE164 || !plan || !subscriptionID)
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

    // 1) Verify with PayPal
    const token = await paypalAccessToken();
    const sub = await paypalGetSubscription(subscriptionID, token);

    const status: string = sub?.status;
    if (!["ACTIVE", "APPROVAL_PENDING"].includes(status)) {
      return NextResponse.json({ ok: false, error: "bad_status", status }, { status: 400 });
    }

    const planIdFromPP = sub?.plan_id;
    if (planIdFromPP !== PLAN_IDS[plan]) {
      return NextResponse.json({ ok: false, error: "plan_mismatch" }, { status: 400 });
    }

    const now = new Date();
    const accessStart = now;
    let accessEnd: Date | null;

    if (plan === "CONTINU") {
      const next = sub?.billing_info?.next_billing_time
        ? new Date(sub.billing_info.next_billing_time)
        : new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      accessEnd = next;
    } else {
      accessEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    }

    // 2) Upsert subscription record (dev store)
    const record = {
      userPhone: phoneE164,
      subscriptionId: subscriptionID,
      plan,
      planId: planIdFromPP,
      status,
      accessStart: accessStart.toISOString(),
      accessEnd: accessEnd?.toISOString() ?? null,
      payer: sub?.subscriber,
    };

    const idx = Store.subs.findIndex(s => s.subscriptionId === subscriptionID);
    if (idx >= 0) Store.subs[idx] = record as any;
    else Store.subs.push(record as any);

    // 3) Issue a super-simple dev session token (no JWT yet)
    const sessionToken = Math.random().toString(36).slice(2) + "." + Date.now();
    Store.sessionMap.set(sessionToken, phoneE164);

    const res = NextResponse.json({
      ok: true,
      accessStart: record.accessStart,
      accessEnd: record.accessEnd,
      session: "set-cookie"
    });
    res.cookies.set("ob_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // expire at accessEnd for the PASS, 30j; or 7d for continu (kept short for safety)
      expires: accessEnd ?? new Date(Date.now() + 7 * 24 * 3600 * 1000),
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error" }, { status: 500 });
  }
}
