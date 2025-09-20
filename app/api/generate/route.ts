// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// ====== Réglages Groq ======
const GROQ_BASE = "https://api.groq.com/openai/v1";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

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
        max_tokens: 60,
        messages: [
          // ✅ Répondre dans la langue détectée du message utilisateur
          { role: "system", content: "أجب دائمًا باللغة نفسها التي يستخدمها المستخدم في رسالته. If the user writes in English, reply in English. Si l’utilisateur écrit en français, réponds en français. لا تترجم إلا إذا طُلب منك ذلك صراحةً." },
          { role: "user", content: "اختبار سريع: قل مرحبًا بجملة قصيرة." },
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
          // ✅ Règle centrale : réponds dans la même langue que le message utilisateur
          {
            role: "system",
            content:
              "Always reply in the same language as the user's message. لا تُترجم إلا إذا طُلب منك ذلك صراحةً. Donne des réponses courtes, utiles et polies. If user is vague, propose 2–3 concrete options.",
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
