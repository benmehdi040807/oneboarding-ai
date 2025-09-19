// app/api/generate/ping/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, where: "env", error: "OPENAI_API_KEY is not set" },
      { status: 500 }
    );
  }

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 60,
        messages: [
          { role: "system", content: "Réponds en une phrase." },
          { role: "user", content: "Dis bonjour brièvement." },
        ],
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const msg =
        (data && (data.error?.message || data.message)) ||
        `OpenAI error (status ${resp.status})`;
      return NextResponse.json(
        { ok: false, where: "openai", status: resp.status, error: msg, raw: data },
        { status: 500 }
      );
    }

    const text = data?.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ ok: true, text });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, where: "server", error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
