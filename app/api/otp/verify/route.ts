// app/api/otp/verify/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

const SECRET = process.env.DEV_OTP_SECRET || "change_me_dev_secret";
const DEV_STATELESS_OTP = process.env.DEV_STATELESS_OTP === "1"; // autorise 123456 en dev

function b64urlToBuf(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

function verifyToken(token: string) {
  const [h, b, s] = token.split(".");
  if (!h || !b || !s) return null;
  const expect = crypto.createHmac("sha256", SECRET).update(`${h}.${b}`).digest("base64");
  const expectUrl = expect.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  if (expectUrl !== s) return null;
  try {
    const payload = JSON.parse(b64urlToBuf(b).toString("utf8"));
    return payload as { p: string; c: string; exp: number };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { phoneE164, code, otpToken } = await req.json();

    if (typeof phoneE164 !== "string" || typeof code !== "string") {
      return NextResponse.json({ ok: false, error: "BAD_INPUT" }, { status: 400 });
    }

    // Fallback dev: accepte 123456 si activé
    if (DEV_STATELESS_OTP && code === "123456") {
      return NextResponse.json({ ok: true, dev: true });
    }

    if (typeof otpToken !== "string" || otpToken.length < 20) {
      return NextResponse.json({ ok: false, error: "NO_TOKEN" }, { status: 400 });
    }

    const payload = verifyToken(otpToken);
    if (!payload) {
      return NextResponse.json({ ok: false, error: "BAD_TOKEN" }, { status: 400 });
    }
    if (Date.now() > payload.exp) {
      return NextResponse.json({ ok: false, error: "EXPIRED" }, { status: 400 });
    }
    if (payload.p !== phoneE164) {
      return NextResponse.json({ ok: false, error: "PHONE_MISMATCH" }, { status: 400 });
    }
    if (payload.c !== code) {
      return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("OTP_VERIFY_ERR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
