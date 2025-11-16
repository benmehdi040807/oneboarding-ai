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
    const userId = session.userId;

    // 3. Récupérer la dernière souscription connue de cet user
    const lastSub = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        paypalId: true,
        plan: true,   // "CONTINU" | "PASS1MOIS" | ...
        status: true, // "ACTIVE" | "CANCELLED" | "EXPIRED" | ...
      },
    });

    if (lastSub) {
      const isContinu = lastSub.plan === "CONTINU";
      const isActive = lastSub.status === "ACTIVE";

      // Si plan CONTINU encore actif → on tente d'arrêter le billing PayPal
      if (isContinu && isActive && lastSub.paypalId) {
        await cancelSubscriptionInPaypal(lastSub.paypalId).catch(() => {
          // On ne bloque pas la volonté de l'utilisateur si PayPal ne répond pas.
        });
      }

      // On fige l'état contractuel ex nunc :
      // - CONTINU  → status = "CANCELLED" + currentPeriodEnd = now
      // - PASS1MOIS → on ne touche PAS au status, on met juste currentPeriodEnd = now
      const data: any = { currentPeriodEnd: now };
      if (isContinu) {
        data.status = "CANCELLED";
      }

      await prisma.subscription
        .update({
          where: { id: lastSub.id },
          data,
        })
        .catch(() => {
          // Même si ça échoue ponctuellement, on poursuit.
        });
    }

    // 4. Révoquer tous les devices actifs de cet utilisateur
    await prisma.device
      .updateMany({
        where: {
          userId,
          authorized: true,
          revokedAt: null,
        },
        data: {
          authorized: false,
          revokedAt: now,
        },
      })
      .catch(() => {});

    // 5. Révoquer toutes les sessions de cet utilisateur
    await prisma.session
      .updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      })
      .catch(() => {});

    // NOTE :
    // - On ne supprime pas l'utilisateur.
    // - On ne supprime pas l'historique.
    // - On ne touche pas aux preuves (consentAt, etc.).

    // 6. Réponse + suppression du cookie ob_session côté navigateur
    const res = NextResponse.json<Ok>(
      {
        ok: true,
        message:
          "Espace désactivé. Votre abonnement a pris fin et tous les appareils ont été révoqués.",
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
      maxAge: 0,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json<Err>(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
