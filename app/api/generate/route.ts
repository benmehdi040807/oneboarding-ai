export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json(); // { plan, templateId, values, profile }

    // Mode démo sans clé (mock) — fonctionne d’office
    if (process.env.MOCK_OPENAI === "1" || !process.env.OPENAI_API_KEY) {
      const text = buildMock(body);
      return NextResponse.json({ text });
    }

    // Mode IA réelle (si OPENAI_API_KEY présent)
    const prompt = buildPrompt(body);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Tu es un assistant qui génère des textes professionnels, structurés, concis." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) { const err = await res.text(); return NextResponse.json({ error: err.slice(0, 600) }, { status: 500 }); }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

function buildPrompt({ plan, templateId, values, profile }: any) {
  const header =
    plan === "team"
      ? `\n[Identité collective: ${profile?.org ?? "—"}]\n`
      : plan === "pro"
      ? `\n[Signature: ${profile?.name ?? "Utilisateur"} — ${profile?.title ?? "Professionnel"}]\n`
      : "";
  if (templateId === "plainte")
    return `Rédige une plainte pénale synthétique (1 page) structurée (en-tête, faits, qualification, demandes).
Défendeur: ${values?.defendeur ?? "[Nom]"}
Faits: ${values?.faits ?? "[Faits]"}
Date/Lieu: ${values?.dateLieu ?? "[Date/Lieu]"}
${header}`;
  if (templateId === "mail")
    return `Rédige un mail professionnel poli et concis.
Destinataire: ${values?.destinataire ?? "[Nom]"}
Objet: ${values?.objet ?? "[Objet]"}
Message: ${values?.message ?? "[Message]"}
${header}`;
  if (templateId === "post")
    return `Rédige un post LinkedIn professionnel (120–180 mots) avec un CTA final.
Sujet: ${values?.sujet ?? "[Sujet]"}
Idée: ${values?.idee ?? "[Idée]"}
${header}`;
  return "Rédige un court texte professionnel.";
}

function buildMock({ plan, templateId, values, profile }: any) {
  const tag = plan === "team" ? `[TEAM:${profile?.org ?? "—"}]` : plan === "pro" ? `[PRO:${profile?.name ?? "Utilisateur"}]` : `[FREE]`;
  if (templateId === "plainte") return `${tag} DEMO — Plainte pénale pour ${values?.defendeur ?? "[Nom]"} — ${values?.dateLieu ?? "[Date/Lieu]" }.\nFaits: ${values?.faits ?? "[Faits]"}.`;
  if (templateId === "mail") return `${tag} DEMO — Mail à ${values?.destinataire ?? "[Nom]"} — Objet: ${values?.objet ?? "[Objet]"}.\n${values?.message ?? "[Message]"}`;
  if (templateId === "post") return `${tag} DEMO — Post LinkedIn: ${values?.sujet ?? "[Sujet]"}.\n${values?.idee ?? "[Idée]"}`;
  return `${tag} DEMO — Texte.`;
    }
