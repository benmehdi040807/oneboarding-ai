// app/api/generate/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge"; // rapide et compatible Vercel

type Body = { prompt?: string; locale?: string };

function mockAnswer(prompt: string) {
  return [
    `🎯 *Interprétation rapide* : ${prompt}`,
    ``,
    `✅ *Proposition concrète* :`,
    `- Étape 1 : ...`,
    `- Étape 2 : ...`,
    `- Étape 3 : ...`,
    ``,
    `✍️ Texte prêt à copier :`,
    `> Votre brouillon personnalisé pour « ${prompt} ».`,
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const { prompt = "", locale } = (await req.json()) as Body;

    if (!prompt.trim()) {
      return NextResponse.json(
        { ok: false, error: "Aucun texte fourni." },
        { status: 400 }
      );
    }

    // Mode démo si pas de clé (ou si MOCK_OPENAI=1)
    const noKey = !process.env.OPENAI_API_KEY;
    const useMock = process.env.MOCK_OPENAI === "1" || noKey;

    if (useMock) {
      return NextResponse.json({
        ok: true,
        output: mockAnswer(prompt),
        mock: true,
      });
    }

    // Appel OpenAI (chat.completions pour compatibilité large)
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // rapide/éco, remplaçable par un autre modèle
        temperature: 0.7,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content:
              "Tu es OneBoarding AI. Donne une réponse utile, concise et actionnable, en français si la demande est en français. Formate en markdown simple.",
          },
          {
            role: "user",
            content: locale ? `[lang=${locale}] ${prompt}` : prompt,
          },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        { ok: false, error: `OpenAI error: ${txt}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const output =
      data?.choices?.[0]?.message?.content?.trim() ??
      "Désolé, aucun texte reçu.";

    return NextResponse.json({ ok: true, output });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Erreur interne." },
      { status: 500 }
    );
  }
}
