import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

/* --------- ENV --------- */
const PP_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PP_SECRET = process.env.PAYPAL_SECRET!;
const PP_LIVE = process.env.PAYPAL_LIVE === "1";
const PP_PLAN_CONTINU = process.env.NEXT_PUBLIC_PP_PLAN_CONTINU!;
const PP_PLAN_PASS1MOIS = process.env.NEXT_PUBLIC_PP_PLAN_PASS1MOIS!;

const BASE = PP_LIVE ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";

/* --------- Helpers --------- */
async function getAccessToken() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${PP_CLIENT_ID}:${PP_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("PAYPAL_TOKEN_FAIL");
  const j = await res.json();
  return j.access_token as string;
}

async function fetchSubscription(id: string, token: string) {
  const res = await fetch(`${BASE}/v1/billing/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("SUBSCRIPTION_LOOKUP_FAIL");
  return res.json();
}

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

    if (!phoneE164 || !plan || !subscriptionID) {
      return NextResponse.json({ ok: false, error: "BAD_INPUT" }, { status: 400 });
    }

    const planMap: Record<string, string> = {
      CONTINU: PP_PLAN_CONTINU,
      PASS1MOIS: PP_PLAN_PASS1MOIS,
    };
    const expectedPlanId = planMap[plan];
    if (!expectedPlanId) {
      return NextResponse.json({ ok: false, error: "PLAN_UNKNOWN" }, { status: 400 });
    }

    // 1) Vérifier la souscription chez PayPal
    const token = await getAccessToken();
    const sub = await fetchSubscription(subscriptionID, token);

    // sub.status: APPROVAL_PENDING | APPROVED | ACTIVE | SUSPENDED | CANCELLED | EXPIRED
    const status: string = sub.status;
    const plan_id: string = sub.plan_id;

    // 2) Contrôles minimaux
    if (plan_id !== expectedPlanId) {
      return NextResponse.json(
        { ok: false, error: "PLAN_MISMATCH", got: plan_id, expected: expectedPlanId },
        { status: 400 }
      );
    }
    if (!["APPROVED", "ACTIVE"].includes(status)) {
      return NextResponse.json({ ok: false, error: "NOT_ACTIVE", status }, { status: 400 });
    }

    // 3) Ouvrir la session (cookie httpOnly signé)
    const expSec = 60 * 60 * 24 * 180; // 180 jours
    const session = signSession({
      sub: phoneE164,
      plan,
      subscriptionID,
      status,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expSec,
    });

    cookies().set("ob_session", session, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: expSec,
    });

    // 4) (optionnel) persiste en base si tu utilises Prisma (non requis ici)

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("PAYPAL_SUB_ERR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
      }
