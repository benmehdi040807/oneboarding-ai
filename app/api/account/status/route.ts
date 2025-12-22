// app/api/account/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { userHasPaidAccess } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Limite "théorique" de devices par utilisateur (même valeur que côté front)
const MAX_DEVICES_DEFAULT = 3;

type EffectiveStatus =
  | "NONE"
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "DENIED"
  | "UNKNOWN";

function baseResponse() {
  return {
    loggedIn: false,
    hasAnyDevice: false,
    deviceKnown: false,
    planActive: false,
    spaceActive: false,
    deviceCount: 0,
    maxDevices: MAX_DEVICES_DEFAULT,
    plan: null as string | null,
    subscriptionStatus: null as string | null,
    effectiveStatus: "NONE" as EffectiveStatus,
    currentPeriodEnd: null as string | null,
    phoneE164: null as string | null,
    device: null as
      | null
      | {
          deviceId: string;
          authorized: boolean;
          revoked: boolean;
          lastSeenAt: string | null;
        },
  };
}

function computeEffectiveStatus(args: {
  hasPaidAccess: boolean;
  subStatus: string | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  now: Date;
}): EffectiveStatus {
  const { hasPaidAccess, subStatus, currentPeriodEnd, cancelledAt, now } = args;

  if (hasPaidAccess) return "ACTIVE";
  if (!subStatus && !currentPeriodEnd && !cancelledAt) return "NONE";

  const st = (subStatus || "").toUpperCase();

  if (st === "REFUNDED") return "REFUNDED";
  if (st === "DENIED") return "DENIED";
  if (st === "CANCELLED") return "CANCELLED";

  // Si cancelledAt est posé → c’est une décision humaine : on l’affiche comme CANCELLED
  if (cancelledAt) return "CANCELLED";

  // Sinon si une échéance existe et est passée → EXPIRED
  if (currentPeriodEnd && currentPeriodEnd <= now) return "EXPIRED";

  // Sinon : inconnu (cas rare: APPROVED mais pas capturé, etc.)
  return "UNKNOWN";
}

export async function GET(req: NextRequest) {
  const now = new Date();

  try {
    // 1) cookie httpOnly (Session.id opaque)
    const sessionId = req.cookies.get("ob_session")?.value ?? null;

    if (!sessionId) {
      return NextResponse.json(baseResponse(), { status: 200 });
    }

    // 2) Session + user
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || session.revokedAt || !session.expiresAt || session.expiresAt <= now) {
      return NextResponse.json(baseResponse(), { status: 200 });
    }

    const user = session.user;

    // 3) Device de la session (si présent)
    let device: null | { deviceId: string; authorized: boolean; revokedAt: Date | null; lastSeenAt: Date | null } =
      null;

    if (session.deviceId) {
      const d = await prisma.device.findUnique({
        where: {
          userId_deviceId: {
            userId: session.userId,
            deviceId: session.deviceId,
          },
        },
        select: {
          deviceId: true,
          authorized: true,
          revokedAt: true,
          lastSeenAt: true,
        },
      });

      if (d) device = d;
    }

    // 4) Devices autorisés (non révoqués)
    const deviceCount = await prisma.device.count({
      where: { userId: user.id, authorized: true, revokedAt: null },
    });

    const hasAnyDevice = deviceCount > 0;
    const deviceKnown = !!device && device.authorized && !device.revokedAt;

    // 5) Dernière subscription
    const sub = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        plan: true,
        status: true,
        currentPeriodEnd: true,
        cancelledAt: true,
        paypalId: true,
        createdAt: true,
      },
    });

    const plan = sub?.plan ?? null;
    const rawStatus = sub?.status ?? null;
    const currentPeriodEnd = sub?.currentPeriodEnd ?? null;

    // 6) Droit d’accès effectif (par user) — micro-optimisé (0 requête en plus)
    const planActive = await userHasPaidAccess(
      user.phoneE164,
      sub
        ? {
            status: sub.status ?? null,
            currentPeriodEnd: sub.currentPeriodEnd ?? null,
            cancelledAt: sub.cancelledAt ?? null,
          }
        : null
    );

    const spaceActive = planActive;

    const effectiveStatus = computeEffectiveStatus({
      hasPaidAccess: planActive,
      subStatus: rawStatus,
      currentPeriodEnd,
      cancelledAt: sub?.cancelledAt ?? null,
      now,
    });

    return NextResponse.json(
      {
        loggedIn: true,
        hasAnyDevice,
        deviceKnown,
        planActive,
        spaceActive,
        deviceCount,
        maxDevices: MAX_DEVICES_DEFAULT,

        plan,
        subscriptionStatus: rawStatus,
        effectiveStatus,
        currentPeriodEnd: currentPeriodEnd ? currentPeriodEnd.toISOString() : null,
        phoneE164: user.phoneE164,
        device: device
          ? {
              deviceId: device.deviceId,
              authorized: device.authorized,
              revoked: !!device.revokedAt,
              lastSeenAt: device.lastSeenAt ? device.lastSeenAt.toISOString() : null,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[/api/account/status] error:", e);
    return NextResponse.json(baseResponse(), { status: 200 });
  }
        }
