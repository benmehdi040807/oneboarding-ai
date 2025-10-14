// app/api/otp/request/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

const SECRET = process.env.DEV_OTP_SECRET || "change_me_dev_secret";
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function b64url(s: Buffer | string) {
  return Buffer.from(s)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
function sign(data: object) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(data));
  const sig = b64url(crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export async function POST(req: Request) {
  try {
    const { phoneE164 } = await req.json();
    if (typeof phoneE164 !== "string" || !phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "BAD_INPUT" }, { status: 400 });
    }

    // 6 chiffres aléatoires
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const exp = Date.now() + OTP_TTL_MS;

    // Token stateless (contient téléphone + code + expiration)
    const token = sign({ p: phoneE164, c: code, exp });

    // (dev) log utile pour tes tests
    console.log(`[OTP] ${phoneE164} -> ${code} (expire à ${new Date(exp).toISOString()})`);

    // On n’envoie **jamais** le code au client, seulement le token signé
    return NextResponse.json({ ok: true, token, expireAt: exp });
  } catch (e) {
    console.error("OTP_REQUEST_ERR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
