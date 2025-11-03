// app/api/pairing/pending/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ⬇️ À adapter si tu as déjà une util d’auth serveur
async function requireAuthorizedSession(req: Request): Promise<{ userId: string; deviceId: string } | null> {
  // Exemple minimal : headers "x-user-id" & "x-device-id" (remplace par ton vrai mécanisme)
  const userId = req.headers.get("x-user-id") || "";
  const deviceId = req.headers.get("x-device-id") || "";
  if (!userId || !deviceId) return null;

  const device = await prisma.device.findFirst({
    where: { userId, deviceId, authorized: true, revokedAt: null },
    select: { id: true },
  });
  if (!device) return null;

  return { userId, deviceId };
}

function getEncKey(): Buffer {
  const b64 = process.env.PAIRING_ENC_KEY || "";
  if (!b64) throw new Error("PAIRING_ENC_KEY missing");
  const key = Buffer.from(b64, "base64");
  if (![16, 24, 32].includes(key.length)) throw new Error("PAIRING_ENC_KEY must be 16/24/32 bytes base64");
  return key;
}

function decryptCode(encCode: Buffer, iv: Buffer, tag: Buffer): string {
  const key = getEncKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key.length === 32 ? key : crypto.createHash("sha256").update(key).digest(), iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(encCode), decipher.final()]);
  return out.toString("utf8");
}

type Ok =
  | { ok: true; has: false }
  | {
      ok: true;
      has: true;
      challengeId: string;
      code: string;           // affichage côté device autorisé
      newDeviceId: string;
      attemptsLeft: number;
      expiresAt: string;
    };

type Err = { ok: false; error: string };

export async function POST(req: Request) {
  try {
    const sess = await requireAuthorizedSession(req);
    if (!sess) return NextResponse.json<Err>({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

    // Dernier challenge PENDING, non expiré
    const challenge = await prisma.devicePairingChallenge.findFirst({
      where: {
        userId: sess.userId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) return NextResponse.json<Ok>({ ok: true, has: false });

    // Déchiffre pour affichage (uniquement sur device autorisé)
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
    });
  } catch (e: any) {
    console.error("PAIRING_PENDING_ERR", e);
    return NextResponse.json<Err>({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
      }
