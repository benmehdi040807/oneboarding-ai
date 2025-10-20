// app/api/auth/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { userHasPaidAccess } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---- mêmes helpers que /api/verify-token ----
function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
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
function parseToken(token: string): { phone: string; iat: number; sig: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [phone, iatStr, sig] = parts;
  const iat = Number(iatStr);
  if (!phone || !Number.isFinite(iat) || !sig) return null;
  return { phone, iat, sig };
}

export async function POST(req: NextRequest) {
  try {
    // Token via Authorization: Bearer ... OU body { token }
    const auth = req.headers.get("authorization");
    let token: string | undefined;
    if (auth?.toLowerCase().startsWith("bearer ")) token = auth.slice(7).trim();
    else token = (await req.json().catch(() => ({})))?.token;

    if (!token) {
      return NextResponse.json({ ok: false, error: "NO_TOKEN" }, { status: 400 });
    }

    const parsed = parseToken(token);
    if (!parsed) {
      return NextResponse.json({ ok: false, error: "BAD_FORMAT" }, { status: 400 });
    }

    const secret = process.env.DEV_OTP_SECRET || "";
    if (!secret) {
      return NextResponse.json({ ok: false, error: "SERVER_SECRET_MISSING" }, { status: 500 });
    }

    const expected = sign(`${parsed.phone}.${parsed.iat}`, secret);
    if (!timingSafeEq(parsed.sig, expected)) {
      return NextResponse.json({ ok: false, error: "BAD_SIGNATURE" }, { status: 401 });
    }

    // validité 30j comme /api/verify-token
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
    const age = Date.now() - parsed.iat;
    if (age < 0 || age > MAX_AGE_MS) {
      return NextResponse.json({ ok: false, error: "TOKEN_EXPIRED" }, { status: 401 });
    }

    // Accès payant ?
    const phone = parsed.phone;
    const active = await userHasPaidAccess(phone);

    // On remonte aussi la dernière souscription (si on veut afficher l’état dans le menu)
    const lastSub = await prisma.subscription.findFirst({
      where: { user: { phoneE164: phone } },
      orderBy: { createdAt: "desc" },
      select: { plan: true, status: true, currentPeriodEnd: true, paypalId: true },
    });

    return NextResponse.json({
      ok: true,
      phone,
      planActive: active,
      last: lastSub
        ? {
            plan: lastSub.plan,
            status: lastSub.status,
            currentPeriodEnd: lastSub.currentPeriodEnd,
            paypalId: lastSub.paypalId,
          }
        : null,
      token: { iat: parsed.iat, expiresInMs: Math.max(0, MAX_AGE_MS - age) },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
