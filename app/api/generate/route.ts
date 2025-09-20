// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/** ====== Réglages Groq ====== */
const GROQ_BASE = "https://api.groq.com/openai/v1";
// modèles Groq encore supportés (sept. 2025)
const DEFAULT_MODEL = "llama-3.1-8b-instant";        // rapide, économique
const FALLBACK_MODEL = "llama-3.1-70b-versatile";    // plus puissant
const MODEL = process.env.GROQ_MODEL || DEFAULT_MODEL;

function json(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Petit utilitaire timeout (Edge OK) */
async function withTimeout<T>(p: Promise<T>, ms = 20000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    // @ts-ignore - signal accepté par fetch
    return await (p as any)(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

/** ====== GET ======
 *  /api/generate            -> ping (clé détectée ?)
 *  /api/generate?test=1     -> test IA réel (courte phrase)
 */
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
        max_tokens: 60,
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
    return json({ ok: true, text, from: "GET test", provider: "GROQ", model: MODEL });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Server error" }, 500);
  }
}

/** ====== POST ======
 *  Appel normal depuis l’UI (barre unique)
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return json({ ok: false, error: "GROQ_API_KEY is not set" }, 500);

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return json({ ok: false, error: "Missing prompt" }, 400);
    }

    const resp = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "Tu es OneBoarding AI. Donne des réponses courtes, utiles et polies. Si la demande est vague, propose 2–3 pistes concrètes. Réponds en français si le prompt est en français.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      // Si le modèle est décommissionné, le message Groq l’indiquera ici
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
