// lib/auth.ts
import { cookies } from "next/headers";
import crypto from "crypto";
import { userHasPaidAccess } from "@/lib/subscriptions";

type SessionPayload = {
  sub: string;           // phoneE164
  plan?: "CONTINU" | "PASS1MOIS";
  subscriptionID?: string;
  status?: string;       // ACTIVE | CANCELLED | ...
  iat?: number;          // seconds
  exp?: number;          // seconds
};

/** Décode et vérifie le cookie ob_session (HS256) */
export function getSessionPayload(): SessionPayload | null {
  const token = cookies().get("ob_session")?.value;
  if (!token) return null;

  const secret = process.env.DEV_OTP_SECRET || "dev_secret";
  try {
    const [h, b, s] = token.split(".");
    if (!h || !b || !s) return null;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${h}.${b}`)
      .digest("base64url");

    if (expected !== s) return null;

    const payload = JSON.parse(Buffer.from(b, "base64url").toString()) as SessionPayload;

    if (!payload?.exp || Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Raccourci : renvoie le phoneE164 de session ou null */
export function getSessionPhone(): string | null {
  return getSessionPayload()?.sub ?? null;
}

/** Supprime le cookie de session (si tu veux forcer un re-login) */
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
 * Vérifie l’accès payant :
 * - session valide
 * - et abonnement actif OU annulé mais encore dans la période en cours
 */
export async function assertPaidAccess(): Promise<{ ok: boolean; phone?: string }> {
  const phone = getSessionPhone();
  if (!phone) return { ok: false };

  const ok = await userHasPaidAccess(phone);
  if (!ok) return { ok: false };

  return { ok: true, phone };
}
