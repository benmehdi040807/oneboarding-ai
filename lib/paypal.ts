// lib/paypal.ts

/** =========================
 *  Configuration & constantes
 *  ========================= */
const PP_LIVE   = process.env.PAYPAL_LIVE === "1";
export const PP_BASE = PP_LIVE ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";

const PP_CID    = process.env.PAYPAL_CLIENT_ID!;
const PP_SECRET = process.env.PAYPAL_SECRET!;

/** IDs de plans (priorité à l’ENV, sinon valeurs par défaut sûres) */
export const PLAN_IDS = {
  CONTINU:   process.env.PP_PLAN_CONTINU   || "P-7GF41509YY620912GNDWF4SA", // 5 €/mois (reconduit)
  PASS1MOIS: process.env.PP_PLAN_PASS1MOIS || "P-75W60632650625151NDWUY6Q", // 5 € / 30 jours (non reconduit)
} as const;

export type PlanKey = keyof typeof PLAN_IDS;

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
 *  Récupération d’une souscription PayPal
 *  ========================= */
export async function ppGetSubscription(subId: string): Promise<any> {
  const token = await ppAccessToken();
  const r = await fetch(`${PP_BASE}/v1/billing/subscriptions/${subId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error("PP_SUB_FETCH");
  return r.json();
}

/** =========================
 *  Utilitaires d’interprétation
 *  ========================= */

/** Mappe le statut PayPal → notre enum SubStatus (texte) */
export function mapPPStatus(status?: string):
  | "APPROVAL_PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED"
  | "UNKNOWN" {
  switch ((status || "").toUpperCase()) {
    case "APPROVAL_PENDING":
      return "APPROVAL_PENDING";
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

/** Extrait une date d’échéance exploitable pour notre DB */
export function extractPeriodEndFromPP(ppSub: any, plan: PlanKey): Date | null {
  // Cas le plus fréquent : PayPal fournit la prochaine date de facturation
  const next = ppSub?.billing_info?.next_billing_time;
  if (next) return new Date(next);

  // Cas Pass 1 mois non reconduit : on approxime (start_time + 30 jours)
  const start = ppSub?.start_time;
  if (plan === "PASS1MOIS" && start) {
    const d = new Date(start);
    d.setDate(d.getDate() + 30);
    return d;
  }
  return null;
}

/** Raccourci pour détecter un “accès payant actif” côté front/back si besoin */
export function isPaidStatus(s?: string | null): boolean {
  return s?.toUpperCase() === "ACTIVE";
}

/** =========================
 *  Compat ascendante (anciens noms)
 *  ========================= */

// Ancien nom: paypalAccessToken()
export const paypalAccessToken = ppAccessToken;

// Ancien nom: paypalGetSubscription(subscriptionID, bearer?)
export async function paypalGetSubscription(subscriptionID: string, bearer?: string): Promise<any> {
  const token = bearer || (await ppAccessToken());
  const r = await fetch(`${PP_BASE}/v1/billing/subscriptions/${subscriptionID}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error("paypal_get_subscription_failed");
  return r.json();
}
