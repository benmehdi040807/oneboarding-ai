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
          deviceCount: 0,
          maxDevices: MAX_DEVICES_DEFAULT,
          plan: null,
          subscriptionStatus: null,
          currentPeriodEnd: null,
        },
        { status: 200 }
      );
    }

    // 2) Charger la Session + relations User & Device
    const session = await prisma.session.findUnique({
      where: { id: sessionCookie },
      include: {
        user: true,
        device: true,
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
          deviceCount: 0,
          maxDevices: MAX_DEVICES_DEFAULT,
          plan: null,
          subscriptionStatus: null,
          currentPeriodEnd: null,
        },
        { status: 200 }
      );
    }

    const user = session.user;
    const device = session.device;

    // 3) Compter les devices du user
    const deviceCount = await prisma.device.count({
      where: { userId: user.id },
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

    // 5) Droit d'accès effectif (notre logique métier)
    const planActive = await userHasPaidAccess(user.phoneE164);

    // Statut "logique" pour l'UX (tu peux l'utiliser côté front si tu veux)
    let effectiveStatus: "NONE" | "ACTIVE" | "EXPIRED" = "NONE";
    if (planActive) {
      effectiveStatus = "ACTIVE";
    } else if (currentPeriodEnd && currentPeriodEnd <= now) {
      effectiveStatus = "EXPIRED";
    }

    // 6) Réponse JSON
    //
    // Les 5 premiers champs correspondent exactement à ton type CheckState :
    //   hasAnyDevice, deviceKnown, planActive, deviceCount, maxDevices
    // Le reste est optionnel pour l'UX (plan, status, dates...).
    return NextResponse.json(
      {
        loggedIn: true,
        hasAnyDevice,
        deviceKnown,
        planActive,
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
        consentGiven: !!user.consentAt,
        device: device
          ? {
              deviceId: device.deviceId,
              authorized: device.authorized,
              revoked: !!device.revokedAt,
              lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
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
        deviceCount: 0,
        maxDevices: MAX_DEVICES_DEFAULT,
        plan: null,
        subscriptionStatus: null,
        currentPeriodEnd: null,
      },
      { status: 200 }
    );
  }
}
