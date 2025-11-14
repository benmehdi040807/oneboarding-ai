// app/api/pairing/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { userHasPaidAccess } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ok = {
  ok: true;
  challengeId: string;
  expiresAt: string;   // ISO
  attemptsLeft: number;
  alreadyPending: boolean;
  note: "CODE_VISIBLE_ON_AUTH_DEVICES";
};

type Err = { ok: false; error: string };

// ===== Helpers =====
function isE164(p?: string): p is string {
  return typeof p === "string" && p.startsWith("+") && p.length >= 6;
}

function isDeviceId(d?: string): d is string {
  return typeof d === "string" && d.trim().length >= 8;
}

function getMaxDevices(): number {
  const v = process.env.MAX_DEVICES ?? process.env.NEXT_PUBLIC_MAX_DEVICES ?? "3";
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

/** Génère un code 6 chiffres (000000–999999) en évitant 000000. */
function genCode6(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  const s = n.toString().padStart(6, "0");
  return s === "000000" ? "000123" : s;
}

/** Hachage SHA-256 avec pepper (env) + salt (aléatoire) */
function hashCode(code: string) {
  const pepper = process.env.PAIRING_PEPPER ?? "";
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.createHash("sha256");
  // ⚠️ Convention stable (confirm doit faire strictement pareil) :
  h.update(pepper + "::" + salt + "::" + code);
  const digest = h.digest("hex");
  return { salt, digest };
}

/** Chiffre le code avec AES-256-GCM (clé base64 PAIRING_ENC_KEY, 32 bytes) */
function encryptCode(code: string) {
  const b64 = process.env.PAIRING_ENC_KEY || "";
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("PAIRING_ENC_KEY must be a 32-byte base64 key");

  const iv = crypto.randomBytes(12); // 96-bit
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { enc, iv, tag };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      phoneE164?: string;
      newDeviceId?: string; // deviceId du nouvel appareil
    };

    const phoneE164 = body.phoneE164;
    const newDeviceId = (body.newDeviceId || "").trim();

    if (!isE164(phoneE164)) {
      return NextResponse.json<Err>(
        { ok: false, error: "BAD_PHONE" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!isDeviceId(newDeviceId)) {
      return NextResponse.json<Err>(
        { ok: false, error: "BAD_DEVICE_ID" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const MAX_DEVICES = getMaxDevices();

    // 1) user + accès actif
    const user = await prisma.user.findUnique({
      where: { phoneE164 },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json<Err>(
        { ok: false, error: "NO_USER" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const planActive = await userHasPaidAccess(phoneE164);
    if (!planActive) {
      return NextResponse.json<Err>(
        { ok: false, error: "NO_ACTIVE_PLAN" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2) devices autorisés (il faut au moins 1 pour afficher le code)
    const authedDevices = await prisma.device.findMany({
      where: { userId: user.id, authorized: true, revokedAt: null },
      select: { id: true, deviceId: true },
    });

    if (authedDevices.length === 0) {
      return NextResponse.json<Err>(
        { ok: false, error: "NO_AUTH_DEVICE" },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2b) Cet appareil est-il déjà autorisé ?
    const already = await prisma.device.findUnique({
      where: { userId_deviceId: { userId: user.id, deviceId: newDeviceId } },
      select: { authorized: true, revokedAt: true },
    });

    if (already?.authorized && !already.revokedAt) {
      return NextResponse.json<Err>(
        { ok: false, error: "DEVICE_ALREADY_AUTHORIZED" },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 3) slots disponibles ?
    if (authedDevices.length >= MAX_DEVICES) {
      return NextResponse.json<Err>(
        { ok: false, error: "SLOTS_FULL" },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 4) Challenge déjà en cours ?
    const now = new Date();
    const existing = await (prisma as any).devicePairingChallenge.findFirst({
      where: {
        userId: user.id,
        newDeviceId,
        status: "PENDING",
        expiresAt: { gt: now },
      },
      select: { id: true, expiresAt: true, attemptsLeft: true },
    });

    if (existing) {
      const payload: Ok = {
        ok: true,
        challengeId: existing.id,
        expiresAt: new Date(existing.expiresAt).toISOString(),
        attemptsLeft: existing.attemptsLeft ?? 5,
        alreadyPending: true,
        note: "CODE_VISIBLE_ON_AUTH_DEVICES",
      };
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // 5) Nouveau challenge
    const code = genCode6();
    const { salt, digest } = hashCode(code);
    const { enc, iv, tag } = encryptCode(code);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const attemptsLeft = 5;

    const created = await (prisma as any).devicePairingChallenge.create({
      data: {
        userId: user.id,
        newDeviceId,
        status: "PENDING",
        codeHash: digest,
        codeSalt: salt,
        encCode: enc,
        encIv: iv,
        encTag: tag,
        attemptsLeft,
        expiresAt,
        createdAt: now,
      },
      select: { id: true, expiresAt: true, attemptsLeft: true },
    });

    const payload: Ok = {
      ok: true,
      challengeId: created.id,
      expiresAt: new Date(created.expiresAt).toISOString(),
      attemptsLeft: created.attemptsLeft ?? attemptsLeft,
      alreadyPending: false,
      note: "CODE_VISIBLE_ON_AUTH_DEVICES",
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json<Err>(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
