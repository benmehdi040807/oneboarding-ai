// app/api/devices/revoke/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReqBody = {
  deviceId?: string;
};

type Ok = {
  ok: true;
  revokedDeviceId: string;
  revokedAt: string;
  remainingActiveDevices: number;
};

type Err = { ok: false; error: string };

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
    // 1. Vérifier qu'on a bien une session valide (l'utilisateur agit pour lui-même)
    const sessionId = readSessionCookie(req);
    if (!sessionId) {
      return NextResponse.json<Err>(
        { ok: false, error: "NO_SESSION" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

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
    const sessionDead =
      !!session.revokedAt || session.expiresAt.getTime() <= now.getTime();
    if (sessionDead) {
      return NextResponse.json<Err>(
        { ok: false, error: "SESSION_EXPIRED" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2. Récupérer le body → l'utilisateur dit explicitement quel appareil il veut révoquer
    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";

    if (!deviceId) {
      return NextResponse.json<Err>(
        { ok: false, error: "BAD_DEVICE_ID" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 3. Vérifier que cet appareil appartient bien à CE user et est encore actif
    const device = await prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId: session.userId,
          deviceId,
        },
      },
      select: {
        id: true,
        authorized: true,
        revokedAt: true,
      },
    });

    if (!device) {
      // L'appareil n'existe pas pour cet utilisateur
      return NextResponse.json<Err>(
        { ok: false, error: "DEVICE_NOT_FOUND_FOR_USER" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!device.authorized || device.revokedAt !== null) {
      // Déjà révoqué ou déjà inactif
      return NextResponse.json<Err>(
        { ok: false, error: "DEVICE_ALREADY_REVOKED" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 4. Révoquer CET appareil, explicitement demandé par l'utilisateur
    const revokeAt = new Date();
    await prisma.device.update({
      where: { id: device.id },
      data: {
        authorized: false,
        revokedAt: revokeAt,
      },
    });

    // 5. Recompter les appareils encore actifs après révocation
    const remaining = await prisma.device.count({
      where: {
        userId: session.userId,
        authorized: true,
        revokedAt: null,
      },
    });

    // 6. Réponse claire : acte volontaire, traçable
    const payload: Ok = {
      ok: true,
      revokedDeviceId: deviceId,
      revokedAt: revokeAt.toISOString(),
      remainingActiveDevices: remaining,
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    console.error("DEV_REVOKE_ERR", e);
    return NextResponse.json<Err>(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
    }
