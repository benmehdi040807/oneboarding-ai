// app/api/auth/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { userHasPaidAccess } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ok = {
  ok: true;
  phone?: string;
  planActive: boolean;
  devices: {
    hasAnyDevice: boolean;
    deviceKnown: boolean;
    deviceCount: number;
    maxDevices: number;
  };
  // Info purement indicative pour l’UI / debug
  last: null | {
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
    paypalId: string | null;
  };
};

type Err = { ok: false; error: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      phone?: string;
      deviceId?: string;
    };

    const phone = (body.phone || "").trim();
    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : undefined;

    // Validation minimale du téléphone (le front fait déjà la vraie validation)
    if (!phone || !phone.startsWith("+") || phone.length < 6) {
      // On renvoie une erreur explicite (le front affiche déjà un toast côté client)
      return NextResponse.json<Err>(
        { ok: false, error: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    const MAX_DEVICES = Number(process.env.MAX_DEVICES || 3);

    // 1) Trouver l’utilisateur par numéro
    const user = await prisma.user.findUnique({
      where: { phoneE164: phone },
      select: { id: true, phoneE164: true },
    });

    // 2) Si pas d’utilisateur → non-membre
    if (!user) {
      const payload: Ok = {
        ok: true,
        planActive: false,
        devices: {
          hasAnyDevice: false,
          deviceKnown: false,
          deviceCount: 0,
          maxDevices: MAX_DEVICES,
        },
        last: null,
      };
      return NextResponse.json(payload);
    }

    // 3) Accès payant actif ?
    const planActive = await userHasPaidAccess(phone);

    // 4) État des appareils
    const authedDevices = await prisma.device.findMany({
      where: { userId: user.id, authorized: true, revokedAt: null },
      select: { deviceId: true },
    });

    const deviceCount = authedDevices.length;
    const hasAnyDevice = deviceCount > 0;
    const deviceKnown = !!(deviceId && authedDevices.some((d) => d.deviceId === deviceId));

    // 5) Dernière souscription (facultatif pour l’UI)
    const lastSub = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { plan: true, status: true, currentPeriodEnd: true, paypalId: true },
    });

    const payload: Ok = {
      ok: true,
      phone: user.phoneE164,
      planActive,
      devices: {
        hasAnyDevice,
        deviceKnown,
        deviceCount,
        maxDevices: MAX_DEVICES,
      },
      last: lastSub
        ? {
            plan: lastSub.plan,
            status: lastSub.status,
            currentPeriodEnd: lastSub.currentPeriodEnd,
            paypalId: lastSub.paypalId,
          }
        : null,
    };

    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json<Err>(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
