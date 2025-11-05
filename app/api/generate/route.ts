// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isCreatorQuestion,
  creatorAutoAnswer,
  SYSTEM_PROMPT,
} from "@/lib/creator-policy";

export const runtime = "edge";

// ====== Réglages Groq ======
const GROQ_BASE = "https://api.groq.com/openai/v1";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

// Petit helper JSON (uniformise les retours)
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

    const text =
      data?.choices?.[0]?.message?.content?.trim() || "(réponse vide)";
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
    const { prompt, mode }: { prompt?: string; mode?: "short" } = await req.json();
    const raw = typeof prompt === "string" ? prompt.trim() : "";
    if (!raw) return json({ ok: false, error: "Missing prompt" }, 400);

    // 0) Optionnel : renvoi "short" immédiat (badge/infobulle)
    if (mode === "short") {
      const text = creatorAutoAnswer(raw, "short");
      return json({ ok: true, text, provider: "LOCAL_POLICY", model: "n/a" });
    }

    // 1) Court-circuit — questions sur le créateur → bio complète (FR/EN/AR)
    if (isCreatorQuestion(raw)) {
      const text = creatorAutoAnswer(raw, "full");
      return json({ ok: true, text, provider: "LOCAL_POLICY", model: "n/a" });
    }

    // 2) Appel LLM normal avec SYSTEM_PROMPT
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

    // 3) Sortie ouverte (aucune censure, langage noble encouragé)
    const text: string =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Désolé, je n’ai pas le droit de vous fournir plus d’informations à ce sujet.";

    return json({ ok: true, text, provider: "GROQ", model: MODEL });
  } catch (err: any) {
    return json({ ok: false, error: err?.message || "Server error" }, 500);
  }
  }
