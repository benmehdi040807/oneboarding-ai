// app/api/pairing/confirm/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ====================== Helpers généraux ====================== */

function getMaxDevices(): number {
  const v = process.env.MAX_DEVICES ?? process.env.NEXT_PUBLIC_MAX_DEVICES ?? "3";
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

function pepper(): string {
  const p = process.env.PAIRING_PEPPER || "";
  if (!p) throw new Error("PAIRING_PEPPER missing");
  return p;
}

// ⚠️ Doit matcher EXACTEMENT la convention de /pairing/start
function hashCode(code: string, salt: string): string {
  const h = crypto.createHash("sha256");
  h.update(pepper() + "::" + salt + "::" + code);
  return h.digest("hex");
}

// Cohérence avec /api/pay/start et /api/pairing/start
function isDeviceId(d?: string): d is string {
  return typeof d === "string" && d.trim().length >= 8;
}

// Même helper que dans /api/pay/return
function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/* =========================== Types ============================ */

type Req = {
  challengeId: string;
  code: string;
  // optionnel : révocation volontaire explicite (même si slots non pleins)
  revokeDeviceId?: string;
};

type Ok =
  | {
      ok: true;
      authorized: true;
      userId: string;
      newDeviceId: string;
      revokedDeviceId?: string;
    }
  | {
      ok: true;
      authorized: false;
      error:
        | "SLOTS_FULL"
        | "INVALID_CODE"
        | "EXPIRED"
        | "NO_CHALLENGE"
        | "REVOKE_NOT_FOUND";
      attemptsLeft?: number;
    };

type Err = { ok: false; error: string };

/* ============================ Route =========================== */

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Req;
    const { challengeId, code, revokeDeviceId } = body;

    if (!challengeId || typeof code !== "string") {
      return NextResponse.json<Err>(
        { ok: false, error: "BAD_REQUEST" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Si un revokeDeviceId est fourni mais manifestement invalide
    if (revokeDeviceId && !isDeviceId(revokeDeviceId)) {
      return NextResponse.json<Ok>(
        { ok: true, authorized: false, error: "REVOKE_NOT_FOUND" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const challenge = await prisma.devicePairingChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge || challenge.status !== "PENDING") {
      return NextResponse.json<Ok>(
        { ok: true, authorized: false, error: "NO_CHALLENGE" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const now = new Date();

    if (challenge.expiresAt <= now || challenge.attemptsLeft <= 0) {
      await prisma.devicePairingChallenge.update({
        where: { id: challenge.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json<Ok>(
        { ok: true, authorized: false, error: "EXPIRED" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Vérification du code
    const computed = hashCode(code, challenge.codeSalt);
    if (computed !== challenge.codeHash) {
      const updated = await prisma.devicePairingChallenge.update({
        where: { id: challenge.id },
        data: { attemptsLeft: { decrement: 1 } },
      });

      return NextResponse.json<Ok>(
        {
          ok: true,
          authorized: false,
          error: "INVALID_CODE",
          attemptsLeft: Math.max(0, updated.attemptsLeft),
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Code correct → autoriser le newDeviceId
    const userId = challenge.userId;
    const newDeviceId = challenge.newDeviceId;

    const activeCount = await prisma.device.count({
      where: { userId, authorized: true, revokedAt: null },
    });

    const MAX_SLOTS = getMaxDevices();

    // Révocation volontaire si demandée
    let revokedDeviceId: string | undefined;
    if (revokeDeviceId) {
      const dev = await prisma.device.findFirst({
        where: {
          userId,
          deviceId: revokeDeviceId,
          authorized: true,
          revokedAt: null,
        },
      });

      if (!dev) {
        return NextResponse.json<Ok>(
          { ok: true, authorized: false, error: "REVOKE_NOT_FOUND" },
          { headers: { "Cache-Control": "no-store" } }
        );
      }

      await prisma.device.update({
        where: { id: dev.id },
        data: { authorized: false, revokedAt: now },
      });

      revokedDeviceId = revokeDeviceId;
    } else if (activeCount >= MAX_SLOTS) {
      // Slots pleins et aucune révocation fournie
      return NextResponse.json<Ok>(
        { ok: true, authorized: false, error: "SLOTS_FULL" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Upsert du nouvel appareil
    await prisma.device.upsert({
      where: { userId_deviceId: { userId, deviceId: newDeviceId } },
      update: {
        authorized: true,
        revokedAt: null,
        // On ne touche PAS à firstAuthorizedAt ni isFounder ici
      },
      create: {
        userId,
        deviceId: newDeviceId,
        authorized: true,
        firstAuthorizedAt: now,
        isFounder: false, // ✅ un device de pairing n’est jamais fondateur
      },
    });

    // Clôture du challenge + hygiène
    await prisma.devicePairingChallenge.update({
      where: { id: challenge.id },
      data: {
        status: "APPROVED",
        approvedAt: now,
        encCode: Buffer.from([]),
        encIv: Buffer.from([]),
        encTag: Buffer.from([]),
      },
    });

    // ======================= SESSION + COOKIE =======================
    //
    // On crée une session 30 jours pour CE device appairé,
    // exactement comme dans /api/pay/return pour le fondateur.
    //
    const EXPIRE_AFTER_DAYS = 30;
    const sessionExpiresAt = addDays(now, EXPIRE_AFTER_DAYS);

    const session = await prisma.session.create({
      data: {
        userId,
        deviceId: newDeviceId,
        expiresAt: sessionExpiresAt,
        revokedAt: null,
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    const res = NextResponse.json<Ok>(
      {
        ok: true,
        authorized: true,
        userId,
        newDeviceId,
        ...(revokedDeviceId ? { revokedDeviceId } : {}),
      },
      { headers: { "Cache-Control": "no-store" } }
    );

    // Cookie de session, identique à celui de /api/pay/return
    res.cookies.set("ob_session", session.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    return res;
  } catch (e: any) {
    console.error("PAIRING_CONFIRM_ERR", e);
    return NextResponse.json<Err>(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
        }
