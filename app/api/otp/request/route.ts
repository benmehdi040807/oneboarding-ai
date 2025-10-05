// app/api/otp/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // pas de 0/O/I/1
function codeFromInt(x: number, len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) { s = ALPHABET[x % ALPHABET.length] + s; x = Math.floor(x / ALPHABET.length); }
  return s;
}
function computeOtp(phone: string, windowMs: number, secret: string) {
  const t = Math.floor(Date.now() / windowMs);
  const h = crypto.createHmac("sha256", secret).update(`${phone}:${t}`).digest();
  // Prendre 4 octets et les transformer en int positif
  const n = ((h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3]) >>> 0;
  return codeFromInt(n, 6);
}

export async function POST(req: NextRequest) {
  try {
    const { phoneE164 } = await req.json();
    if (!phoneE164 || typeof phoneE164 !== "string" || !phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }

    const STATELESS = process.env.DEV_STATELESS_OTP === "1";
    if (!STATELESS) {
      return NextResponse.json({ ok: false, error: "DEV_STATELESS_OTP_OFF" }, { status: 500 });
    }

    const secret = process.env.DEV_OTP_SECRET || "dev-secret";
    const windowMs = 5 * 60 * 1000; // 5 minutes
    const code = computeOtp(phoneE164, windowMs, secret);

    console.log(`[DEV] OTP stateless vers ${phoneE164}: ${code}`);
    // Ici tu enverras via WhatsApp plus tard. Pour l’instant, on log.

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
