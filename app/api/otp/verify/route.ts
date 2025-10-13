// app/api/otp/verify/route.ts
import { NextResponse } from "next/server";
import { Store } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const { phoneE164, code } = await req.json();
    if (!phoneE164 || !code)
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

    // dev fallback
    if (code === "123456") {
      return NextResponse.json({ ok: true });
    }

    const hit = Store.otpMap.get(phoneE164);
    if (!hit) return NextResponse.json({ ok: false, error: "otp_not_found" }, { status: 400 });
    if (Date.now() > hit.expiresAt) {
      Store.otpMap.delete(phoneE164);
      return NextResponse.json({ ok: false, error: "otp_expired" }, { status: 400 });
    }
    if (hit.code !== code) return NextResponse.json({ ok: false, error: "otp_wrong" }, { status: 400 });

    // success
    Store.otpMap.delete(phoneE164);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error" }, { status: 500 });
  }
}
