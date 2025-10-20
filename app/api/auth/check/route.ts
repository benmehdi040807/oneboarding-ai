// app/api/auth/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { userHasPaidAccess } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function readSessionId(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const v = auth.slice(7).trim();
    if (v) return v;
  }
  // cookie fallback
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)ob\.sess=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const deviceId: string | undefined =
      typeof body?.deviceId === "string" ? body.deviceId : undefined;

    const sessionId = readSessionId(req) || (typeof body?.sessionId === "string" ? body.sessionId : null);
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
    }

    // 1) Chercher la session en DB (avec user)
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: { id: true, phoneE164: true } } },
    });

    if (!session || session.revoked || session.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, error: "SESSION_INVALID" }, { status: 401 });
    }

    const phone = session.user.phoneE164;

    // 2) Accès payant ?
    const planActive = await userHasPaidAccess(phone);

    // 3) État devices
    const maxDevices = Number(process.env.NEXT_PUBLIC_MAX_DEVICES || 3);
    let hasAnyDevice = false;
    let deviceKnown = false;
    let deviceCount = 0;

    const devices = await prisma.device.findMany({
      where: { userId: session.userId, authorized: true },
      select: { deviceId: true },
    });
    deviceCount = devices.length;
    hasAnyDevice = deviceCount > 0;
    deviceKnown = !!(deviceId && devices.some((d) => d.deviceId === deviceId));

    // 4) Dernière souscription
    const lastSub = await prisma.subscription.findFirst({
      where: { user: { phoneE164: phone } },
      orderBy: { createdAt: "desc" },
      select: { plan: true, status: true, currentPeriodEnd: true, paypalId: true },
    });

    return NextResponse.json({
      ok: true,
      phone,
      planActive,
      devices: { hasAnyDevice, deviceKnown, deviceCount, maxDevices },
      last: lastSub
        ? {
            plan: lastSub.plan,
            status: lastSub.status,
            currentPeriodEnd: lastSub.currentPeriodEnd,
            paypalId: lastSub.paypalId,
          }
        : null,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
