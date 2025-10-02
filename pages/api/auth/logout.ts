// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // On supprime le cookie en le réécrivant avec maxAge négatif
  const expired = serialize("oba_session", "", {
    httpOnly: true,
    path: "/",
    maxAge: -1,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.setHeader("Set-Cookie", expired);
  res.status(200).json({ ok: true });
}
