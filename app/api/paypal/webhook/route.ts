// app/api/paypal/webhook/route.ts
import { NextResponse } from "next/server";
import { applyWebhookChange } from "@/lib/subscriptions";

export const runtime = "nodejs"; // Node needed for Buffer & PayPal calls
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* --- ENV --- */
const PP_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PP_SECRET = process.env.PAYPAL_SECRET!;
const PP_LIVE = process.env.PAYPAL_LIVE === "1";
const PP_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!;
const BASE = PP_LIVE ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";

/* --- Helpers --- */
async function getAccessToken() {
  const resp = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${PP_CLIENT_ID}:${PP_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!resp.ok) throw new Error("PAYPAL_TOKEN_FAIL");
  const j = await resp.json();
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

  let bodyJson: any;
  try {
    bodyJson = JSON.parse(rawBody);
  } catch {
    return false;
  }

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
  const j = await resp.json();
  return j.verification_status === "SUCCESS";
}

function safeJsonParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // 1) RAW body for signature verification
    const raw = await req.text();

    // 2) Verify PayPal signature
    const ok = await verifySignature(raw, req.headers);
    if (!ok) {
      console.warn("[PP WEBHOOK] invalid signature");
      // 400 → rejected; PayPal will retry
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // 3) Parse event
    const evt = safeJsonParse(raw);
    if (!evt) {
      console.warn("[PP WEBHOOK] invalid JSON body");
      return new NextResponse("OK", { status: 200 });
    }

    const eventType = evt?.event_type as string | undefined;
    const resource = evt?.resource;

    if (!eventType || !resource) {
      console.warn("[PP WEBHOOK] missing event_type/resource", evt);
      return new NextResponse("OK", { status: 200 });
    }

    // 4) Dispatch (Orders v2 + Captures)
    switch (eventType) {
      // User approved the order (resource.id = orderId)
      case "CHECKOUT.ORDER.APPROVED":
      // Some flows may also send ORDER.COMPLETED
      case "CHECKOUT.ORDER.COMPLETED":
      // Money captured (resource is capture; orderId is usually in supplementary_data.related_ids.order_id)
      case "PAYMENT.CAPTURE.COMPLETED":
      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REFUNDED":
        await applyWebhookChange({ event_type: eventType, resource });
        break;

      default:
        // ignore quietly
        break;
    }

    // 5) ACK
    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error("PP_WEBHOOK_ERR", e);
    // Return 200 to avoid infinite retries if a temporary bug happens; logs will tell us.
    return new NextResponse("OK", { status: 200 });
  }
    }
