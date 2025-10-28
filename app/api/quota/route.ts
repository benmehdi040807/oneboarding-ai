// app/api/quota/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

const COOKIE = "ob_quota_v1"; // cookie HTTP-only (source de vérité par navigateur)
const LIMIT = 3;
const TZ = "Africa/Casablanca";

/** yyyy-mm-dd en Africa/Casablanca */
function casablancaStamp(d = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  });
  return fmt.format(d); // "YYYY-MM-DD"
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
    sameSite: "Lax" as const,
    secure: true,
    path: "/",
    // Pas d'expiration fixe : on le remet à jour à chaque requête
  };
}

export async function GET(req: NextRequest) {
  const today = casablancaStamp();
  let state = readCookie(req) || { stamp: today, used: 0 };

  // Reset si changement de jour (dans TZ Casablanca)
  if (state.stamp !== today) state = { stamp: today, used: 0 };

  const remaining = Math.max(0, LIMIT - state.used);
  const res = NextResponse.json({
    ok: true,
    limit: LIMIT,
    used: state.used,
    remaining,
    stamp: state.stamp,
    tz: TZ,
  });
  res.cookies.set(makeCookie(state));
  return res;
}
