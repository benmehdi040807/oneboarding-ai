// app/api/devices/authorize/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 0;

type ReqBody = {
  phoneE164: string;
  deviceId: string;
  label?: string;
  userAgent?: string;
  platform?: string; // ex: "iOS" | "Android" | "Web"
};

const MAX_DEVICES = Number(process.env.MAX_DEVICES || 3);

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json().catch(() => ({} as ReqBody));
    const { phoneE164, deviceId, label, userAgent, platform } = body || ({} as ReqBody);

    if (!phoneE164 || typeof phoneE164 !== "string" || !phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "BAD_PHONE" }, { status: 400 });
    }
    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json({ ok: false, error: "BAD_DEVICE_ID" }, { status: 400 });
    }

    // 1) user
    const user = await prisma.user.findUnique({ where: { phoneE164 } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 404 });
    }

    // 2) upsert sur la clé composite (userId, deviceId)
    //    - authorized -> true
    //    - revokedAt  -> null (réactive si besoin)
    //    - lastSeenAt -> now
    const now = new Date();
    const device = await prisma.device.upsert({
      where: { userId_deviceId: { userId: user.id, deviceId } },
      create: {
        userId: user.id,
        deviceId,
        label: label || null,
        userAgent: userAgent || null,
        platform: platform || null,
        authorized: true,
        revokedAt: null,
        lastSeenAt: now,
      },
      update: {
        label: label ?? undefined,
        userAgent: userAgent ?? undefined,
        platform: platform ?? undefined,
        authorized: true,
        revokedAt: null,
        lastSeenAt: now,
      },
      select: {
        id: true,
        deviceId: true,
        authorized: true,
        revokedAt: true,
        label: true,
        userAgent: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
      },
    });

    // 3) compter les appareils autorisés (non révoqués)
    const deviceCount = await prisma.device.count({
      where: { userId: user.id, authorized: true, revokedAt: null },
    });

    const overLimit = deviceCount > MAX_DEVICES;

    // 4) réponse
    return NextResponse.json({
      ok: true,
      userId: user.id,
      deviceCount,
      maxDevices: MAX_DEVICES,
      overLimit,
      device,
    });
  } catch (e) {
    console.error("DEV_AUTHORIZE_ERR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
