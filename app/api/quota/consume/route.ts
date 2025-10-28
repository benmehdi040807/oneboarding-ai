// app/api/quota/consume/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

const COOKIE = "ob_quota_v1";
const LIMIT = 3;
const TZ = "Africa/Casablanca";

/** yyyy-mm-dd en Africa/Casablanca */
function casablancaStamp(d = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

function readCookie(req: NextRequest) {
  try {
    const raw = req.cookies.get(COOKIE)?.value || "";
    if (!raw) return null;
    return JSON.parse(raw) as { stamp: string; used: number };
  } catch {
    return null;
  }
}

function makeCookie(val: { stamp: string; used: number }) {
  return {
    name: COOKIE,
    value: JSON.stringify(val),
    httpOnly: true,
    sameSite: "lax" as const, // ← corrige la casse ("lax")
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 24h (optionnel)
  };
}

/** TODO(Phase 2): vrai check abonné (DB PayPal ↔ userId) */
function isSubscriber(_req: NextRequest): boolean {
  // Bypass provisoire : lis un cookie booléen si tu en as un, sinon false.
  // Ex: return req.cookies.get("ob_is_sub")?.value === "1";
  return false;
}

export async function POST(req: NextRequest) {
  // Abonné = illimité
  if (isSubscriber(req)) {
    return NextResponse.json({ ok: true, bypass: true });
  }

  const today = casablancaStamp();
  let state = readCookie(req) || { stamp: today, used: 0 };
  if (state.stamp !== today) state = { stamp: today, used: 0 };

  if (state.used >= LIMIT) {
    const res = NextResponse.json({ ok: false, code: "LIMIT_REACHED", stamp: today });
    res.cookies.set(makeCookie(state)); // ← objet ResponseCookie
    return res;
  }

  state.used += 1;
  const remaining = Math.max(0, LIMIT - state.used);
  const res = NextResponse.json({ ok: true, used: state.used, remaining, stamp: today });
  res.cookies.set(makeCookie(state)); // ← objet ResponseCookie
  return res;
      }
