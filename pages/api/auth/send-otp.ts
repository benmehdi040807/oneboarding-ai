import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import jwt, { type Secret } from "jsonwebtoken";

const JWT_SECRET = (process.env.JWT_SECRET || "CHANGE_ME_DEV_SECRET") as Secret;

/** Pose un cookie temporaire signé avec l'OTP (TTL en secondes). */
function setOtpTemp(res: NextApiResponse, phone: string, otp: string, ttlSec = 300) {
  // on laisse jsonwebtoken gérer l'expiration via expiresIn
  const token = jwt.sign({ phone, otp }, JWT_SECRET, { expiresIn: ttlSec });
  res.setHeader(
    "Set-Cookie",
    serialize("oba_otp", token, {
      httpOnly: true,
      path: "/",
      maxAge: ttlSec,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  );
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// stub d’envoi WhatsApp (remplacé par Twilio ensuite)
async function sendWhatsAppFallback(phone: string, message: string) {
  console.log(`[OTP][FAKE SEND] to ${phone}: ${message}`);
  return { ok: true };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: "phone required" });

  const otp = genOtp();
  const ttl = Number(process.env.OTP_TTL || 300);

  setOtpTemp(res, phone, otp, ttl);

  const message = `OneBoarding AI — code de vérification : ${otp} (valide ${Math.round(
    ttl / 60
  )} min)`;
  await sendWhatsAppFallback(phone, message);

  return res.status(200).json({ ok: true });
}
