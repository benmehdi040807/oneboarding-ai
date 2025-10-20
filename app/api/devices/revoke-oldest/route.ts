// app/api/devices/revoke-oldest/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 0;

type ReqBody = { phoneE164: string };

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json().catch(() => ({} as ReqBody));
    const { phoneE164 } = body || ({} as ReqBody);

    if (!phoneE164 || typeof phoneE164 !== "string" || !phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "BAD_PHONE" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phoneE164 } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 404 });
    }

    // Find oldest authorized device
    const oldest = await prisma.device.findFirst({
      where: { userId: user.id, authorized: true },
      orderBy: { createdAt: "asc" },
    });

    if (!oldest) {
      return NextResponse.json({ ok: true, removedDeviceId: null, deviceCount: 0 });
    }

    // Option 1: delete
    await prisma.device.delete({ where: { id: oldest.id } });

    // Option 2 (alternative) could be to set authorized=false instead of deleting:
    // await prisma.device.update({ where: { id: oldest.id }, data: { authorized: false } });

    const deviceCount = await prisma.device.count({
      where: { userId: user.id, authorized: true },
    });

    return NextResponse.json({ ok: true, removedDeviceId: oldest.deviceId, deviceCount });
  } catch (e) {
    console.error("DEV_REVOKE_OLDEST_ERR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
      }
