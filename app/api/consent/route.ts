// app/api/consent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionPhone } from "@/lib/auth";

type UserLite = {
  id: string;
  phoneE164: string | null;
  consentAt: Date | null;
};

async function findUserFromSession(): Promise<UserLite | null> {
  const phone = getSessionPhone();
  if (!phone) return null;

  const user = await prisma.user.findUnique({
    where: { phoneE164: phone },
    select: { id: true, phoneE164: true, consentAt: true },
  });

  return user ?? null;
}

async function findUserFromDeviceId(deviceId: string): Promise<UserLite | null> {
  const device = await prisma.device.findUnique({
    where: { deviceId },
    select: {
      user: { select: { id: true, phoneE164: true, consentAt: true } },
    },
  });

  return device?.user ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const deviceId = req.headers.get("x-ob-device-id") ?? undefined;

    // 1) D'abord via la session (cookie ob_session)
    let user = await findUserFromSession();

    // 2) Si pas de session valide, on tente via le device appairé
    if (!user && deviceId) {
      user = await findUserFromDeviceId(deviceId);
    }

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié" },
        { status: 401 }
      );
    }

    const now = new Date();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { consentAt: now },
      select: { id: true, phoneE164: true, consentAt: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("Erreur enregistrement consentement", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de l’enregistrement du consentement" },
      { status: 500 }
    );
  }
}
