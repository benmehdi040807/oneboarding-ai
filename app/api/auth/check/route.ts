// app/api/auth/check/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

//
// Petit utilitaire pour savoir combien d'appareils max on autorise
//
function getMaxDevices(): number {
  const v = process.env.MAX_DEVICES ?? process.env.NEXT_PUBLIC_MAX_DEVICES ?? "3";
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

type PlanCode = "ONE_DAY" | "ONE_MONTH" | "ONE_YEAR" | "ONE_LIFE";

function normalizePlan(planRaw: string | null | undefined): PlanCode {
  const p = String(planRaw || "").trim();

  // ✅ Nouveau pricing (recommandé)
  if (p === "ONE_DAY" || p === "one-day" || p === "DAY" || p === "day") return "ONE_DAY";
  if (p === "ONE_MONTH" || p === "one-month" || p === "MONTH" || p === "month") return "ONE_MONTH";
  if (p === "ONE_YEAR" || p === "one-year" || p === "YEAR" || p === "year") return "ONE_YEAR";
  if (p === "ONE_LIFE" || p === "one-life" || p === "LIFE" || p === "life") return "ONE_LIFE";

  // Fallback safe (si sub.plan est absent/inconnu mais que sub est ACTIVE + date future)
  // → on préfère ONE_DAY comme "standard"
  return "ONE_DAY";
}

//
// Détermine si une souscription donne droit à l'accès payant "espace actif".
//
// 🔒 RÈGLE UNIQUE (tous plans confondus) :
//  - status === "ACTIVE"
//  - currentPeriodEnd non nul ET strictement dans le futur
//
function evalPaidAccess(
  sub:
    | {
        plan: string;
        status: string;
        currentPeriodEnd: Date | null;
      }
    | null
): {
  spaceActive: boolean;
  plan: PlanCode | null;
} {
  if (!sub) return { spaceActive: false, plan: null };

  const plan = normalizePlan(sub.plan);

  // Seules les souscriptions marquées ACTIVE peuvent ouvrir l'espace
  if (sub.status !== "ACTIVE") {
    return { spaceActive: false, plan };
  }

  // Par sécurité : sans date d'échéance, aucun accès
  if (!sub.currentPeriodEnd) {
    return { spaceActive: false, plan };
  }

  const now = new Date();
  if (sub.currentPeriodEnd.getTime() <= now.getTime()) {
    // Période écoulée → plus d'accès
    return { spaceActive: false, plan };
  }

  // ACTIVE + date future => accès OK
  return { spaceActive: true, plan };
}

type Ok = {
  ok: true;
  phone: string;
  consentAt: string | null; // ISO string ou null
  spaceActive: boolean;
  plan: PlanCode | null;

  devices: {
    deviceCount: number; // combien d'appareils autorisés actifs
    deviceKnown: boolean; // est-ce que l'appareil appelant est déjà autorisé ?
    maxDevices: number; // limite actuelle (ex: 3)
  };

  // pour debug / affichage interne si tu veux
  lastSubscription: {
    status: string;
    currentPeriodEnd: string | null;
    paypalId: string | null;
  } | null;
};

type Err = { ok: false; error: string };

// On utilise GET parce qu'on ne modifie rien : on ne fait que lire l'état de l'espace.
export async function GET(req: NextRequest) {
  try {
    // 1. Récup cookie de session
    const cookieHeader = req.headers.get("cookie") || "";
    const obSessionMatch = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("ob_session="));

    if (!obSessionMatch) {
      return NextResponse.json<Err>(
        { ok: false, error: "NO_SESSION" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const obSession = decodeURIComponent(obSessionMatch.split("=").slice(1).join("=")).trim();

    if (!obSession) {
      return NextResponse.json<Err>(
        { ok: false, error: "EMPTY_SESSION" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2. On charge la session en base
    const session = await prisma.session.findUnique({
      where: { id: obSession },
      select: {
        id: true,
        userId: true,
        deviceId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!session) {
      return NextResponse.json<Err>(
        { ok: false, error: "SESSION_NOT_FOUND" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // session révoquée ?
    if (session.revokedAt) {
      return NextResponse.json<Err>(
        { ok: false, error: "SESSION_REVOKED" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // session expirée ?
    const now = new Date();
    if (session.expiresAt.getTime() <= now.getTime()) {
      return NextResponse.json<Err>(
        { ok: false, error: "SESSION_EXPIRED" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 3. Charger l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        phoneE164: true,
        // consentAt: true, // quand tu ajoutes la colonne, tu l'actives ici
      },
    });

    if (!user) {
      return NextResponse.json<Err>(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 4. Récupérer la dernière souscription pour calculer l'accès
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

    const { spaceActive, plan } = evalPaidAccess(
      lastSub
        ? {
            plan: lastSub.plan,
            status: lastSub.status,
            currentPeriodEnd: lastSub.currentPeriodEnd,
          }
        : null
    );

    // 5. Gérer les devices actifs
    const authedDevices = await prisma.device.findMany({
      where: {
        userId: user.id,
        authorized: true,
        revokedAt: null,
      },
      select: { deviceId: true },
    });

    const maxDevices = getMaxDevices();
    const deviceCount = authedDevices.length;

    const callerDeviceId = req.headers.get("x-ob-device-id") || "";
    const deviceKnown =
      !!callerDeviceId && authedDevices.some((d) => d.deviceId === callerDeviceId);

    // 6. consentAt (pas encore en DB)
    const consentAtISO: string | null = null;

    // 7. Construire la réponse pour l'UI
    const payload: Ok = {
      ok: true,
      phone: user.phoneE164,
      consentAt: consentAtISO,
      spaceActive,
      plan,
      devices: {
        deviceCount,
        deviceKnown,
        maxDevices,
      },
      lastSubscription: lastSub
        ? {
            status: lastSub.status,
            currentPeriodEnd: lastSub.currentPeriodEnd
              ? lastSub.currentPeriodEnd.toISOString()
              : null,
            paypalId: lastSub.paypalId ?? null,
          }
        : null,
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json<Err>(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
