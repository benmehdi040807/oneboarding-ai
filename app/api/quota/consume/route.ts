// app/api/quota/route.ts
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
    sameSite: "lax" as const, // ← casse corrigée
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 24h (optionnel mais pratique)
  };
}

/** TODO(Phase 2): vrai check abonné */
function isSubscriber(_req: NextRequest): boolean {
  return false;
}

// GET: renvoie l’état courant (sans consommer de quota)
export async function GET(req: NextRequest) {
  if (isSubscriber(req)) {
    return NextResponse.json({
      ok: true,
      bypass: true,
      used: 0,
      remaining: Infinity,
      stamp: casablancaStamp(),
      tz: TZ,
    });
  }

  const today = casablancaStamp();
  let state = readCookie(req) || { stamp: today, used: 0 };
  if (state.stamp !== today) state = { stamp: today, used: 0 };

  const remaining = Math.max(0, LIMIT - state.used);
  const res = NextResponse.json({
    ok: true,
    used: state.used,
    remaining,
    stamp: today,
    tz: TZ,
  });
  res.cookies.set(makeCookie(state)); // ← objet ResponseCookie, OK
  return res;
}
