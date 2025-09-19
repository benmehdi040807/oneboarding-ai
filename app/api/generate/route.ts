// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// ✅ GET = test rapide dans le navigateur : /api/generate
export async function GET() {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  return NextResponse.json({
    ok: true,
    route: "/api/generate",
    ready: hasKey,
    note: hasKey
      ? "La clé OPENAI_API_KEY est détectée."
      : "Aucune clé OPENAI_API_KEY détectée (à ajouter dans Vercel > Settings > Environment Variables).",
  });
}

// ✅ POST = appel modèle OpenAI
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing prompt" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY is not set" },
        { status: 500 }
      );
    }

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

    // 🟢 Debug complet de la réponse OpenAI (visible dans logs Vercel)
    console.log("OpenAI raw response:", JSON.stringify(data, null, 2));

    if (!resp.ok) {
      const msg =
        data?.error?.message ||
        `OpenAI error (status ${resp.status}). Please try again.`;
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }

    // 🟢 Extraction robuste du texte (chat ou completions classiques)
    let text = "";
    if (data?.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content.trim();
    } else if (data?.choices?.[0]?.text) {
      text = data.choices[0].text.trim();
    } else {
      text = "Désolé, je n’ai rien pu générer.";
    }

    return NextResponse.json({ ok: true, text });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
         }
