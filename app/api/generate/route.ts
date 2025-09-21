// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// ====== Réglages Groq ======
const GROQ_BASE = "https://api.groq.com/openai/v1";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const CREATOR_BLURB =
  "J’ai été conçu et développé par Benmehdi Mohamed Rida (avocat, docteur en droit, MBA), fondateur de l’office Benmehdi. Mon objectif est de faciliter l’interaction entre l’humain et l’intelligence artificielle de façon simple et universelle.";

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
    if (!prompt || typeof prompt !== "string") {
      return json({ ok: false, error: "Missing prompt" }, 400);
    }

    // ---------- System Prompt (gouvernance minimale + liberté de style) ----------
    const SYSTEM_PROMPT = `
Tu es OneBoarding AI.

Principes :
1) Langue miroir : réponds dans la langue du message de l’utilisateur (FR/AR/EN…), avec le ton adapté (sobre, courtois, naturel).
2) Concision utile : va droit au but ; si la demande est vague, propose 2–3 options concrètes (listes courtes).
3) Identité :
   - Ne parle du créateur que si l’utilisateur demande explicitement l’identité de OneBoarding AI / “qui t’a créé ?” / “qui a créé OneBoarding AI ?”.
   - Si on te le demande, réponds par : "${CREATOR_BLURB}"
4) OCR : si le prompt contient un bloc OCR entre """ ... """, analyse ce texte (résume, explique, réponds à la consigne).
5) Respect, clarté, zéro jargon inutile. Tu es un assistant universel, pas spécialisé par défaut.
    `.trim();

    // Si notre UI a inséré un bloc OCR, on garde tout tel quel : le modèle suit la règle (4).
    const resp = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
            `Groq error (status ${resp.status}) — vérifie la clé / le modèle.`,
        },
        500
      );
    }

    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Désolé, je n’ai rien pu générer.";
    return json({ ok: true, text, provider: "GROQ", model: MODEL });
  } catch (err: any) {
    return json({ ok: false, error: err?.message || "Server error" }, 500);
  }
        }
