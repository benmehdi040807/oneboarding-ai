// app/api/pay/return/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PLAN_IDS, ppGetSubscription } from "@/lib/paypal";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Petite util interne, évite d'ajouter une dépendance externe :
function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function baseUrl() {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "https://oneboardingai.com";
  return b.endsWith("/") ? b.slice(0, -1) : b;
}

function isE164(p?: string): p is string {
  return typeof p === "string" && p.startsWith("+") && p.length >= 6;
}

/**
 * Détermine le plan interne "CONTINU" | "PASS1MOIS".
 * On regarde d'abord le champ "kind" encodé dans custom_id,
 * sinon on fallback sur le plan_id PayPal.
 */
function resolvePlanFrom(
  planIdFromPP: string | undefined,
  kindFromCustom: string | undefined
) {
  if (kindFromCustom === "subscription") return "CONTINU" as const;
  if (kindFromCustom === "one-month") return "PASS1MOIS" as const;

  if (planIdFromPP && String(planIdFromPP) === String(PLAN_IDS.PASS1MOIS)) {
    return "PASS1MOIS" as const;
  }
  return "CONTINU" as const;
}

/**
 * /api/pay/return
 *
 * Rôle :
 *
 * 1. Récupère l'ID d'abonnement PayPal (subId).
 * 2. Lit la souscription PayPal complète (ppGetSubscription).
 * 3. Extrait ce qu'on a encodé dans custom_id au moment de /pay/start :
 *      - phone     (numéro souverain E.164)
 *      - deviceId  (ID local du device fondateur)
 *      - kind      ("subscription" | "one-month")
 *      - consent   (boolean) → true si l'utilisateur avait DÉJÀ cliqué
 *        « Lu et approuvé » sur la page légale avant d'aller payer.
 *
 * 4. Crée l'utilisateur s'il n'existe pas encore :
 *      - phoneE164 = identifiant souverain
 *      - consentAt = now() UNIQUEMENT SI:
 *          a) user n'existait pas avant, ET
 *          b) consent === true (il a déjà approuvé la page légale).
 *      Sinon consentAt reste NULL. Pas de consentement fictif.
 *      Si l'utilisateur existe déjà : on ne touche jamais consentAt.
 *
 * 5. Upsert l'abonnement dans Subscription.
 *
 * 6. Autorise immédiatement le device qui vient d'activer l'espace
 *    (authorized = true, revokedAt = null, lastSeenAt = now).
 *
 * 7. Crée une Session valable 30 jours (userId + deviceId),
 *    puis dépose un cookie httpOnly "ob_session" pour arriver connecté.
 *
 * 8. Redirige vers "/?paid=1".
 *
 * Ce handler NE résilie PAS l'abonnement et NE désactive PAS l'espace.
 * Ça sera un autre endpoint : "Désactiver mon espace" avec warning clair.
 */
export async function GET(req: NextRequest) {
  const B = baseUrl();
  const now = new Date();

  try {
    const url = new URL(req.url);

    // 1. ID de souscription PayPal renvoyé dans l'URL
    const subId =
      url.searchParams.get("subscription_id") ||
      url.searchParams.get("token") ||
      url.searchParams.get("ba_token");

    if (!subId) {
      return NextResponse.redirect(`${B}/?paid_error=NO_SUBSCRIPTION_ID`, 302);
    }

    // 2. Lecture PayPal
    const pp = await ppGetSubscription(subId);

    // 3. Extraction de custom_id
    //    Format attendu (nouveau) :
    //    {
    //      "phone": "+212...",
    //      "deviceId": "xxxxxxxx-....",
    //      "kind": "subscription" | "one-month",
    //      "consent": true | false
    //    }
    //
    //    Ancien format (legacy) : juste le phone en clair.
    let phoneFromCustom: string | undefined;
    let deviceIdFromCustom: string | undefined;
    let kindFromCustom: string | undefined;
    let consentFromCustom: boolean | undefined;

    const rawCustom: string | undefined =
      pp?.custom_id || pp?.subscriber?.custom_id || undefined;

    if (rawCustom) {
      try {
        const parsed = JSON.parse(rawCustom);
        phoneFromCustom = parsed?.phone;
        deviceIdFromCustom = parsed?.deviceId;
        kindFromCustom = parsed?.kind;
        consentFromCustom = parsed?.consent === true;
      } catch {
        // fallback legacy
        if (isE164(rawCustom)) {
          phoneFromCustom = rawCustom;
        }
      }
    }

    // Vérif du numéro souverain
    const phoneE164 = phoneFromCustom;
    if (!isE164(phoneE164)) {
      return NextResponse.redirect(`${B}/?paid_error=NO_PHONE`, 302);
    }

    // device fondateur (peut être vide si vieux flow)
    const deviceId =
      deviceIdFromCustom && deviceIdFromCustom.trim().length >= 8
        ? deviceIdFromCustom.trim()
        : undefined;

    // Plan interne
    const planInternal = resolvePlanFrom(pp?.plan_id, kindFromCustom);

    // ------------------------------
    // Statut PayPal brut + normalisation souveraine
    // ------------------------------
    const rawStatus = pp?.status ?? "ACTIVE";
    let subStatus = rawStatus;

    // PASS1MOIS : même si PayPal renvoie EXPIRED dès le départ,
    // on force ACTIVE. L'expiration relève du Benmehdi Protocol
    // via currentPeriodEnd (et non de l'humeur de PayPal).
    if (planInternal === "PASS1MOIS" && rawStatus === "EXPIRED") {
      subStatus = "ACTIVE";
    }
    // ------------------------------

    // Fin de période (prochaine échéance facturation PayPal)
    let periodEnd: Date | null = null;
    const maybeNextBill = pp?.billing_info?.next_billing_time;
    if (maybeNextBill && typeof maybeNextBill === "string") {
      const d = new Date(maybeNextBill);
      if (!Number.isNaN(d.valueOf())) {
        periodEnd = d;
      }
    }

    // Fallback souverain pour PASS1MOIS :
    // si PayPal ne donne aucune next_billing_time claire,
    // on fixe currentPeriodEnd à maintenant + 30 jours.
    if (!periodEnd && planInternal === "PASS1MOIS") {
      periodEnd = addDays(now, 30);
    }

    // 4. USER : création ou récupération
    //
    // Règle :
    //  - Pas d'utilisateur -> on crée.
    //    consentAt = now() UNIQUEMENT SI consentFromCustom === true
    //    (donc il a déjà cliqué "Lu et approuvé" sur la page légale
    //    avant de partir payer).
    //
    //  - User existe déjà -> on le récupère sans toucher consentAt.
    let user = await prisma.user.findUnique({
      where: { phoneE164 },
      select: { id: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneE164,
          ...(consentFromCustom === true ? { consentAt: now } : {}),
        },
        select: { id: true },
      });
    }

    const userId = user.id;

    // 5. SUBSCRIPTION : abonnement PayPal lié au user
    await prisma.subscription.upsert({
      where: { paypalId: subId },
      create: {
        userId,
        paypalId: subId,
        plan: planInternal, // "CONTINU" | "PASS1MOIS"
        status: subStatus,
        currentPeriodEnd: periodEnd ?? undefined,
        cancelAtPeriodEnd: false,
      },
      update: {
        userId,
        plan: planInternal,
        status: subStatus,
        currentPeriodEnd: periodEnd ?? undefined,
      },
    });

    // 6. DEVICE : autoriser tout de suite le device qui vient d'activer l'espace
    //
    // RÈGLE isFounder :
    //   - si aucun device n'existe encore pour ce user → isFounder = true
    //   - sinon → isFounder = false pour les créations,
    //     et on ne touche JAMAIS isFounder dans l'update.
    //
    // authorized = true
    // revokedAt = null
    // lastSeenAt = now
    //
    // Si pas de deviceId (ancien flux), on saute.
    let sessionId: string | null = null;
    let sessionExpiresAt: Date | null = null;

    if (deviceId) {
      const ua = req.headers.get("user-agent") ?? undefined;

      // Combien de devices possède déjà ce user ?
      const existingDeviceCount = await prisma.device.count({
        where: { userId },
      });

      const isFounder = existingDeviceCount === 0;

      const deviceRecord = await prisma.device.upsert({
        where: {
          userId_deviceId: {
            userId,
            deviceId,
          },
        },
        create: {
          userId,
          deviceId,
          label: null,
          platform: null,
          userAgent: ua,
          authorized: true,
          revokedAt: null,
          lastSeenAt: now,
          firstAuthorizedAt: now,
          isFounder, // fondateur SI et seulement si 1er device de ce user
        },
        update: {
          authorized: true,
          revokedAt: null,
          lastSeenAt: now,
          userAgent: ua,
          // ⚠️ on NE touche PAS à isFounder ici → l'historique reste intact
        },
        select: { deviceId: true },
      });

      // 7. SESSION : 30 jours
      const EXPIRE_AFTER_DAYS = 30;
      const exp = addDays(now, EXPIRE_AFTER_DAYS);

      const session = await prisma.session.create({
        data: {
          userId,
          deviceId: deviceRecord.deviceId,
          expiresAt: exp,
          revokedAt: null,
        },
        select: {
          id: true,
          expiresAt: true,
        },
      });

      sessionId = session.id;
      sessionExpiresAt = session.expiresAt;
    }

    // 8. REDIRECTION + COOKIE DE SESSION
    //
    // On renvoie /?paid=1 et on set le cookie "ob_session"
    // httpOnly pour que l'espace soit directement actif côté client.
    const redirectUrl = `${B}/?paid=1`;
    const res = NextResponse.redirect(redirectUrl, 302);

    if (sessionId && sessionExpiresAt) {
      res.cookies.set("ob_session", sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        expires: sessionExpiresAt,
      });
    }

    return res;
  } catch (e: any) {
    const msg = e?.message || "PAY_RETURN_ERROR";
    return NextResponse.redirect(
      `${baseUrl()}/?paid_error=${encodeURIComponent(msg)}`,
      302
    );
  }
      }
