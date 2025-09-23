// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isCreatorQuestion,
  creatorAutoAnswer,
  SYSTEM_PROMPT,
} from "@/app/lib/creator-policy";

export const runtime = "edge";

// ====== Réglages Groq ======
const GROQ_BASE = "https://api.groq.com/openai/v1";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

// Petit helper JSON
function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// ====== GET ======
// /api/generate            -> ping (clé détectée ?)
// /api/generate?test=1     -> test IA réel (retourne une courte phrase)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const doTest = url.searchParams.get("test") === "1";
  const apiKey = process.env.GROQ_API_KEY;

  if (!doTest) {
    return json({
      ok: true,
      provider: "GROQ",
      ready: Boolean(apiKey),
      model: MODEL,
      note: apiKey
        ? "Clé GROQ_API_KEY détectée."
        : "Ajoute GROQ_API_KEY dans Vercel > Settings > Environment Variables.",
    });
  }

  if (!apiKey) return json({ ok: false, error: "GROQ_API_KEY absente" }, 500);

  try {
    const resp = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 80,
        messages: [
          { role: "system", content: "Réponds en une phrase brève." },
          { role: "user", content: "Dis bonjour pour un test rapide." },
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
            `Groq error (status ${resp.status}) — vérifie la clé / le modèle.`,
        },
        500
      );
    }

    const text = data?.choices?.[0]?.message?.content?.trim() || "(réponse vide)";
    return json({ ok: true, text, from: "GET test", provider: "GROQ" });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Server error" }, 500);
  }
}

// ====== POST ======
// Appel normal depuis l’UI (barre unique)
export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return json({ ok: false, error: "GROQ_API_KEY is not set" }, 500);

  try {
    const { prompt } = await req.json();
    const raw = typeof prompt === "string" ? prompt.trim() : "";

    if (!raw) {
      return json({ ok: false, error: "Missing prompt" }, 400);
    }

    // ---------- 1) Court-circuit : questions sur le créateur ----------
    if (isCreatorQuestion(raw)) {
      const text = creatorAutoAnswer(raw); // FR / EN / AR
      return json({ ok: true, text, provider: "LOCAL_POLICY", model: "n/a" });
    }

    // ---------- 2) Appel LLM normal avec SYSTEM_PROMPT (gouvernance) ----------
    const resp = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        max_tokens: 800,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: raw },
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
            `Groq error (status ${resp.status}) — vérifie la clé / le modèle.`,
        },
        500
      );
    }

    let text: string =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Désolé, je n’ai rien pu générer.";

    // ---------- 3) Sanitation finale (par sécurité) ----------
    // Retire toute mention indésirable (métiers/titres/entités pro).
    // On reste volontairement “soft” pour ne pas abîmer le sens.
    text = text
      .replace(/\b(Office\s+Benmehdi)\b/gi, "")
      .replace(/\b(avocat|lawyer|docteur|doctorat|ph\.?d|phd|mba)\b/gi, "");

    return json({ ok: true, text, provider: "GROQ", model: MODEL });
  } catch (err: any) {
    return json({ ok: false, error: err?.message || "Server error" }, 500);
  }
}
