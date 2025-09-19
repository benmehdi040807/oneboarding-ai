// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Petit GET de santé : /api/generate
export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY;
  return NextResponse.json({
    ok: true,
    route: "/api/generate",
    ready: hasKey,
    note: hasKey
      ? "La clé OPENAI_API_KEY est détectée."
      : "Aucune clé OPENAI_API_KEY détectée.",
  });
}

// Appel modèle
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { ok: false, where: "validate", error: "Missing prompt" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, where: "env", error: "OPENAI_API_KEY is not set" },
        { status: 500 }
      );
    }

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
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "Tu es OneBoarding AI. Donne des réponses courtes, utiles et polies. Si la demande est vague, propose 2-3 pistes concrètes.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const msg =
        (data && (data.error?.message || data.message)) ||
        `OpenAI error (status ${resp.status})`;
      // On renvoie TOUT pour debug côté client
      return NextResponse.json(
        { ok: false, where: "openai", status: resp.status, error: msg, raw: data },
        { status: 500 }
      );
    }

    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Désolé, je n’ai rien pu générer.";

    return NextResponse.json({ ok: true, text });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, where: "server", error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
