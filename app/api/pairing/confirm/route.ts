// app/api/pairing/confirm/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_SLOTS = parseInt(process.env.MAX_DEVICES || "3", 10);

function pepper(): string {
  const p = process.env.PAIRING_PEPPER || "";
  if (!p) throw new Error("PAIRING_PEPPER missing");
  return p;
}

function hashCode(code: string, salt: string): string {
  const h = crypto.createHash("sha256");
  h.update(pepper());
  h.update(salt);
  h.update(code);
  return h.digest("hex");
}

type Req = {
  challengeId: string;
  code: string;
  // optionnel : permet à l'utilisateur de révoquer explicitement un appareil même si les slots ne sont pas pleins
  revokeDeviceId?: string;
};

type Ok =
  | { ok: true; authorized: true; userId: string; newDeviceId: string; revokedDeviceId?: string }
  | { ok: true; authorized: false; error: "SLOTS_FULL" | "INVALID_CODE" | "EXPIRED" | "NO_CHALLENGE" | "REVOKE_NOT_FOUND" | "REVOKE_FORBIDDEN"; attemptsLeft?: number };

type Err = { ok: false; error: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Req;
    const { challengeId, code, revokeDeviceId } = body;

    if (!challengeId || typeof code !== "string") {
      return NextResponse.json<Err>({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const challenge = await prisma.devicePairingChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge || challenge.status !== "PENDING") {
      return NextResponse.json<Ok>({ ok: true, authorized: false, error: "NO_CHALLENGE" });
    }

    if (challenge.expiresAt <= new Date()) {
      // Expiration douce
      await prisma.devicePairingChallenge.update({
        where: { id: challenge.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json<Ok>({ ok: true, authorized: false, error: "EXPIRED" });
    }

    if (challenge.attemptsLeft <= 0) {
      await prisma.devicePairingChallenge.update({
        where: { id: challenge.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json<Ok>({ ok: true, authorized: false, error: "EXPIRED" });
    }

    // Vérification
    const computed = hashCode(code, challenge.codeSalt);
    if (computed !== challenge.codeHash) {
      const updated = await prisma.devicePairingChallenge.update({
        where: { id: challenge.id },
        data: {
          attemptsLeft: { decrement: 1 },
        },
      });
      return NextResponse.json<Ok>({
        ok: true,
        authorized: false,
        error: "INVALID_CODE",
        attemptsLeft: Math.max(0, updated.attemptsLeft),
      });
    }

    // Code correct → on va autoriser le newDeviceId
    const userId = challenge.userId;
    const newDeviceId = challenge.newDeviceId;

    // Comptage des slots actuels
    const activeCount = await prisma.device.count({
      where: { userId, authorized: true, revokedAt: null },
    });

    // Révocation optionnelle (toujours autorisée si l'appareil appartient au user)
    let revokedDeviceId: string | undefined = undefined;
    if (revokeDeviceId) {
      const dev = await prisma.device.findFirst({ where: { userId, deviceId: revokeDeviceId, revokedAt: null } });
      if (!dev) {
        return NextResponse.json<Ok>({ ok: true, authorized: false, error: "REVOKE_NOT_FOUND" });
      }
      // Interdiction de révoquer un device d'un autre user (par construction du where)
      await prisma.device.update({
        where: { id: dev.id },
        data: { authorized: false, revokedAt: new Date() },
      });
      revokedDeviceId = revokeDeviceId;
    } else if (activeCount >= MAX_SLOTS) {
      // Slots pleins et aucune révocation fournie
      return NextResponse.json<Ok>({ ok: true, authorized: false, error: "SLOTS_FULL" });
    }

    // Upsert du nouvel appareil
    await prisma.device.upsert({
      where: { userId_deviceId: { userId, deviceId: newDeviceId } },
      update: { authorized: true, revokedAt: null, firstAuthorizedAt: { set: undefined } },
      create: {
        userId,
        deviceId: newDeviceId,
        authorized: true,
        firstAuthorizedAt: new Date(),
      },
    });

    // Clôture du challenge
    await prisma.devicePairingChallenge.update({
      where: { id: challenge.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        // approvedByDeviceId: (optionnel) — non renseigné côté "new device"
      },
    });

    return NextResponse.json<Ok>({
      ok: true,
      authorized: true,
      userId,
      newDeviceId,
      ...(revokedDeviceId ? { revokedDeviceId } : {}),
    });
  } catch (e: any) {
    console.error("PAIRING_CONFIRM_ERR", e);
    return NextResponse.json<Err>({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
                                               }
