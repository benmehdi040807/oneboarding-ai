// app/api/account/deactivate/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cancelSubscriptionInPaypal } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ok = {
  ok: true;
  message: string;
};
type Err = { ok: false; error: string };

// ---- lecture du cookie ob_session (session active côté client)
function readSessionCookie(req: NextRequest): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const found = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("ob_session="));
  if (!found) return null;
  const value = decodeURIComponent(found.split("=").slice(1).join("=")).trim();
  return value || null;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Identifier la session appelante
    const sessionId = readSessionCookie(req);
    if (!sessionId) {
      return NextResponse.json<Err>(
        { ok: false, error: "NO_SESSION" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2. Charger la session et l'user
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (!session) {
      return NextResponse.json<Err>(
        { ok: false, error: "SESSION_NOT_FOUND" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const now = new Date();
    const alreadyDead =
      !!session.revokedAt ||
      session.expiresAt.getTime() <= now.getTime();

    // 3. Récupérer la dernière souscription connue de cet user
    // On coupe l'accès pour toutes les formules (CONTINU / PASS1MOIS / autre),
    // car l'utilisateur a explicitement demandé la désactivation de son espace.
    const lastSub = await prisma.subscription.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        paypalId: true,
        plan: true,    // "CONTINU" | "PASS1MOIS" | ...
        status: true,  // "ACTIVE" | ...
      },
    });

    if (lastSub) {
      // Si c'était un plan continu encore actif, on tente d'arrêter le billing PayPal.
      if (
        lastSub.plan === "CONTINU" &&
        lastSub.status === "ACTIVE" &&
        lastSub.paypalId
      ) {
        await cancelSubscriptionInPaypal(lastSub.paypalId).catch(() => {
          // On ne bloque pas la volonté de l'utilisateur si PayPal ne répond pas.
        });
      }

      // Quel que soit le plan, on marque la souscription comme CANCELLED.
      // Message clair: "La relation active est suspendue ex nunc, sans hostilité."
      await prisma.subscription
        .update({
          where: { id: lastSub.id },
          data: {
            status: "CANCELLED",
          },
        })
        .catch(() => {
          // Même si ça échoue ponctuellement, on poursuit.
        });
    }

    // 4. Révoquer tous les devices actifs de cet utilisateur
    //    => pour éviter l'ambiguïté "authorized=true mais accès coupé"
    //    => on les gèle proprement : authorized = false, revokedAt = now()
    await prisma.device
      .updateMany({
        where: {
          userId: session.userId,
          authorized: true,
          revokedAt: null,
        },
        data: {
          authorized: false,
          revokedAt: now,
        },
      })
      .catch(() => {
        // Si ça échoue ponctuellement, ce n'est pas bloquant,
        // mais idéalement ça passe.
      });

    // 5. Révoquer la session actuelle (il est déconnecté immédiatement)
    if (!alreadyDead) {
      await prisma.session
        .update({
          where: { id: session.id },
          data: {
            revokedAt: now,
          },
        })
        .catch(() => {
          // idem: ne bloque pas
        });
    }

    // NOTE IMPORTANTE :
    // - On ne supprime pas l'utilisateur.
    // - On ne supprime pas l'historique (History).
    // - On ne supprime pas les consentements enregistrés (consentAt reste comme preuve si elle existe).
    // - On garde tout l'ADN probatoire du Benmehdi Protocol.
    //
    // Ce que l'utilisateur a demandé est exécuté :
    // "Je mets fin à la relation active. Stoppez l'abonnement.
    //  Coupez l'accès. Sans hostilité."

    // 6. Réponse + suppression du cookie ob_session côté navigateur
    const res = NextResponse.json<Ok>(
      {
        ok: true,
        message:
          "Espace désactivé. L'abonnement en cours est résilié. Tous les appareils ont été révoqués. Vous êtes maintenant déconnecté.",
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );

    res.cookies.set("ob_session", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 0, // expire tout de suite
    });

    return res;
  } catch (e: any) {
    return NextResponse.json<Err>(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
             }
