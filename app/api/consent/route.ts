// app/api/consent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
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
