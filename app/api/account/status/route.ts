// app/api/account/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { userHasPaidAccess } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Limite "théorique" de devices par utilisateur (même valeur que côté front)
const MAX_DEVICES_DEFAULT = 3;

export async function GET(req: NextRequest) {
  const now = new Date();

  try {
    // 1) Récupérer l'ID de session depuis le cookie httpOnly
    const sessionCookie = req.cookies.get("ob_session")?.value ?? null;

    if (!sessionCookie) {
      // Pas de session => pas connecté, pas de device connu, pas d'espace actif
      return NextResponse.json(
        {
          loggedIn: false,
          hasAnyDevice: false,
          deviceKnown: false,
          planActive: false,
          spaceActive: false,
          deviceCount: 0,
          maxDevices: MAX_DEVICES_DEFAULT,
          plan: null,
          subscriptionStatus: null,
          effectiveStatus: "NONE" as const,
          currentPeriodEnd: null,
          phoneE164: null,
          device: null,
        },
        { status: 200 }
      );
    }

    // 2) Charger la Session + relation User
    const session = await prisma.session.findUnique({
      where: { id: sessionCookie },
      include: {
        user: true,
      },
    });

    if (
      !session ||
      session.revokedAt ||
      !session.expiresAt ||
      session.expiresAt <= now
    ) {
      // Session inexistante ou expirée / révoquée
      return NextResponse.json(
        {
          loggedIn: false,
          hasAnyDevice: false,
          deviceKnown: false,
          planActive: false,
          spaceActive: false,
          deviceCount: 0,
          maxDevices: MAX_DEVICES_DEFAULT,
          plan: null,
          subscriptionStatus: null,
          effectiveStatus: "NONE" as const,
          currentPeriodEnd: null,
          phoneE164: null,
          device: null,
        },
        { status: 200 }
      );
    }

    const user = session.user;

    // 2 bis) Charger le device correspondant à session.deviceId (si présent)
    let device:
      | null
      | {
          deviceId: string;
          authorized: boolean;
          revokedAt: Date | null;
          lastSeenAt: Date | null;
        } = null;

    if (session.deviceId) {
      const d = await prisma.device.findUnique({
        where: {
          userId_deviceId: {
            userId: session.userId,
            deviceId: session.deviceId,
          },
        },
      });

      if (d) {
        device = {
          deviceId: d.deviceId,
          authorized: d.authorized,
          revokedAt: d.revokedAt,
          lastSeenAt: d.lastSeenAt,
        };
      }
    }

    // 3) Compter UNIQUEMENT les devices autorisés du user
    const deviceCount = await prisma.device.count({
      where: {
        userId: user.id,
        authorized: true,
        revokedAt: null,
      },
    });

    const hasAnyDevice = deviceCount > 0;
    const deviceKnown = !!device && device.authorized && !device.revokedAt;

    // 4) Abonnement le plus récent du user
    const sub = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    const plan = sub?.plan ?? null;
    const rawStatus = sub?.status ?? null;
    const currentPeriodEnd = sub?.currentPeriodEnd ?? null;

    // 5) Droit d'accès effectif (logique métier globale, par USER)
    //
    // 🔒 RÈGLE UNIQUE appliquée par userHasPaidAccess :
    //    status === "ACTIVE" && currentPeriodEnd > now
    const planActive = await userHasPaidAccess(user.phoneE164);

    // Alias pour cohérence avec le reste de l'app
    const spaceActive = planActive;

    // Statut "logique" pour l’UX
    let effectiveStatus: "NONE" | "ACTIVE" | "EXPIRED" = "NONE";
    if (planActive) {
      effectiveStatus = "ACTIVE";
    } else if (currentPeriodEnd && currentPeriodEnd <= now) {
      effectiveStatus = "EXPIRED";
    }

    // 6) Réponse JSON
    // 🔹 Les 6 premiers champs peuvent servir de base à CheckState
    return NextResponse.json(
      {
        loggedIn: true,
        hasAnyDevice,
        deviceKnown,
        planActive,
        spaceActive,
        deviceCount,
        maxDevices: MAX_DEVICES_DEFAULT,

        // Infos supplémentaires (non obligatoires pour CheckState)
        plan,
        subscriptionStatus: rawStatus,
        effectiveStatus,
        currentPeriodEnd: currentPeriodEnd
          ? currentPeriodEnd.toISOString()
          : null,
        phoneE164: user.phoneE164,
        device: device
          ? {
              deviceId: device.deviceId,
              authorized: device.authorized,
              revoked: !!device.revokedAt,
              lastSeenAt: device.lastSeenAt
                ? device.lastSeenAt.toISOString()
                : null,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[/api/account/status] error:", e);

    return NextResponse.json(
      {
        loggedIn: false,
        hasAnyDevice: false,
        deviceKnown: false,
        planActive: false,
        spaceActive: false,
        deviceCount: 0,
        maxDevices: MAX_DEVICES_DEFAULT,
        plan: null,
        subscriptionStatus: null,
        effectiveStatus: "NONE" as const,
        currentPeriodEnd: null,
        phoneE164: null,
        device: null,
      },
      { status: 200 }
    );
  }
}
