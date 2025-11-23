// app/api/consent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const deviceId = req.headers.get("x-ob-device-id") ?? "";

    if (!deviceId) {
      // Client cassé : pas d'identifiant technique → on ne peut rien rattacher
      return NextResponse.json(
        { ok: false, error: "MISSING_DEVICE_ID" },
        { status: 400 }
      );
    }

    // deviceId -> Device -> User
    const device = await prisma.device.findFirst({
      where: { deviceId },
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

    const user = device?.user;

    if (!user) {
      // Non-membre ou device jamais appairé → aucun consentement en DB
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND_FOR_DEVICE" },
        { status: 401 }
      );
    }

    // Idempotence : si consentAt existe déjà en DB, on renvoie tel quel
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

    // Premier consentement : on horodate maintenant
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

    const iso =
      updated.consentAt?.toISOString() ?? now.toISOString();

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
  } catch (err) {
    console.error("Consent error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
