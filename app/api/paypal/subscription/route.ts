// app/api/paypal/subscription/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import {
  ppGetSubscription,
  PLAN_IDS,
  extractPeriodEndFromPP,
  mapPPStatus,
  type PlanKey,
} from "@/lib/paypal";

/** Signe une payload simple (JWT HS256 minimal) pour le cookie de session */
function signSession(payload: object) {
  const secret = process.env.DEV_OTP_SECRET || "dev_secret";
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export async function POST(req: Request) {
  try {
    const { phoneE164, plan, subscriptionID } = await req.json();

    // 0) Validation d'entrée
    if (!phoneE164 || !plan || !subscriptionID) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }
    const planKey = String(plan).toUpperCase() as PlanKey;
    if (!PLAN_IDS[planKey]) {
      return NextResponse.json({ ok: false, error: "PLAN_UNKNOWN" }, { status: 400 });
    }

    // 1) Récupérer la souscription chez PayPal
    const ppSub = await ppGetSubscription(subscriptionID);
    // ppSub.status: APPROVAL_PENDING | ACTIVE | SUSPENDED | CANCELLED | EXPIRED | ...
    const status = mapPPStatus(ppSub?.status);
    const ppPlanId: string | undefined = ppSub?.plan_id;

    // 2) Contrôles minimaux : plan attendu + statut acceptable
    const expectedPlanId = PLAN_IDS[planKey];
    if (!ppPlanId || ppPlanId !== expectedPlanId) {
      return NextResponse.json(
        { ok: false, error: "PLAN_MISMATCH", got: ppPlanId, expected: expectedPlanId },
        { status: 400 }
      );
    }
    // On accepte ACTIVE (classique) et APPROVAL_PENDING (très court délai possible).
    if (!["ACTIVE", "APPROVAL_PENDING"].includes(status)) {
      return NextResponse.json({ ok: false, error: "NOT_ACTIVE", status }, { status: 400 });
    }

    // 3) Déterminer l’échéance (utile pour limiter la session côté cookie)
    const periodEnd = extractPeriodEndFromPP(ppSub, planKey); // Date | null

    // 4) Ouvrir la session (cookie httpOnly signé)
    // - Par défaut, 180 jours.
    // - Si on a une échéance (notamment PASS1MOIS), on borne par l’échéance.
    const now = Math.floor(Date.now() / 1000);
    const defaultExp = now + 60 * 60 * 24 * 180; // 180 jours
    const expFromPP = periodEnd ? Math.floor(periodEnd.getTime() / 1000) : null;
    const cookieExp = expFromPP ? Math.min(defaultExp, expFromPP) : defaultExp;

    const session = signSession({
      sub: phoneE164,
      plan: planKey,               // "CONTINU" | "PASS1MOIS"
      subscriptionID,
      status,                      // "ACTIVE" | "APPROVAL_PENDING" | ...
      periodEnd: expFromPP || null,
      iat: now,
      exp: cookieExp,
    });

    cookies().set("ob_session", session, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: cookieExp - now, // en secondes
    });

    // 5) (Optionnel) Persistence DB (Prisma) :
    //    Ici volontairement omise pour ne pas casser le build si Prisma n'est pas prêt.
    //    Tu pourras brancher une écriture User/Subscription plus tard.

    return NextResponse.json({ ok: true, status, periodEnd: periodEnd?.toISOString() || null });
  } catch (e) {
    console.error("PP_SUBSCRIBE_ERR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
