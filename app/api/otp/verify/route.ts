// app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function codeFromInt(x: number, len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) { s = ALPHABET[x % ALPHABET.length] + s; x = Math.floor(x / ALPHABET.length); }
  return s;
}
function computeOtpAt(phone: string, windowIdx: number, windowMs: number, secret: string) {
  const h = crypto.createHmac("sha256", secret).update(`${phone}:${windowIdx}`).digest();
  const n = ((h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3]) >>> 0;
  return codeFromInt(n, 6);
}

export async function POST(req: NextRequest) {
  try {
    const { phoneE164, code } = await req.json();
    if (!phoneE164 || !code) {
      return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
    }

    const STATELESS = process.env.DEV_STATELESS_OTP === "1";
    if (!STATELESS) {
      return NextResponse.json({ ok: false, error: "DEV_STATELESS_OTP_OFF" }, { status: 500 });
    }

    const secret = process.env.DEV_OTP_SECRET || "dev-secret";
    const windowMs = 5 * 60 * 1000;
    const nowIdx = Math.floor(Date.now() / windowMs);

    // Tolérance d’une fenêtre (courante ou précédente) pour l’horloge
    const valid =
      computeOtpAt(phoneE164, nowIdx, windowMs, secret) === code ||
      computeOtpAt(phoneE164, nowIdx - 1, windowMs, secret) === code;

    if (!valid) return NextResponse.json({ ok: false, error: "BAD_CODE" }, { status: 400 });

    const token = Buffer.from(JSON.stringify({ sub: phoneE164, iat: Date.now() }), "utf8").toString("base64url");
    return NextResponse.json({ ok: true, token });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
