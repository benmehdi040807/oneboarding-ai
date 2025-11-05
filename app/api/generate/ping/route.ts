// app/api/generate/ping/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, where: "env", error: "GROQ_API_KEY is not set", provider: "GROQ", model },
      { status: 500 }
    );
  }

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), 12_000);

  try {
    const started = Date.now();
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 60,
        messages: [
          { role: "system", content: "Réponds en une phrase." },
          { role: "user", content: "Dis bonjour brièvement." },
        ],
      }),
    });

    const data = await resp.json().catch(() => ({}));
    const latency = Date.now() - started;

    if (!resp.ok) {
      const msg = data?.error?.message || data?.message || `Groq error (status ${resp.status})`;
      return NextResponse.json(
        { ok: false, where: "groq", status: resp.status, error: msg, raw: data, provider: "GROQ", model, latency },
        { status: 500 }
      );
    }

    const text = data?.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ ok: true, text, provider: "GROQ", model, latency });
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Timeout" : (e?.message || "Server error");
    return NextResponse.json(
      { ok: false, where: "server", error: msg, provider: "GROQ", model },
      { status: 500 }
    );
  } finally {
    clearTimeout(id);
  }
}
