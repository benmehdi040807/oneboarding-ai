// lib/auth.ts
import { cookies } from "next/headers";
import crypto from "crypto";
import { userHasPaidAccess } from "@/lib/subscriptions";

type SessionPayload = {
  sub: string;           // phoneE164
  plan?: string;         // "CONTINU" | "PASS1MOIS"
  subscriptionID?: string;
  iat: number;
  exp: number;
};

function verifyJwtLike(token: string, secret: string): SessionPayload | null {
  try {
    const [h, b, s] = token.split(".");
    if (!h || !b || !s) return null;
    const sig = crypto.createHmac("sha256", secret).update(`${h}.${b}`).digest("base64url");
    if (sig !== s) return null;
    const payload = JSON.parse(Buffer.from(b, "base64url").toString());
    if (!payload?.exp || Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Récupère le phoneE164 depuis le cookie "ob_session" (ou null) */
export function getSessionPhone(): string | null {
  const c = cookies().get("ob_session")?.value;
  if (!c) return null;
  const secret = process.env.DEV_OTP_SECRET || "dev_secret";
  const p = verifyJwtLike(c, secret);
  return p?.sub ?? null;
}

/** Garde-fou : TRUE si l’utilisateur a accès “payé” (actif OU annulé mais pas encore arrivé à échéance) */
export async function assertPaidAccess(): Promise<{ ok: boolean; phone?: string }> {
  const phone = getSessionPhone();
  if (!phone) return { ok: false };
  const ok = await userHasPaidAccess(phone);
  return ok ? { ok: true, phone } : { ok: false };
}

/** Optionnel : invalider la session (déconnexion “propre”) */
export function clearSessionCookie() {
  cookies().set("ob_session", "", { path: "/", maxAge: 0 });
}
