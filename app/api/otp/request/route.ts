// app/api/otp/request/route.ts
import { NextResponse } from "next/server";
import { Store } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const { phoneE164 } = await req.json();
    if (!phoneE164) return NextResponse.json({ ok: false, error: "bad_phone" }, { status: 400 });

    // generate: 6-digit
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    Store.otpMap.set(phoneE164, { code, expiresAt });

    // For now, just log so you can grab it from server logs
    console.log("[OTP] to", phoneE164, "=", code, "(valid 5 min)");

    // Later: send via WhatsApp provider here
    return NextResponse.json({ ok: true, expiresAt });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error" }, { status: 500 });
  }
}
