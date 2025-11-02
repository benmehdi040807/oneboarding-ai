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

// IDs de plans (obligatoires). On ne met plus de fallback en dur.
const CONTINU = process.env.PP_PLAN_CONTINU;
const PASS1MOIS = process.env.PP_PLAN_PASS1MOIS;

if (!PP_CID || !PP_SECRET) {
  throw new Error(
    "PayPal credentials missing (PAYPAL_CLIENT_ID / PAYPAL_SECRET)."
  );
}
if (!CONTINU || !PASS1MOIS) {
  throw new Error(
    "Plan IDs missing (PP_PLAN_CONTINU / PP_PLAN_PASS1MOIS)."
  );
}

export const PLAN_IDS = {
  CONTINU,
  PASS1MOIS,
} as const;

export type PlanKey = keyof typeof PLAN_IDS;
// Aligner avec subscriptions.ts (mêmes littéraux)
export type PlanType = "CONTINU" | "PASS1MOIS";

/** =========================
 *  OAuth: Access Token
 *  ========================= */
export async function ppAccessToken(): Promise<string> {
  const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${PP_CID}:${PP_SECRET}`).toString("base64"),
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
export async function ppGetSubscription(
  subId: string
): Promise<any> {
  const token = await ppAccessToken();
  const r = await fetch(
    `${PP_BASE}/v1/billing/subscriptions/${subId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!r.ok) throw new Error("PP_SUB_FETCH");
  return r.json();
}

/** =========================
 *  Utilitaires d’interprétation
 *  ========================= */
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

/**
 * Déduit la fin de période :
 * - si PayPal fournit `billing_info.next_billing_time`, on l’utilise
 * - sinon pour PASS1MOIS, on approxime +30j à partir de `start_time`
 */
export function extractPeriodEndFromPP(
  ppSub: any,
  plan: PlanType
): Date | null {
  const next = ppSub?.billing_info?.next_billing_time;
  if (next) return new Date(next);

  const start = ppSub?.start_time;
  if (plan === "PASS1MOIS" && start) {
    const d = new Date(start);
    // approximation simple +30j
    d.setDate(d.getDate() + 30);
    return d;
  }
  return null;
}

export function isPaidStatus(s?: string | null): boolean {
  return (s || "").toUpperCase() === "ACTIVE";
}

/** =========================
 *  Compat ascendante (anciens noms)
 *  ========================= */
export const paypalAccessToken = ppAccessToken;

export async function paypalGetSubscription(
  subscriptionID: string,
  bearer?: string
): Promise<any> {
  const token = bearer || (await ppAccessToken());
  const r = await fetch(
    `${PP_BASE}/v1/billing/subscriptions/${subscriptionID}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!r.ok) throw new Error("paypal_get_subscription_failed");
  return r.json();
}

/** =========================
 *  Annulation côté PayPal (résiliation propre)
 *  =========================
 *
 *  But :
 *   - Couper la facturation récurrente chez PayPal
 *     quand l'utilisateur désactive son espace.
 *
 *  Important :
 *   - On n'empêche JAMAIS la désactivation si PayPal refuse.
 *     On tente proprement, on log, mais on ne jette pas vers l'utilisateur.
 *
 *  API PayPal Subscriptions v1:
 *   POST /v1/billing/subscriptions/{id}/cancel
 *   Body JSON optionnelle: { reason: "..." }
 *
 *  Notes:
 *   - paypalId = Subscription.paypalId en base (ex: "I-XXXXXX").
 *   - Cette action est légitime car c'est l'utilisateur lui-même
 *     qui a exprimé sa volonté de mettre fin à la relation active.
 *     Nous exécutons sa volonté souveraine.
 */
export async function cancelSubscriptionInPaypal(
  paypalId: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!paypalId) {
    return {
      ok: false,
      error: "NO_PAYPAL_ID",
    };
  }

  try {
    const token = await ppAccessToken();

    // Raison affichable en audit : claire, calme, alignée Benmehdi.
    const body = {
      reason:
        "User requested deactivation of the OneBoarding AI space. Relationship ended at user's explicit will.",
    };

    const res = await fetch(
      `${PP_BASE}/v1/billing/subscriptions/${paypalId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    // PayPal peut retourner 204 No Content quand ça marche.
    if (res.ok) {
      return { ok: true, status: res.status };
    }

    // Pas OK -> on récupère ce qu'on peut pour logs internes.
    let errText = "";
    try {
      errText = await res.text();
    } catch {
      errText = `HTTP_${res.status}`;
    }

    // On ne throw PAS. On renvoie juste l'info.
    return {
      ok: false,
      status: res.status,
      error: errText,
    };
  } catch (e: any) {
    // Réseau down, timeout, etc. :
    // on ne bloque pas la volonté utilisateur.
    return {
      ok: false,
      error: e?.message || "PP_CANCEL_ERR",
    };
  }
}

/** alias compat si on veut l'appeler sous un autre nom */
export const paypalCancelSubscription = cancelSubscriptionInPaypal;
