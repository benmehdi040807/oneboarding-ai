// pages/api/auth/send-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";

const OTP_STORE = new Map<string, { otp: string; exp: number }>(); // DEV ONLY

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function saveOtp(phone: string, otp: string, ttlSec = 300) {
  OTP_STORE.set(phone, { otp, exp: Date.now() + ttlSec * 1000 });
}

async function sendWhatsAppFallback(phone: string, message: string) {
  // Si Twilio n'est pas encore branché, on log le message côté serveur.
  console.log(`[OTP][FAKE SEND] to ${phone}: ${message}`);
  return { ok: true, debug: true };
}

// TODO: quand Twilio prêt, remplace par un vrai call API Twilio
// import twilio from "twilio"; etc.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: "phone required" });

  const otp = genOtp();
  saveOtp(phone, otp, Number(process.env.OTP_TTL || 300));
  const message = `OneBoarding AI — code de vérification : ${otp} (valide ${process.env.OTP_TTL || 300}s)`;

  try {
    // Envoi factice tant que Twilio n’est pas configuré
    const r = await sendWhatsAppFallback(phone, message);
    return res.status(200).json({ ok: true, debug: !!r.debug });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "failed to send otp" });
  }
}
