// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

// Petit helper
function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// GET = 2 modes :
//   - /api/generate            -> ping (clé détectée ?)
//   - /api/generate?test=1     -> APPEL IA réel de test (pratique sur smartphone)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const doTest = url.searchParams.get("test") === "1";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!doTest) {
    return json({
      ok: true,
      route: "/api/generate",
      ready: Boolean(apiKey),
      note: apiKey
        ? "La clé OPENAI_API_KEY est détectée."
        : "Aucune clé OPENAI_API_KEY détectée (Vercel > Settings > Environment Variables).",
    });
  }

  // Test IA réel
  if (!apiKey) return json({ ok: false, error: "OPENAI_API_KEY absente" }, 500);
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 60,
        messages: [
          { role: "system", content: "Tu réponds en une ou deux phrases." },
          { role: "user", content: "Dis juste bonjour et une courte phrase de test." },
        ],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return json(
        {
          ok: false,
          status: resp.status,
          error:
            data?.error?.message ||
            `OpenAI error (status ${resp.status}). Vérifie la clé / la facturation / le modèle.`,
        },
        500
      );
    }

    const text =
      data?.choices?.[0]?.message?.content?.trim() || "(réponse vide)";
    return json({ ok: true, text, from: "GET test" });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Server error" }, 500);
  }
}

// POST = appel normal depuis l’UI
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return json({ ok: false, error: "Missing prompt" }, 400);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ ok: false, error: "OPENAI_API_KEY is not set" }, 500);

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
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

    const data = await resp.json();
    if (!resp.ok) {
      return json(
        {
          ok: false,
          status: resp.status,
          error:
            data?.error?.message ||
            `OpenAI error (status ${resp.status}). Vérifie la clé / la facturation / le modèle.`,
        },
        500
      );
    }

    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Désolé, je n’ai rien pu générer.";
    return json({ ok: true, text });
  } catch (err: any) {
    return json({ ok: false, error: err?.message || "Server error" }, 500);
  }
}
