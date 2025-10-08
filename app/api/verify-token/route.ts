// app/api/verify-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

// ---- Helpers ----
function b64url(input: Buffer | string) {
  return Buffer
    .from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

function timingSafeEq(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

function sign(payload: string, secret: string) {
  return b64url(crypto.createHmac("sha256", secret).update(payload).digest());
}

// Expected token format: "<phoneE164>.<iatMs>.<sigB64url>"
function parse(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [phone, iatStr, sig] = parts;
  const iat = Number(iatStr);
  if (!phone || !iat || !Number.isFinite(iat)) return null;
  return { phone, iat, sig };
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let token: string | undefined;

    if (authHeader?.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    } else {
      const body = await req.json().catch(() => ({}));
      token = body?.token;
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json({ ok: false, error: "NO_TOKEN" }, { status: 400 });
    }

    const parsed = parse(token);
    if (!parsed) {
      return NextResponse.json({ ok: false, error: "BAD_FORMAT" }, { status: 400 });
    }

    const secret = process.env.DEV_OTP_SECRET || "";
    if (!secret) {
      return NextResponse.json({ ok: false, error: "SERVER_SECRET_MISSING" }, { status: 500 });
    }

    const payload = `${parsed.phone}.${parsed.iat}`;
    const expectedSig = sign(payload, secret);

    if (!timingSafeEq(parsed.sig, expectedSig)) {
      return NextResponse.json({ ok: false, error: "BAD_SIGNATURE" }, { status: 401 });
    }

    // (Option) fenêtre de validité : ex. 30 jours
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
    const age = Date.now() - parsed.iat;
    if (age < 0 || age > MAX_AGE_MS) {
      return NextResponse.json({ ok: false, error: "TOKEN_EXPIRED" }, { status: 401 });
    }

    // OK
    return NextResponse.json({
      ok: true,
      sub: parsed.phone,
      iat: parsed.iat,
      ageMs: age,
      expiresInMs: Math.max(0, MAX_AGE_MS - age),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
