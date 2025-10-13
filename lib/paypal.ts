// lib/paypal.ts
const LIVE = process.env.PAYPAL_LIVE === "1";
export const PP_BASE = LIVE ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";

export const PLAN_IDS = {
  CONTINU:   process.env.PP_PLAN_CONTINU   || "P-7GF41509YY620912GNDWF45A", // 5 €/mois
  PASS1MOIS: process.env.PP_PLAN_PASS1MOIS || "P-75W60632650625151NDWUY6Q", // 5 € / 30 jours
} as const;

export async function paypalAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_SECRET!;
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Accept-Language": "en_US",
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });
  if (!res.ok) throw new Error("paypal_token_failed");
  const j = await res.json();
  return j.access_token as string;
}

export async function paypalGetSubscription(subscriptionID: string, bearer: string) {
  const r = await fetch(`${PP_BASE}/v1/billing/subscriptions/${subscriptionID}`, {
    headers: { Authorization: `Bearer ${bearer}` }
  });
  if (!r.ok) throw new Error("paypal_get_subscription_failed");
  return r.json();
    }
