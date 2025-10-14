import { NextResponse } from "next/server";

/** Store en mémoire (ok pour dev / pré-prod serverless) */
declare global {
  // eslint-disable-next-line no-var
  var __OTP_STORE__: Map<string, { code: string; exp: number }> | undefined;
}
const OTP_STORE = (global.__OTP_STORE__ ??= new Map());

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(req: Request) {
  try {
    const { phoneE164 } = await req.json();
    if (typeof phoneE164 !== "string" || !phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "PHONE_INVALID" }, { status: 400 });
    }

    // Génère un code 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const exp = Date.now() + TTL_MS;

    OTP_STORE.set(phoneE164, { code, exp });

    // 🧪 Dev: log côté serveur pour que tu puisses le récupérer dans les logs
    console.log(`[OTP] ${phoneE164} -> ${code} (expire à ${new Date(exp).toISOString()})`);

    // TODO (prod): envoyer via WhatsApp ici
    return NextResponse.json({ ok: true, expiresAt: exp });
  } catch (e) {
    console.error("OTP_REQUEST_ERR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
