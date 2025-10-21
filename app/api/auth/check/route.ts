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
  // Info indicative pour l’UI / debug
  last: null | {
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
    paypalId: string | null;
  };
};

type Err = { ok: false; error: string };

// Récupère MAX_DEVICES depuis env serveur OU public, avec fallback 3
function getMaxDevices(): number {
  const v =
    process.env.MAX_DEVICES ??
    process.env.NEXT_PUBLIC_MAX_DEVICES ??
    "3";
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      phone?: string;
      deviceId?: string;
    };

    const phone = (body.phone || "").trim();
    const deviceId =
      typeof body.deviceId === "string" ? body.deviceId.trim() : undefined;

    // Validation minimale (le front a déjà validé en E.164)
    if (!phone || !phone.startsWith("+") || phone.length < 6) {
      return NextResponse.json<Err>(
        { ok: false, error: "INVALID_PHONE" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const MAX_DEVICES = getMaxDevices();

    // 1) Trouver l’utilisateur par numéro
    const user = await prisma.user.findUnique({
      where: { phoneE164: phone },
      select: { id: true, phoneE164: true },
    });

    // 2) Si pas d’utilisateur → non-membre (mais requête considérée ok)
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
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // 3) Accès payant actif ?
    const planActive = await userHasPaidAccess(phone);

    // 4) État des appareils (autorisés non révoqués)
    const authedDevices = await prisma.device.findMany({
      where: { userId: user.id, authorized: true, revokedAt: null },
      select: { deviceId: true },
    });

    const deviceCount = authedDevices.length;
    const hasAnyDevice = deviceCount > 0;
    const deviceKnown =
      !!deviceId && authedDevices.some((d) => d.deviceId === deviceId);

    // 5) Dernière souscription (pour affichage debug/UX)
    const lastSub = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        plan: true,
        status: true,
        currentPeriodEnd: true,
        paypalId: true,
      },
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
