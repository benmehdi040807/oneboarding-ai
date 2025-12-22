// lib/paypal.ts

/** =========================
 *  Configuration & constantes
 *  ========================= */
const PP_LIVE = process.env.PAYPAL_LIVE === "1";

export const PP_BASE = PP_LIVE
  ? "https://api.paypal.com"
  : "https://api.sandbox.paypal.com";

const PP_CID = process.env.PAYPAL_CLIENT_ID!;
const PP_SECRET = process.env.PAYPAL_SECRET!;

if (!PP_CID || !PP_SECRET) {
  throw new Error("PayPal credentials missing (PAYPAL_CLIENT_ID / PAYPAL_SECRET).");
}

/** =========================
 *  OAuth: Access Token
 *  ========================= */
export async function ppAccessToken(): Promise<string> {
  const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${PP_CID}:${PP_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "Accept-Language": "en_US",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) throw new Error("PP_TOKEN");
  const j = await res.json();
  return j.access_token as string;
}

/** =========================
 *  Orders v2 (Checkout)
 *  ========================= */

/**
 * Récupère un order (v2/checkout/orders/{id})
 * Utile pour:
 * - lire purchase_units[0].custom_id
 * - lire status (CREATED / APPROVED / COMPLETED)
 */
export async function ppGetOrder(orderId: string): Promise<any> {
  const token = await ppAccessToken();
  const r = await fetch(`${PP_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error("PP_ORDER_FETCH");
  return r.json();
}

/**
 * Capture un order (v2/checkout/orders/{id}/capture)
 * - idempotency via PayPal-Request-Id
 */
export async function ppCaptureOrder(orderId: string): Promise<any> {
  const token = await ppAccessToken();
  const r = await fetch(`${PP_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  if (!r.ok) throw new Error("PP_ORDER_CAPTURE");
  return r.json();
}

/**
 * (Optionnel) Refund d’un CAPTURE (v2/payments/captures/{capture_id}/refund)
 * - utile si un jour tu gères une réclamation manuellement
 * - sinon tu peux ignorer cette fonction
 */
export async function ppRefundCapture(opts: {
  captureId: string;
  amount?: { value: string; currency_code: "EUR" | "USD" };
  note?: string;
}): Promise<any> {
  const { captureId, amount, note } = opts;
  const token = await ppAccessToken();

  const body: any = {};
  if (amount) body.amount = amount;
  if (note) body.note_to_payer = note;

  const r = await fetch(`${PP_BASE}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!r.ok) throw new Error("PP_CAPTURE_REFUND");
  return r.json();
}

/** =========================
 *  Helpers métier (Orders)
 *  ========================= */

export function isOrderCompleted(status?: string | null): boolean {
  return String(status || "").toUpperCase() === "COMPLETED";
}

/**
 * Tente d’extraire un captureId depuis une réponse de capture order.
 * Selon PayPal, on le trouve dans:
 * purchase_units[0].payments.captures[0].id
 */
export function extractCaptureIdFromCaptureResponse(data: any): string | null {
  const pu0 = Array.isArray(data?.purchase_units) ? data.purchase_units[0] : undefined;
  const caps = pu0?.payments?.captures;
  const cap0 = Array.isArray(caps) ? caps[0] : undefined;
  const id = cap0?.id;
  return typeof id === "string" && id.length > 5 ? id : null;
}

/** =========================
 *  Compat ascendante (anciens noms)
 *  ========================= */
export const paypalAccessToken = ppAccessToken;

/** =========================
 *  LEGACY (Subscriptions v1) — gardé au cas où
 *  =========================
 * Si tu es 100% sûr d’avoir abandonné les subscriptions v1,
 * tu peux supprimer ce bloc entièrement.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export async function ppGetSubscription(subId: string): Promise<any> {
  const token = await ppAccessToken();
  const r = await fetch(`${PP_BASE}/v1/billing/subscriptions/${subId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error("PP_SUB_FETCH");
  return r.json();
}

export function mapPPStatus(
  status?: string
):
  | "APPROVAL_PENDING"
  | "APPROVED"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED"
  | "UNKNOWN" {
  switch ((status || "").toUpperCase()) {
    case "APPROVAL_PENDING":
      return "APPROVAL_PENDING";
    case "APPROVED":
      return "APPROVED";
    case "ACTIVE":
      return "ACTIVE";
    case "SUSPENDED":
      return "SUSPENDED";
    case "CANCELLED":
      return "CANCELLED";
    case "EXPIRED":
      return "EXPIRED";
    default:
      return "UNKNOWN";
  }
}

export type PlanTypeLegacy = "CONTINU" | "PASS1MOIS";

export function extractPeriodEndFromPP(ppSub: any, plan: PlanTypeLegacy): Date | null {
  const next = ppSub?.billing_info?.next_billing_time;
  if (next) return new Date(next);

  const start = ppSub?.start_time;
  if (plan === "PASS1MOIS" && start) {
    const d = new Date(start);
    d.setDate(d.getDate() + 30);
    return d;
  }
  return null;
}

export async function cancelSubscriptionInPaypal(
  paypalId: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!paypalId) return { ok: false, error: "NO_PAYPAL_ID" };

  try {
    const token = await ppAccessToken();
    const body = {
      reason:
        "User requested deactivation of the OneBoarding AI space. Relationship ended at user's explicit will.",
    };

    const res = await fetch(`${PP_BASE}/v1/billing/subscriptions/${paypalId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (res.ok) return { ok: true, status: res.status };

    let errText = "";
    try {
      errText = await res.text();
    } catch {
      errText = `HTTP_${res.status}`;
    }

    return { ok: false, status: res.status, error: errText };
  } catch (e: any) {
    return { ok: false, error: e?.message || "PP_CANCEL_ERR" };
  }
}

export const paypalCancelSubscription = cancelSubscriptionInPaypal;
/* eslint-enable @typescript-eslint/no-unused-vars */
