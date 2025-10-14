import { NextResponse } from "next/server";

/* --- ENV --- */
const PP_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PP_SECRET = process.env.PAYPAL_SECRET!;
const PP_LIVE = process.env.PAYPAL_LIVE === "1";
const PP_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!;
const BASE = PP_LIVE ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";

/* --- Helpers --- */
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

async function verifySignature(rawBody: string, headers: Headers) {
  const transmissionId = headers.get("paypal-transmission-id");
  const timestamp = headers.get("paypal-transmission-time");
  const certUrl = headers.get("paypal-cert-url");
  const authAlgo = headers.get("paypal-auth-algo");
  const transmissionSig = headers.get("paypal-transmission-sig");

  if (!transmissionId || !timestamp || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  const token = await getAccessToken();
  const bodyJson = JSON.parse(rawBody);

  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: timestamp,
      webhook_id: PP_WEBHOOK_ID,
      webhook_event: bodyJson,
    }),
    cache: "no-store",
  });

  if (!res.ok) return false;
  const j = await res.json();
  return j.verification_status === "SUCCESS";
}

export async function POST(req: Request) {
  try {
    // IMPORTANT: on lit le **raw body** pour que la signature soit valide
    const raw = await req.text();
    const ok = await verifySignature(raw, req.headers);

    if (!ok) {
      console.warn("[PP WEBHOOK] signature invalide");
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const evt = JSON.parse(raw);
    const type = evt?.event_type as string | undefined;
    const res = evt?.resource;
    const subId = res?.id || res?.subscription_id;
    const planId = res?.plan_id;
    const status = res?.status;

    // Log minimal (remplace par tes opérations DB au besoin)
    console.log("[PP EVT]", type, { subId, planId, status });

    // TODO: brancher ta persistance (Prisma, etc.)
    // Exemples :
    switch (type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        // Marquer l’abonnement actif pour l’utilisateur lié à subId
        break;
      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
        // Marquer l’abonnement inactif → restreindre l’accès
        break;
      case "PAYMENT.SALE.COMPLETED":
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        // Journaliser / notifier
        break;
      default:
        break;
    }

    // Toujours répondre 200 rapidement (PayPal réessaie sinon)
    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error("PP_WEBHOOK_ERR", e);
    // 200 quand même pour éviter les retries infinis en cas de bug temporaire,
    // mais loggue bien pour corriger.
    return new NextResponse("OK", { status: 200 });
  }
        }
