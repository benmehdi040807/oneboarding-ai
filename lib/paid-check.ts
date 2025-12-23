// lib/paid-check.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hasPaidAccessFromSub } from "@/lib/subscriptions";

export type PaidContext = {
  userId: string;
  phoneE164: string;
  sessionId: string;
  deviceId: string | null;
};

export type PaidOptionalResult =
  | { ok: true; paid: true; ctx: PaidContext }
  | { ok: true; paid: false; ctx: null }
  | { ok: false; res: NextResponse };

/**
 * getPaidOptional(req)
 *
 * 🔹 Ne bloque jamais le free
 * 🔹 Retourne paid=true uniquement si :
 *    - session valide
 *    - subscription active côté DB
 */
export async function getPaidOptional(
  req: NextRequest
): Promise<PaidOptionalResult> {
  const now = new Date();

  const sessionId = req.cookies.get("ob_session")?.value ?? null;
  if (!sessionId) {
    return { ok: true, paid: false, ctx: null };
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (
    !session ||
    session.revokedAt ||
    !session.expiresAt ||
    session.expiresAt <= now ||
    !session.user
  ) {
    return { ok: true, paid: false, ctx: null };
  }

  // Dernière subscription = point de vérité unique
  const sub = await prisma.subscription.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      currentPeriodEnd: true,
      cancelledAt: true,
    },
  });

  const paid = hasPaidAccessFromSub(sub);
  if (!paid) return { ok: true, paid: false, ctx: null };

  return {
    ok: true,
    paid: true,
    ctx: {
      userId: session.userId,
      phoneE164: session.user.phoneE164,
      sessionId,
      deviceId: session.deviceId ?? null,
    },
  };
}
