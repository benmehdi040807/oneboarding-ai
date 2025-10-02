// pages/api/auth/verify-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";

const OTP_STORE = new Map<string, { otp: string; exp: number }>(); // même store si un seul process
// ⚠️ En prod, utiliser Redis pour partager entre processus/instances.

function verifyOtp(phone: string, otp: string) {
  const r = OTP_STORE.get(phone);
  if (!r) return false;
  if (Date.now() > r.exp) { OTP_STORE.delete(phone); return false; }
  const ok = r.otp === otp;
  if (ok) OTP_STORE.delete(phone);
  return ok;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone, otp, firstName, lastName } = req.body || {};
  if (!phone || !otp) return res.status(400).json({ error: "phone+otp required" });

  if (!verifyOtp(phone, otp)) {
    return res.status(401).json({ error: "wrong or expired otp" });
  }

  const payload = {
    sub: phone,
    firstName: firstName || null,
    lastName: lastName || null,
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || "CHANGE_ME_DEV_SECRET",
    { expiresIn: "30d" }
  );

  res.setHeader(
    "Set-Cookie",
    serialize("oba_session", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  );

  return res.status(200).json({ ok: true, user: payload });
}
