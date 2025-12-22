// app/api/account/deactivate/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { STATUSES } from "@/lib/subscription-constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ok = { ok: true; message: string };
type Err = { ok: false; error: string };

// ---- lecture du cookie ob_session (session active côté client)
function readSessionCookie(req: NextRequest): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const found = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("ob_session="));
  if (!found) return null;
  const value = decodeURIComponent(found.split("=").slice(1).join("=")).trim();
  return value || null;
}

export async function POST(req: NextRequest) {
  try {
    // 1) Identifier la session appelante
    const sessionId = readSessionCookie(req);
    if (!sessionId) {
      return NextResponse.json<Err>(
        { ok: false, error: "NO_SESSION" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2) Charger la session et l'user
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, revokedAt: true, expiresAt: true },
    });

    if (!session) {
      return NextResponse.json<Err>(
        { ok: false, error: "SESSION_NOT_FOUND" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const now = new Date();
    const userId = session.userId;

    // 3) Dernier accès payé (Orders v2) => désactivation immédiate souveraine
    const lastSub = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (lastSub) {
      await prisma.subscription
        .update({
          where: { id: lastSub.id },
          data: {
            status: STATUSES.CANCELLED, // ✅ constant
            cancelledAt: now,           // ✅ marque décision humaine
            cancelAtPeriodEnd: false,
            currentPeriodEnd: now,      // ✅ coupe l'accès immédiatement
          },
        })
        .catch(() => {});
    }

    // 4) Révoquer tous les devices actifs
    await prisma.device
      .updateMany({
        where: { userId, authorized: true, revokedAt: null },
        data: { authorized: false, revokedAt: now },
      })
      .catch(() => {});

    // 5) Révoquer toutes les sessions
    await prisma.session
      .updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      })
      .catch(() => {});

    // 6) Réponse + suppression du cookie ob_session
    const res = NextResponse.json<Ok>(
      {
        ok: true,
        message: "Espace désactivé. L’accès a été coupé et tous les appareils ont été révoqués.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );

    res.cookies.set("ob_session", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 0,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json<Err>(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
