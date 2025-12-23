// lib/require-paid.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hasPaidAccessFromSub } from "@/lib/subscriptions";

export type PaidContext = {
  userId: string;
  phoneE164: string;
  sessionId: string;
  deviceId: string | null;
};

export async function requirePaid(req: NextRequest): Promise<
  { ok: true; ctx: PaidContext } | { ok: false; res: NextResponse }
> {
  const now = new Date();

  const sessionId = req.cookies.get("ob_session")?.value ?? null;
  if (!sessionId) {
    return {
      ok: false,
      res: NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 }),
    };
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.revokedAt || !session.expiresAt || session.expiresAt <= now) {
    return {
      ok: false,
      res: NextResponse.json({ ok: false, error: "SESSION_INVALID" }, { status: 401 }),
    };
  }

  // Dernière subscription (pour check sans double logique)
  const sub = await prisma.subscription.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { status: true, currentPeriodEnd: true, cancelledAt: true },
  });

  const paid = hasPaidAccessFromSub(sub);
  if (!paid) {
    return {
      ok: false,
      res: NextResponse.json({ ok: false, error: "PAID_REQUIRED" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    ctx: {
      userId: session.userId,
      phoneE164: session.user.phoneE164,
      sessionId,
      deviceId: session.deviceId ?? null,
    },
  };
      }
