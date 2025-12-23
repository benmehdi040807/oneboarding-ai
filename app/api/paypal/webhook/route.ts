// app/api/paypal/webhook/route.ts
import { NextResponse } from "next/server";
import { applyWebhookChange } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PP_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PP_SECRET = process.env.PAYPAL_SECRET!;
const PP_LIVE = process.env.PAYPAL_LIVE === "1";
const PP_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!;
const BASE = PP_LIVE ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";

function isPaypalCertUrl(u: string) {
  try {
    const url = new URL(u);
    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".paypal.com") || url.hostname.endsWith(".paypalobjects.com"))
    );
  } catch {
    return false;
  }
}

async function getAccessToken() {
  const resp = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${PP_CLIENT_ID}:${PP_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!resp.ok) throw new Error("PAYPAL_TOKEN_FAIL");
  const j = await resp.json();
  return j.access_token as string;
}

async function verifySignature(bodyJson: any, headers: Headers) {
  const transmissionId = headers.get("paypal-transmission-id");
  const timestamp = headers.get("paypal-transmission-time");
  const certUrl = headers.get("paypal-cert-url");
  const authAlgo = headers.get("paypal-auth-algo");
  const transmissionSig = headers.get("paypal-transmission-sig");

  if (!transmissionId || !timestamp || !certUrl || !authAlgo || !transmissionSig) return false;

  // ✅ anti-spoof : on refuse si cert_url n'est pas un domaine PayPal
  if (!isPaypalCertUrl(certUrl)) return false;

  const token = await getAccessToken();

  const resp = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
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

  if (!resp.ok) return false;
  const j = await resp.json().catch(() => ({} as any));
  return j?.verification_status === "SUCCESS";
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();

    let evt: any;
    try {
      evt = JSON.parse(raw);
    } catch {
      // Si PayPal envoie un body inattendu, on répond OK pour éviter retry / bruit
      return new NextResponse("OK", { status: 200 });
    }

    const ok = await verifySignature(evt, req.headers);

    // ✅ stratégie résiliente : pas de retry PayPal / pas de spam
    // -> on log et on répond 200 sans appliquer
    if (!ok) {
      const et = evt?.event_type || "UNKNOWN";
      const id = evt?.id || "NO_ID";
      console.warn("[PP_WEBHOOK] invalid signature", { eventType: et, eventId: id });
      return new NextResponse("OK", { status: 200 });
    }

    const eventType = evt?.event_type as string | undefined;
    const resource = evt?.resource;

    if (!eventType || !resource) return new NextResponse("OK", { status: 200 });

    switch (eventType) {
      case "CHECKOUT.ORDER.APPROVED":
      case "CHECKOUT.ORDER.COMPLETED":
      case "PAYMENT.CAPTURE.COMPLETED":
      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REFUNDED":
        await applyWebhookChange({ event_type: eventType, resource });
        break;
      default:
        break;
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error("PP_WEBHOOK_ERR", e);
    // Résilient : on répond OK pour éviter retry en boucle
    return new NextResponse("OK", { status: 200 });
  }
      }
