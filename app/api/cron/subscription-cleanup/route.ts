// app/api/cron/subscription-cleanup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Petit endpoint de maintenance interne :
// - repère les subscriptions avec status = "ACTIVE"
//   mais currentPeriodEnd déjà dépassé
// - les passe en "EXPIRED" (et marque cancelAtPeriodEnd = true)
//
// 🔐 Tu peux protéger l'accès avec un header secret (CRON_SECRET)
//   défini dans les variables d'environnement Vercel.
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET || null;
    if (secret) {
      const header = req.headers.get("x-cron-secret");
      if (header !== secret) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const now = new Date();

    const result = await prisma.subscription.updateMany({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: {
          lte: now,
        },
      },
      data: {
        status: "EXPIRED",
        cancelAtPeriodEnd: true,
        // Si tu as bien le champ `cancelledAt` dans ton schema Prisma,
        // cette ligne est OK. Si Prisma râle, enlève-la simplement.
        cancelledAt: now,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        updated: result.count,
        at: now.toISOString(),
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[/api/cron/subscription-cleanup] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
