// app/api/devices/authorize/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 0;

type ReqBody = { phoneE164: string; deviceId: string };

const MAX_DEVICES = Number(process.env.MAX_DEVICES || 3);

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json().catch(() => ({} as ReqBody));
    const { phoneE164, deviceId } = body || ({} as ReqBody);

    if (!phoneE164 || typeof phoneE164 !== "string" || !phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "BAD_PHONE" }, { status: 400 });
    }
    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json({ ok: false, error: "BAD_DEVICE_ID" }, { status: 400 });
    }

    // 1) find user
    const user = await prisma.user.findUnique({ where: { phoneE164 } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 404 });
    }

    // 2) Upsert device (mark authorized)
    const device = await prisma.device.upsert({
      where: { deviceId },
      create: {
        userId: user.id,
        deviceId,
        authorized: true,
      },
      update: {
        userId: user.id,
        authorized: true,
      },
    });

    // 3) Count authorized devices for this user
    const deviceCount = await prisma.device.count({
      where: { userId: user.id, authorized: true },
    });

    // 4) If over limit, return info (caller may call revoke-oldest)
    const deviceOverLimit = deviceCount > MAX_DEVICES;

    return NextResponse.json({
      ok: true,
      userId: user.id,
      deviceCount,
      maxDevices: MAX_DEVICES,
      device,
      overLimit: deviceOverLimit,
    });
  } catch (e) {
    console.error("DEV_AUTHORIZE_ERR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
