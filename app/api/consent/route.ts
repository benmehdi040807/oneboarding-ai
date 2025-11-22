import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionPhone } from "@/lib/auth";

type UserLite = {
  id: string;
  phoneE164: string | null;
  consentAt: Date | null;
};

// 1) Chemin session : cookie ob_session -> phoneE164 -> user
async function findUserFromSession(): Promise<UserLite | null> {
  const phone = getSessionPhone();
  if (!phone) return null;

  const user = await prisma.user.findUnique({
    where: { phoneE164: phone },
    select: { id: true, phoneE164: true, consentAt: true },
  });

  return user;
}

// 2) Chemin device : deviceId -> user (via relation devices[])
async function findUserFromDeviceId(deviceId: string): Promise<UserLite | null> {
  if (!deviceId) return null;

  const user = await prisma.user.findFirst({
    where: {
      devices: {
        some: { deviceId },
      },
    },
    select: { id: true, phoneE164: true, consentAt: true },
  });

  return user;
}

// 3) Route POST /api/consent
export async function POST(req: NextRequest) {
  try {
    const deviceId = req.headers.get("x-ob-device-id") ?? "";

    // a) on tente d'abord par la session
    let user = await findUserFromSession();

    // b) sinon, on tente via le device (pairing réussi)
    if (!user && deviceId) {
      user = await findUserFromDeviceId(deviceId);
    }

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié" },
        { status: 401 }
      );
    }

    // Si déjà consenti : on renvoie tel quel (idempotent)
    if (user.consentAt) {
      return NextResponse.json(
        {
          ok: true,
          user: {
            id: user.id,
            phoneE164: user.phoneE164,
            consentAt: user.consentAt,
          },
        },
        { status: 200 }
      );
    }

    const now = new Date();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { consentAt: now },
      select: { id: true, phoneE164: true, consentAt: true },
    });

    return NextResponse.json(
      {
        ok: true,
        user: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur enregistrement consentement", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de l’enregistrement du consentement" },
      { status: 500 }
    );
  }
}
