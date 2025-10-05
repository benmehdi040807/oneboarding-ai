// app/api/otp/request/route.ts
import { NextRequest, NextResponse } from "next/server";

// --- MINI KV EN MÉMOIRE (remplace si tu as déjà un kv.ts) ---
const mem = new Map<string, any>();
const kv = {
  async get<T>(key: string): Promise<T | null> { return (mem.get(key) ?? null) as T | null; },
  async set<T>(key: string, value: T): Promise<void> { mem.set(key, value); },
  async del(key: string): Promise<void> { mem.delete(key); },
};

// --- OTP utils (évite 0/O/I/1) ---
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateOtp(len = 6) {
  const cryptoObj = require("node:crypto");
  const bytes = cryptoObj.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
function hashOtp(otp: string) {
  const cryptoObj = require("node:crypto");
  return cryptoObj.createHash("sha256").update(otp).digest("hex");
}

// --- ENVOI OTP (STUB DEV) ---
// Remplacera plus tard par WhatsApp Cloud API / Twilio.
// Pour l’instant, juste un log serveur (suffisant pour build & test).
async function sendOtpDev(toE164: string, code: string) {
  console.log(`[DEV] OTP vers ${toE164}: ${code}`);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phoneE164 = (body?.phoneE164 ?? "").toString();

    if (!phoneE164 || !phoneE164.startsWith("+")) {
      return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }

    // ⚙️ Mode DEV : autoriser l’OTP sans paiement (DEV_ALLOW_FREE=1)
    const allowFree = process.env.DEV_ALLOW_FREE === "1";

    // Vérifier statut d’abonnement (si tu l’enregistres ailleurs)
    const user = await kv.get<{ status: "paid" | "free" }>(`user:${phoneE164}`);

    if (!allowFree) {
      if (!user || user.status !== "paid") {
        // En prod, on exige le paiement
        return NextResponse.json({ ok: false, error: "PAYMENT_REQUIRED" }, { status: 402 });
      }
    }
    // sinon en DEV, on laisse passer

    // Générer & stocker l’OTP (5 min)
    const code = generateOtp(6);
    const codeHash = hashOtp(code);
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await kv.set(`otp:${phoneE164}`, { codeHash, expiresAt });

    // Envoyer (stub dev)
    await sendOtpDev(phoneE164, code);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("OTP request error:", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
