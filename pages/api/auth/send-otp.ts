// pages/api/auth/send-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_DEV_SECRET";

function setOtpTemp(res: NextApiResponse, phone: string, otp: string, ttlSec = 300) {
  const token = jwt.sign({ phone, otp, exp: Date.now() + ttlSec * 1000 }, JWT_SECRET, { expiresIn: Math.ceil(ttlSec / 60) + "m" });
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

async function sendWhatsAppFallback(phone: string, message: string) {
  console.log(`[OTP][FAKE SEND] to ${phone}: ${message}`);
  return { ok: true, debug: true };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: "phone required" });

  const otp = genOtp();
  const ttl = Number(process.env.OTP_TTL || 300);
  setOtpTemp(res, phone, otp, ttl);

  const message = `OneBoarding AI — code de vérification : ${otp} (valide ${ttl}s)`;
  await sendWhatsAppFallback(phone, message); // remplace par Twilio plus tard

  return res.status(200).json({ ok: true });
}
