// pages/api/auth/session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_DEV_SECRET";

function setSessionCookie(res: NextApiResponse, payload: any) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
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
}

function clearSessionCookie(res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    serialize("oba_session", "", {
      httpOnly: true,
      path: "/",
      maxAge: -1,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  );
}

// --- OTP TEMP cookie (signé) posé par send-otp ---
function readOtpTemp(req: NextApiRequest) {
  const t = req.cookies?.oba_otp;
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET) as any; } catch { return null; }
}
function clearOtpTemp(res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    serialize("oba_otp", "", { httpOnly: true, path: "/", maxAge: -1, sameSite: "lax", secure: process.env.NODE_ENV === "production" })
  );
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // → état session
    try {
      const token = req.cookies?.oba_session;
      if (!token) return res.status(200).json({ authenticated: false });
      const payload = jwt.verify(token, JWT_SECRET) as any;
      return res.status(200).json({
        authenticated: true,
        user: {
          phone: payload.sub || null,
          firstName: payload.firstName || null,
          lastName: payload.lastName || null,
        },
      });
    } catch {
      return res.status(200).json({ authenticated: false });
    }
  }

  if (req.method === "POST") {
    // → vérifie OTP + crée session
    const { phone, otp, firstName, lastName } = req.body || {};
    if (!phone || !otp) return res.status(400).json({ error: "phone+otp required" });

    const temp = readOtpTemp(req);
    if (!temp || temp.phone !== phone || temp.otp !== otp || Date.now() > temp.exp) {
      return res.status(401).json({ error: "wrong or expired otp" });
    }

    // OK → créer session
    setSessionCookie(res, { sub: phone, firstName: firstName || null, lastName: lastName || null });
    clearOtpTemp(res);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    // → logout
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
