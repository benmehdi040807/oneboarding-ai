import { NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __OTP_STORE__: Map<string, { code: string; exp: number }> | undefined;
}
const OTP_STORE = (global.__OTP_STORE__ ??= new Map());

const DEV_STATELESS_OTP = process.env.DEV_STATELESS_OTP === "1"; // accepte 123456 si activé

export async function POST(req: Request) {
  try {
    const { phoneE164, code } = await req.json();
    if (typeof phoneE164 !== "string" || typeof code !== "string") {
      return NextResponse.json({ ok: false, error: "BAD_INPUT" }, { status: 400 });
    }

    if (DEV_STATELESS_OTP && code === "123456") {
      return NextResponse.json({ ok: true });
    }

    const rec = OTP_STORE.get(phoneE164);
    if (!rec) {
      return NextResponse.json({ ok: false, error: "NO_CODE" }, { status: 400 });
    }
    if (Date.now() > rec.exp) {
      OTP_STORE.delete(phoneE164);
      return NextResponse.json({ ok: false, error: "EXPIRED" }, { status: 400 });
    }
    if (rec.code !== code) {
      return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 400 });
    }

    // succès: on peut supprimer l’OTP pour éviter réutilisation
    OTP_STORE.delete(phoneE164);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("OTP_VERIFY_ERR", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
