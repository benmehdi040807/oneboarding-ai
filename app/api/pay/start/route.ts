// app/api/pay/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PLAN_IDS, ppAccessToken, PP_BASE } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PlanKind = "subscription" | "one-month";

type Body = {
  kind?: PlanKind;     // "subscription" | "one-month"
  phone?: string;      // numéro E.164 (+2126...)
  deviceId?: string;   // device unique local (généré côté client)
};

type Ok = {
  ok: true;
  approvalUrl: string;
};

type Err = {
  ok: false;
  error: string;
  raw?: unknown;
  debugId?: string;
};

function baseUrl(): string {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "https://oneboardingai.com";
  return b.endsWith("/") ? b.slice(0, -1) : b;
}

// Vérifie format E.164 minimal
function isE164(p?: string): p is string {
  return typeof p === "string" && p.startsWith("+") && p.length >= 6;
}

// Vérifie qu'on a un deviceId non vide, raisonnable
function isDeviceId(d?: string): d is string {
  return typeof d === "string" && d.trim().length >= 8;
}

/**
 * POST /api/pay/start
 *
 * Body attendu:
 * {
 *   kind: "subscription" | "one-month",
 *   phone: "+2126....",
 *   deviceId: "xxxxx-local-generated-id"
 * }
 *
 * Rsp succès:
 * { ok: true, approvalUrl: "https://www.paypal.com/checkoutnow?..." }
 *
 * Étapes:
 * 1. On choisit le plan PayPal (mensuel continu ou accès 1 mois).
 * 2. On demande à PayPal de créer la subscription.
 * 3. On encode dans `custom_id` les infos vitales (phone, deviceId, kind)
 *    pour récupération directe dans /api/pay/return.
 *
 * Rien n'est encore écrit en base ici. La création réelle (User, Subscription,
 * Device fondateur autorisé, Session, consentAt, etc.) se fera dans /api/pay/return
 * APRÈS approbation du paiement par PayPal.
 */
export async function POST(req: NextRequest) {
  try {
    // Récup body
    const { kind, phone, deviceId } = (await req.json().catch(() => ({}))) as Body;

    // 1. Validation de l'intention d'abonnement
    if (kind !== "subscription" && kind !== "one-month") {
      return NextResponse.json<Err>(
        { ok: false, error: "BAD_KIND" },
        { status: 400 }
      );
    }

    // 2. Validation téléphone (identité contractuelle / ID unique)
    if (!isE164(phone)) {
      return NextResponse.json<Err>(
        { ok: false, error: "BAD_PHONE" },
        { status: 400 }
      );
    }

    // 3. Validation deviceId
    //    Cet appareil va devenir l'appareil fondateur autorisé d'office
    //    si le paiement est validé => on DOIT le connaître maintenant.
    if (!isDeviceId(deviceId)) {
      return NextResponse.json<Err>(
        { ok: false, error: "BAD_DEVICE_ID" },
        { status: 400 }
      );
    }

    // 4. Mapper le plan interne -> PayPal plan_id
    //    "subscription" => offre continue (mensuel récurrent)
    //    "one-month"   => accès libre 1 mois (non reconductible)
    const planKey = kind === "subscription" ? "CONTINU" : "PASS1MOIS";
    const planId = PLAN_IDS[planKey];
    if (!planId) {
      return NextResponse.json<Err>(
        { ok: false, error: "PLAN_ID_MISSING" },
        { status: 500 }
      );
    }

    // 5. Auth PayPal
    const token = await ppAccessToken();

    // 6. URLs de retour / annulation.
    //    Très important: on renvoie l'utilisateur chez NOUS,
    //    pas directement vers une page statique PayPal.
    //    /api/pay/return confirmera définitivement
    //    et créera l'espace souverain.
    const B = baseUrl();
    const returnUrl = `${B}/api/pay/return`;
    const cancelUrl = `${B}/api/pay/cancel`;

    // 7. On emballe nos infos critiques dans custom_id.
    //    custom_id doit tenir dans une string. On encode en JSON compact
    //    puis on .toString() (ici JSON.stringify suffit).
    //
    //    Au moment de /api/pay/return, on relira ça pour:
    //    - créer ou retrouver le User par phone
    //    - enregistrer le consentAt
    //    - créer la Subscription
    //    - créer le Device fondateur: authorized=true, firstAuthorizedAt=now(), isFounder=true
    //    - créer la Session
    //
    //    NOTE: PayPal renvoie custom_id tel quel dans l'objet subscription.
    const customPayload = JSON.stringify({
      phone,
      deviceId,
      kind,
    });

    // 8. Appel API PayPal: create subscription
    //    Doc: https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_create
    const ppBase = PP_BASE.replace(/\/$/, "");
    const createRes = await fetch(`${ppBase}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // idempotency key: réduit le risque de doublon si le réseau rejoue la requête
        "PayPal-Request-Id": `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        // pour tenter d'obtenir la réponse complète dès la création
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        plan_id: planId,
        // On insère ici "qui est en train de payer pour quoi"
        custom_id: customPayload,
        application_context: {
          brand_name: "OneBoarding AI",
          user_action: "SUBSCRIBE_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
      cache: "no-store",
    });

    const debugId = createRes.headers.get("paypal-debug-id") || undefined;
    const data: any = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      const msg =
        data?.details?.[0]?.issue ||
        data?.message ||
        `PayPal create subscription failed (HTTP ${createRes.status})`;

      return NextResponse.json<Err>(
        { ok: false, error: msg, raw: data, debugId },
        { status: 500 }
      );
    }

    // 9. Récupérer le lien d'approbation PayPal
    const links: Array<{ rel?: string; href?: string }> = Array.isArray(
      data?.links
    )
      ? data.links
      : [];
    const approvalUrl = links.find((l) => l?.rel === "approve")?.href;

    if (!approvalUrl) {
      return NextResponse.json<Err>(
        { ok: false, error: "NO_APPROVAL_URL", raw: data, debugId },
        { status: 500 }
      );
    }

    // 10. On renvoie l'URL PayPal au front.
    // Le front redirige l'utilisateur chez PayPal pour qu'il confirme/paye.
    // Après paiement, PayPal renvoie le navigateur vers /api/pay/return
    // (qui va alors créer l'espace souverain et autoriser ce device).
    return NextResponse.json<Ok>({ ok: true, approvalUrl });
  } catch (e: any) {
    return NextResponse.json<Err>(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
