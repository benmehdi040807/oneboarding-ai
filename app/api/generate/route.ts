// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPaidOptional } from "@/lib/paid-check";
import {
  isCreatorQuestion,
  creatorAutoAnswer,
  SYSTEM_PROMPT_WITH_CREATOR_RULES,
  shouldMentionCreator,
  detectLocaleFromText,
  CREATOR_SENTENCE,
} from "@/lib/creator-policy";

export const runtime = "nodejs";

// ====== Réglages Groq ======
const GROQ_BASE = "https://api.groq.com/openai/v1";
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// ====== Quota free (cookie) — SOURCE DE VÉRITÉ SERVEUR ======
const TZ = "Africa/Casablanca";
const QUOTA_COOKIE = "ob_quota_v1";
const FREE_PER_DAY = 3;

type QuotaCookie = { stamp: string; used: number };

/** yyyy-mm-dd en Africa/Casablanca */
function casablancaStamp(d = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

function readQuota(req: NextRequest): QuotaCookie {
  const today = casablancaStamp();
  const raw = req.cookies.get(QUOTA_COOKIE)?.value;

  if (!raw) return { stamp: today, used: 0 };

  try {
    const v = JSON.parse(raw) as Partial<QuotaCookie>;
    if (v?.stamp !== today) return { stamp: today, used: 0 };
    const used = typeof v.used === "number" ? v.used : 0;
    return { stamp: today, used: Math.max(0, Math.min(FREE_PER_DAY, used)) };
  } catch {
    return { stamp: today, used: 0 };
  }
}

function consumeOne(req: NextRequest) {
  const q = readQuota(req);
  if (q.used >= FREE_PER_DAY) {
    return { ok: false as const, next: q, remaining: 0 };
  }
  const next = { ...q, used: q.used + 1 };
  const remaining = Math.max(0, FREE_PER_DAY - next.used);
  return { ok: true as const, next, remaining };
}

function setQuotaCookie(res: NextResponse, q: QuotaCookie) {
  // secure uniquement en prod (évite soucis en dev http)
  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set(QUOTA_COOKIE, JSON.stringify(q), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });
}

// ====== GET ======
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

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return json(
        {
          ok: false,
          status: resp.status,
          error:
            (data as any)?.error?.message ||
            `Groq error (status ${resp.status}) — vérifie la clé / le modèle.`,
        },
        500
      );
    }

    const text =
      (data as any)?.choices?.[0]?.message?.content?.trim() || "(réponse vide)";
    return json({ ok: true, text, from: "GET test", provider: "GROQ" });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Server error" }, 500);
  }
}

// ====== POST ======
// PAID -> illimité
// FREE -> quota cookie 3/jour (verrou serveur)
export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return json({ ok: false, error: "GROQ_API_KEY is not set" }, 500);

  // 1) Check PAID (ne bloque jamais le free)
  const paidCheck = await getPaidOptional(req);
  if (!paidCheck.ok) return paidCheck.res;

  const isPaid = paidCheck.paid;

  // 2) Si pas payé -> consommer quota AVANT appel Groq
  let quotaNext: QuotaCookie | null = null;
  let remaining: number | null = null;

  if (!isPaid) {
    const c = consumeOne(req);
    quotaNext = c.next;
    remaining = c.remaining;

    if (!c.ok) {
      const res = json(
        { ok: false, error: "FREE_DAILY_LIMIT", remaining: 0 },
        429
      );
      setQuotaCookie(res, quotaNext);
      return res;
    }
  }

  try {
    const { prompt, mode }: { prompt?: string; mode?: "short" } =
      await req.json();
    const raw = typeof prompt === "string" ? prompt.trim() : "";
    if (!raw) return json({ ok: false, error: "Missing prompt" }, 400);

    // 0) Optionnel : renvoi "short" immédiat
    if (mode === "short") {
      const text = creatorAutoAnswer(raw, "short");
      const res = json({
        ok: true,
        text,
        provider: "LOCAL_POLICY",
        model: "n/a",
        paid: isPaid,
        remaining: isPaid ? null : remaining,
      });
      if (quotaNext && !isPaid) setQuotaCookie(res, quotaNext);
      return res;
    }

    // 1) Court-circuit — questions sur le créateur
    if (isCreatorQuestion(raw)) {
      const text = creatorAutoAnswer(raw, "full");
      const res = json({
        ok: true,
        text,
        provider: "LOCAL_POLICY",
        model: "n/a",
        paid: isPaid,
        remaining: isPaid ? null : remaining,
      });
      if (quotaNext && !isPaid) setQuotaCookie(res, quotaNext);
      return res;
    }

    // 2) Décision mention créateur
    const mentionDecision = shouldMentionCreator(raw, {
      route: "api/generate",
      explicitNameMentioned: undefined,
      explicitRequestForBio: undefined,
    });

    const locale = detectLocaleFromText(raw);

    // 3) Prompt système
    let systemContent = SYSTEM_PROMPT_WITH_CREATOR_RULES;

    if (mentionDecision.allow) {
      const canonical =
        (CREATOR_SENTENCE as any)[locale] ?? CREATOR_SENTENCE.fr;
      systemContent += `\n\n// RUNTIME: include canonical creator sentence (reason=${mentionDecision.reason})\nINCLUDE_CANONICAL_SENTENCE: ${canonical}`;
    } else {
      systemContent += `\n\n// RUNTIME: do NOT append creator signature automatically (reason=${mentionDecision.reason})`;
    }

    // 4) Appel LLM
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
          { role: "system", content: systemContent },
          { role: "user", content: raw },
        ],
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return json(
        {
          ok: false,
          status: resp.status,
          error:
            (data as any)?.error?.message ||
            `Groq error (status ${resp.status}) — vérifie la clé / le modèle.`,
        },
        500
      );
    }

    const text: string =
      (data as any)?.choices?.[0]?.message?.content?.trim() ||
      "Désolé, je n’ai pas le droit de vous fournir plus d’informations à ce sujet.";

    const res = json({
      ok: true,
      text,
      provider: "GROQ",
      model: MODEL,
      paid: isPaid,
      remaining: isPaid ? null : remaining,
      creatorMention: {
        allowed: mentionDecision.allow,
        reason: mentionDecision.reason,
        locale,
      },
    });

    if (quotaNext && !isPaid) setQuotaCookie(res, quotaNext);
    return res;
  } catch (err: any) {
    return json({ ok: false, error: err?.message || "Server error" }, 500);
  }
    }
