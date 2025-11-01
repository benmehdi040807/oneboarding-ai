// app/api/pay/return/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PLAN_IDS, ppGetSubscription } from "@/lib/paypal";
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
 * Rôle juridique + technique :
 *
 * 1. Récupère l'ID d'abonnement PayPal (subId).
 * 2. Lit la souscription PayPal complète (ppGetSubscription).
 * 3. Extrait les infos qu'on avait encodées dans custom_id au moment de /pay/start :
 *      - phone  (numéro souverain E.164)
 *      - deviceId (identifiant local du device fondateur)
 *      - kind  ("subscription" | "one-month")
 *      - consent (boolean) → true si l'utilisateur avait DÉJÀ cliqué
 *        « Lu et approuvé » sur la page légale AVANT de partir payer.
 *
 * 4. Crée l'utilisateur s'il n'existe pas encore :
 *      - phoneE164 = identifiant juridique stable (ancre souveraine)
 *      - consentAt = now() UNIQUEMENT si:
 *          a) user n'existait pas avant, ET
 *          b) consent === true (donc il avait déjà approuvé la page légale).
 *        Sinon, consentAt reste NULL. On ne fabrique pas un consentement.
 *        La page /legal et son bouton "Lu et approuvé" sont la seule source valide.
 *
 *    SI l'utilisateur existe déjà :
 *      - On NE TOUCHE PAS consentAt. Jamais.
 *
 * 5. Upsert l'abonnement dans Subscription (plan interne, status PayPal, etc.).
 *
 * 6. Le device qui vient d'activer l'espace est immédiatement autorisé :
 *      - authorized = true
 *      - revokedAt = null
 *      - lastSeenAt = now
 *    Il devient le device légitime pour ce numéro souverain.
 *
 * 7. On crée une Session 30 jours liée à (userId + deviceId),
 *    puis on dépose un cookie httpOnly "ob_session" pour que
 *    l'utilisateur arrive déjà connecté après redirection.
 *
 * 8. Redirection finale vers "/?paid=1".
 *
 * Ce handler ne gère PAS la désactivation d'espace ni l'arrêt de facturation.
 * Ça se fera via un autre endpoint ("Désactiver mon espace") avec warning explicite.
 */
export async function GET(req: NextRequest) {
  const B = baseUrl();
  const now = new Date();

  try {
    const url = new URL(req.url);

    // 1. Récupération de l'ID de souscription renvoyé par PayPal
    const subId =
      url.searchParams.get("subscription_id") ||
      url.searchParams.get("token") ||
      url.searchParams.get("ba_token");

    if (!subId) {
      return NextResponse.redirect(`${B}/?paid_error=NO_SUBSCRIPTION_ID`, 302);
    }

    // 2. Lecture complète de la souscription PayPal
    const pp = await ppGetSubscription(subId);

    // 3. Extraction de custom_id
    //    - Nouveau format attendu : JSON.stringify({
    //         phone: string,
    //         deviceId: string,
    //         kind: "subscription" | "one-month",
    //         consent: boolean
    //       })
    //
    //    - Ancien format legacy : juste le phone en clair.
    let phoneFromCustom: string | undefined;
    let deviceIdFromCustom: string | undefined;
    let kindFromCustom: string | undefined;
    let consentFromCustom: boolean | undefined;

    const rawCustom: string | undefined =
      pp?.custom_id ||
      pp?.subscriber?.custom_id ||
      undefined;

    if (rawCustom) {
      try {
        const parsed = JSON.parse(rawCustom);
        phoneFromCustom = parsed?.phone;
        deviceIdFromCustom = parsed?.deviceId;
        kindFromCustom = parsed?.kind;
        consentFromCustom = parsed?.consent === true;
      } catch {
        // fallback legacy : juste le phone
        if (isE164(rawCustom)) {
          phoneFromCustom = rawCustom;
        }
      }
    }

    // Vérification stricte du numéro souverain
    const phoneE164 = phoneFromCustom;
    if (!isE164(phoneE164)) {
      return NextResponse.redirect(`${B}/?paid_error=NO_PHONE`, 302);
    }

    // device qui vient d'activer l'espace (peut être absent si vieux flow)
    const deviceId =
      deviceIdFromCustom && deviceIdFromCustom.trim().length >= 8
        ? deviceIdFromCustom.trim()
        : undefined;

    // Déduire le plan interne
    const planInternal = resolvePlanFrom(pp?.plan_id, kindFromCustom);

    // Statut brut PayPal (ex: "APPROVAL_PENDING", "ACTIVE", etc.)
    const subStatus = pp?.status ?? "ACTIVE";

    // Fin de période (utile pour "valable jusqu'au ...")
    let periodEnd: Date | null = null;
    const maybeNextBill = pp?.billing_info?.next_billing_time;
    if (maybeNextBill && typeof maybeNextBill === "string") {
      const d = new Date(maybeNextBill);
      if (!Number.isNaN(d.valueOf())) {
        periodEnd = d;
      }
    }

    // 4. USER : création ou récupération
    //
    // Règle :
    //  - Si l'utilisateur n'existe pas encore :
    //      • On le crée.
    //      • consentAt = now() UNIQUEMENT SI consentFromCustom === true
    //        (c'est-à-dire : il avait déjà cliqué "Lu et approuvé"
    //         sur la page légale avant d'aller payer).
    //
    //  - S'il existe déjà :
    //      • On le récupère tel quel.
    //      • On NE MODIFIE PAS consentAt (il reste ce qu'il est).
    //
    // => On ne fabrique pas un consentement implicite.
    // => On ne ré-écrit pas un consentement déjà scellé.
    let user = await prisma.user.findUnique({
      where: { phoneE164 },
      select: { id: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneE164,
          // on ne pose consentAt que si l'humain avait déjà approuvé
          // la page légale avant d'aller au paiement
          ...(consentFromCustom === true
            ? { consentAt: now }
            : {}),
        },
        select: { id: true },
      });
    }

    const userId = user.id;

    // 5. SUBSCRIPTION : rattacher le plan économique PayPal à ce user
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

    // 6. DEVICE : autoriser immédiatement l'appareil fondateur
    //
    // L'appareil qui vient d'activer l'espace est autorisé sans friction.
    // => authorized = true
    // => revokedAt = null
    // => lastSeenAt = now
    //
    // S'il n'y a pas de deviceId (vieux flow), on saute.
    let sessionId: string | null = null;
    let sessionExpiresAt: Date | null = null;

    if (deviceId) {
      const ua = req.headers.get("user-agent") ?? undefined;

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
        },
        update: {
          authorized: true,
          revokedAt: null,
          lastSeenAt: now,
          userAgent: ua,
        },
        select: { deviceId: true },
      });

      // 7. SESSION : création d'une session 30 jours
      // Cette session prouve :
      //  (a) identité souveraine (numéro),
      //  (b) possession matérielle (device autorisé),
      //  et donne accès immédiat à l'espace.
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
    // On redirige l'utilisateur vers "/?paid=1" et on dépose
    // un cookie httpOnly "ob_session" pour qu'il arrive déjà connecté.
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
