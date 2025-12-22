// lib/auth.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { userHasPaidAccess } from "@/lib/subscriptions";
import type { User } from "@prisma/client";

type SessionContext = {
  sessionId: string;
  user: User;
  deviceId?: string | null;
  expiresAt: Date;
};

export function getSessionId(): string | null {
  try {
    return cookies().get("ob_session")?.value ?? null;
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  cookies().set("ob_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

/**
 * Charge la session DB + user, et vérifie :
 * - existe
 * - non révoquée
 * - non expirée
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const sessionId = getSessionId();
  if (!sessionId) return null;

  const now = new Date();

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) return null;
    if (session.revokedAt) return null;
    if (!session.expiresAt || session.expiresAt <= now) return null;

    return {
      sessionId,
      user: session.user,
      deviceId: session.deviceId ?? null,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
}

/** Raccourci : renvoie le phoneE164 de session ou null */
export async function getSessionPhone(): Promise<string | null> {
  const ctx = await getSessionContext();
  return ctx?.user?.phoneE164 ?? null;
}

/**
 * Vérifie l’accès payant :
 * - session valide
 * - ET droit d’accès payé (souverain) via userHasPaidAccess
 */
export async function assertPaidAccess(): Promise<{ ok: boolean; phone?: string }> {
  const ctx = await getSessionContext();
  if (!ctx) return { ok: false };

  const phone = ctx.user.phoneE164;
  const ok = await userHasPaidAccess(phone);
  if (!ok) return { ok: false };

  return { ok: true, phone };
}

/**
 * Récupère l'utilisateur courant à partir de la session DB.
 */
export async function getCurrentUser(): Promise<User | null> {
  const ctx = await getSessionContext();
  return ctx?.user ?? null;
}
