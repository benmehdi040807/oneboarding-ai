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
      error: "SLOTS_FULL" | "INVALID_CODE" | "EXPIRED" | "NO_CHALLENGE" | "REVOKE_NOT_FOUND";
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

    if (challenge.expiresAt <= new Date() || challenge.attemptsLeft <= 0) {
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
        where: { userId, deviceId: revokeDeviceId, authorized: true, revokedAt: null },
      });

      if (!dev) {
        return NextResponse.json<Ok>(
          { ok: true, authorized: false, error: "REVOKE_NOT_FOUND" },
          { headers: { "Cache-Control": "no-store" } }
        );
      }

      await prisma.device.update({
        where: { id: dev.id },
        data: { authorized: false, revokedAt: new Date() },
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
        // On ne touche PAS à firstAuthorizedAt ici pour garder l'historique fondateur
      },
      create: {
        userId,
        deviceId: newDeviceId,
        authorized: true,
        firstAuthorizedAt: new Date(),
      },
    });

    // Clôture du challenge + hygiène (on supprime l’affichage chiffré)
    await prisma.devicePairingChallenge.update({
      where: { id: challenge.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        encCode: Buffer.from([]),
        encIv: Buffer.from([]),
        encTag: Buffer.from([]),
      },
    });

    return NextResponse.json<Ok>(
      {
        ok: true,
        authorized: true,
        userId,
        newDeviceId,
        ...(revokedDeviceId ? { revokedDeviceId } : {}),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("PAIRING_CONFIRM_ERR", e);
    return NextResponse.json<Err>(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
        }
