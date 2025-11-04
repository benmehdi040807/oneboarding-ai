// app/api/pairing/pending/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ======================= Auth serveur (cookie + header) =======================

- Session lue depuis le cookie `ob_session`
- Vérifie: session existante, non révoquée, non expirée
- Vérifie: header `x-ob-device-id` correspond à un device autorisé du user

============================================================================== */

async function requireAuthorizedSession(req: Request): Promise<{ userId: string; deviceId: string } | null> {
  // 1) Récup cookie "ob_session"
  const cookieHeader = req.headers.get("cookie") || "";
  const obSessionMatch = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("ob_session="));

  if (!obSessionMatch) return null;

  const obSession = decodeURIComponent(obSessionMatch.split("=").slice(1).join("=")).trim();
  if (!obSession) return null;

  // 2) Charger la session
  const session = await prisma.session.findUnique({
    where: { id: obSession },
    select: { id: true, userId: true, deviceId: true, expiresAt: true, revokedAt: true },
  });
  if (!session || session.revokedAt) return null;

  // 3) Expiration
  const now = new Date();
  if (session.expiresAt.getTime() <= now.getTime()) return null;

  // 4) Device appelant (doit matcher un device autorisé du user)
  const callerDeviceId = req.headers.get("x-ob-device-id") || "";
  if (!callerDeviceId) return null;

  const device = await prisma.device.findFirst({
    where: { userId: session.userId, deviceId: callerDeviceId, authorized: true, revokedAt: null },
    select: { id: true },
  });
  if (!device) return null;

  return { userId: session.userId, deviceId: callerDeviceId };
}

/* ========================= Chiffrement (AES-256-GCM) ========================= */

function getEncKey(): Buffer {
  const b64 = process.env.PAIRING_ENC_KEY || "";
  if (!b64) throw new Error("PAIRING_ENC_KEY missing");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("PAIRING_ENC_KEY must be a 32-byte base64 key");
  return key;
}

function decryptCode(encCode: Buffer, iv: Buffer, tag: Buffer): string {
  const key = getEncKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(encCode), decipher.final()]);
  return out.toString("utf8");
}

/* ================================= Types ==================================== */

type Ok =
  | { ok: true; has: false }
  | {
      ok: true;
      has: true;
      challengeId: string;
      code: string;           // à afficher sur l’appareil autorisé
      newDeviceId: string;
      attemptsLeft: number;
      expiresAt: string;
    };

type Err = { ok: false; error: string };

/* ================================= Route ==================================== */

export async function POST(req: Request) {
  try {
    const sess = await requireAuthorizedSession(req);
    if (!sess) {
      return NextResponse.json<Err>({ ok: false, error: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    // Dernier challenge PENDING non expiré pour ce user
    const challenge = await prisma.devicePairingChallenge.findFirst({
      where: { userId: sess.userId, status: "PENDING", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return NextResponse.json<Ok>({ ok: true, has: false }, { headers: { "Cache-Control": "no-store" } });
    }

    // Déchiffre le code (visible uniquement sur device autorisé)
    const code = decryptCode(
      Buffer.from(challenge.encCode),
      Buffer.from(challenge.encIv),
      Buffer.from(challenge.encTag)
    );

    return NextResponse.json<Ok>({
      ok: true,
      has: true,
      challengeId: challenge.id,
      code,
      newDeviceId: challenge.newDeviceId,
      attemptsLeft: challenge.attemptsLeft,
      expiresAt: challenge.expiresAt.toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });

  } catch (e: any) {
    console.error("PAIRING_PENDING_ERR", e);
    return NextResponse.json<Err>({ ok: false, error: "SERVER_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
