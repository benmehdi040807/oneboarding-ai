// app/api/auth/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { userHasPaidAccess } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ------------ helpers token HMAC (alignés avec /api/verify-token historique) ------------ */
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

/**
 * Body possible:
 * { token?: string, deviceId?: string }
 * (token peut aussi arriver en Authorization: Bearer <token>)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    const body = await req.json().catch(() => ({} as any));
    const deviceId: string | undefined = typeof body?.deviceId === "string" ? body.deviceId : undefined;

    let token: string | undefined;
    if (auth?.toLowerCase().startsWith("bearer ")) token = auth.slice(7).trim();
    else if (typeof body?.token === "string") token = body.token;

    if (!token) {
      return NextResponse.json({ ok: false, error: "NO_TOKEN" }, { status: 400 });
    }

    const parsed = parseToken(token);
    if (!parsed) {
      return NextResponse.json({ ok: false, error: "BAD_FORMAT" }, { status: 400 });
    }

    const SECRET =
      process.env.AUTH_TOKEN_SECRET || process.env.DEV_OTP_SECRET || "";
    if (!SECRET) {
      return NextResponse.json({ ok: false, error: "SERVER_SECRET_MISSING" }, { status: 500 });
    }

    const expected = sign(`${parsed.phone}.${parsed.iat}`, SECRET);
    if (!timingSafeEq(parsed.sig, expected)) {
      return NextResponse.json({ ok: false, error: "BAD_SIGNATURE" }, { status: 401 });
    }

    // validité 30 jours
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
    const age = Date.now() - parsed.iat;
    if (age < 0 || age > MAX_AGE_MS) {
      return NextResponse.json({ ok: false, error: "TOKEN_EXPIRED" }, { status: 401 });
    }

    const phone = parsed.phone;

    // 1) Accès payant actif ?
    const planActive = await userHasPaidAccess(phone);

    // 2) État devices (facultatif si table Device absente)
    const maxDevices = Number(process.env.NEXT_PUBLIC_MAX_DEVICES || 3);
    let hasAnyDevice = false;
    let deviceKnown = false;
    let deviceCount = 0;

    try {
      const user = await prisma.user.findUnique({
        where: { phoneE164: phone },
        select: { id: true },
      });

      if (user) {
        const devices = await prisma.device.findMany({
          where: { userId: user.id, authorized: true },
          select: { deviceId: true },
        });
        deviceCount = devices.length;
        hasAnyDevice = deviceCount > 0;
        deviceKnown = !!(deviceId && devices.some(d => d.deviceId === deviceId));
      }
    } catch {
      // si le modèle Device n'existe pas encore, on ignore silencieusement
    }

    // 3) Dernière souscription (pour affichage état)
    const lastSub = await prisma.subscription.findFirst({
      where: { user: { phoneE164: phone } },
      orderBy: { createdAt: "desc" },
      select: { plan: true, status: true, currentPeriodEnd: true, paypalId: true },
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      phone,
      planActive,
      devices: {
        hasAnyDevice,
        deviceKnown,
        deviceCount,
        maxDevices,
      },
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
