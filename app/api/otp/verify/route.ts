// app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // pas de 0/O/I/1
function codeFromInt(x: number, len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s = ALPHABET[x % ALPHABET.length] + s;
    x = Math.floor(x / ALPHABET.length);
  }
  return s;
}

function computeOtpForWindow(phone: string, windowIdx: number, secret: string) {
  const h = crypto.createHmac("sha256", secret).update(`${phone}:${windowIdx}`).digest();
  const n = ((h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3]) >>> 0;
  return codeFromInt(n, 6);
}

// comparaison constant-time
function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phoneE164 = String(body?.phoneE164 || "");
    const rawCode = String(body?.code || "");

    if (!phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }
    const code = rawCode.trim().toUpperCase();
    if (code.length < 6) {
      return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 400 });
    }

    const STATELESS = process.env.DEV_STATELESS_OTP === "1";
    if (!STATELESS) {
      return NextResponse.json({ ok: false, error: "DEV_STATELESS_OTP_OFF" }, { status: 500 });
    }

    const secret = process.env.DEV_OTP_SECRET || "dev-secret";
    const windowMs = 5 * 60 * 1000; // 5 minutes
    const nowIdx = Math.floor(Date.now() / windowMs);

    // Fenêtre courante ±1 → meilleure tolérance d’horloge
    const candidates = [
      computeOtpForWindow(phoneE164, nowIdx - 1, secret),
      computeOtpForWindow(phoneE164, nowIdx, secret),
      computeOtpForWindow(phoneE164, nowIdx + 1, secret),
    ];

    const match = candidates.some((c) => safeEqual(c, code));
    if (!match) {
      return NextResponse.json({ ok: false, error: "BAD_CODE" }, { status: 401 });
    }

    // Jeton signé (HMAC) simple et opaque pour le front
    const issuedAt = Date.now();
    const payload = `${phoneE164}.${issuedAt}`;
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    const token = `${payload}.${sig}`;

    return NextResponse.json({ ok: true, token });
  } catch {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
