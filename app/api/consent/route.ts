// app/api/consent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type UserLite = {
  id: string;
  phoneE164: string | null;
  consentAt: Date | null;
};

/**
 * 1. À partir d'un deviceId, retrouver le user unique auquel ce device est rattaché.
 *    Modèle mental : "Donne-moi le device qui a ce deviceId, et remonte-moi son user."
 */
async function findUserFromDeviceId(deviceId: string): Promise<UserLite | null> {
  if (!deviceId) return null;

  const device = await prisma.device.findUnique({
    where: { deviceId }, // deviceId est UNIQUE dans la table Device
    include: {
      user: {
        select: {
          id: true,
          phoneE164: true,
          consentAt: true,
        },
      },
    },
  });

  if (!device?.user) return null;
  return device.user;
}

/**
 * 2. Route POST /api/consent
 *    - Pas de session, pas de SESSION_SECRET.
 *    - Uniquement deviceId -> user -> consentAt.
 */
export async function POST(req: NextRequest) {
  try {
    const deviceId = req.headers.get("x-ob-device-id") ?? "";

    if (!deviceId) {
      // Appel invalide : le client n'a pas fourni d'identifiant de device
      return NextResponse.json(
        { ok: false, error: "MISSING_DEVICE_ID" },
        { status: 400 }
      );
    }

    const user = await findUserFromDeviceId(deviceId);

    if (!user) {
      // Aucun user rattaché à ce deviceId : soit device inconnu, soit non appairé
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND_FOR_DEVICE" },
        { status: 401 }
      );
    }

    // 2.a. Consentement déjà existant → idempotent
    if (user.consentAt) {
      const iso = user.consentAt.toISOString();
      return NextResponse.json(
        {
          ok: true,
          consentAt: iso,
          user: {
            id: user.id,
            phoneE164: user.phoneE164,
            consentAt: iso,
          },
        },
        { status: 200 }
      );
    }

    // 2.b. Premier consentement : on enregistre maintenant
    const now = new Date();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { consentAt: now },
      select: {
        id: true,
        phoneE164: true,
        consentAt: true,
      },
    });

    const iso = updated.consentAt?.toISOString() ?? now.toISOString();

    return NextResponse.json(
      {
        ok: true,
        consentAt: iso,
        user: {
          id: updated.id,
          phoneE164: updated.phoneE164,
          consentAt: iso,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur enregistrement consentement", error);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
