// app/api/devices/revoke-oldest/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 0;

type ReqBody = { phoneE164: string };

const MAX_DEVICES = Number(process.env.MAX_DEVICES || 3);

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json().catch(() => ({} as ReqBody));
    const { phoneE164 } = body || ({} as ReqBody);

    if (!phoneE164 || typeof phoneE164 !== "string" || !phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "BAD_PHONE" }, { status: 400 });
    }

    // 1) user
    const user = await prisma.user.findUnique({ where: { phoneE164 } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 404 });
    }

    // 2) trouver l'appareil le plus ancien encore actif (authorized=true & non révoqué)
    const oldest = await prisma.device.findFirst({
      where: { userId: user.id, authorized: true, revokedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, deviceId: true },
    });

    if (!oldest) {
      // rien à révoquer
      const deviceCount = await prisma.device.count({
        where: { userId: user.id, authorized: true, revokedAt: null },
      });
      return NextResponse.json({
        ok: true,
        revokedDeviceId: null,
        deviceCount,
        maxDevices: MAX_DEVICES,
      });
    }

    // 3) désactiver (pas de delete)
    const now = new Date();
    await prisma.device.update({
      where: { id: oldest.id },
      data: { authorized: false, revokedAt: now },
    });

    // 4) recompter
    const deviceCount = await prisma.device.count({
      where: { userId: user.id, authorized: true, revokedAt: null },
    });

    return NextResponse.json({
      ok: true,
      revokedDeviceId: oldest.deviceId,
      deviceCount,
      maxDevices: MAX_DEVICES,
      revokedAt: now.toISOString(),
    });
  } catch (e) {
    console.error("DEV_REVOKE_OLDEST_ERR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
