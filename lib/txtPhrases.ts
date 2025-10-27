// lib/txtPhrases.ts
//
// OneBoarding AI — Formulation Engine v2.1 (fail-safe, extended)
// Objectif : rendu premium, fiable, sans “hybrides” verbaux.
// Philosophie :
//   • Pas d’excuses ni d’UI talk.
//   • Gabarits courts, sûrs, réutilisables.
//   • Aucune concaténation hasardeuse de verbes.
//   • Filtres doux : espaces, ponctuation, exclusion des excuses.
//   • Mode “reframe” enrichi avec variété linguistique (FR/EN/AR).
//   • Aération préservée pour confort de lecture mobile.
//
// Auteur : Maître Benmehdi Mohamed Rida
// Version : Octobre 2025

export type Lang = "fr" | "en" | "ar";
export type Confidence = "high" | "medium" | "low";
export type CtaKind = "copy" | "save" | "share";

type Bucket = {
  diagnostic: string[];
  analysis: string[];
  restitution: string[];
  opening: string[];
};

type Pool = Record<Lang, Record<Confidence, Bucket>>;
type Profile = "short" | "medium" | "long" | "reframe";

/* --------------------------- RNG / Helpers -------------------------------- */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rng?: () => number): T {
  if (!arr.length) throw new Error("Empty array");
  if (!rng) return arr[Math.floor(Math.random() * arr.length)];
  return arr[Math.floor(rng() * arr.length)];
}

function squashSpaces(s: string) {
  return s.replace(/\s{2,}/g, " ").trim();
}
function normalizeBreaks(s: string) {
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

/* ------------------------------- Tone filter ------------------------------ */
// Retire les excuses (strict, tous cas)
function purifyTone(raw: string, lang: Lang): string {
  let s = raw;

  // FR
  s = s.replace(/\bje\s+suis\s+d[ée]sol[ée]e?\b\s*,?\s*/gi, "");
  s = s.replace(/\b(?:d[ée]sol[ée]e?|je\s+m['’]excuse|pardon(?:nez-moi)?|toutes?\s+mes\s+excuses)\b\s*,?\s*/gi, "");

  // EN
  s = s.replace(/\b(i'?m\s+sorry|sorry|apologies|i\s+apologis[ea]?|my\s+apologies)\b\s*,?\s*/gi, "");

  // AR
  s = s.replace(/\b(أعتذر|آسف(?:ة)?)\b\s*،?\s*/g, "");

  // Nettoyage ponctuation + espaces
  s = s.replace(/^[,;:\s]+/, "");
  return squashSpaces(s);
}

/* --------------------------- Safety post-filter --------------------------- */
// Évite hybrides (“je fournis vous…”, “I deliver suggest…”, etc.) + ponctuation
function postSafetyFilter(raw: string, lang: Lang): string {
  let s = raw;

  if (lang === "fr") {
    s = s.replace(/\bje\s+fournis\s+vous\s+/gi, "je vous ");
    s = s.replace(/\bje\s+fournis\s+de\b/gi, "je propose de");
    s = s.replace(/\bprocédure\s+directe\b/gi, "voie directe");
    s = s.replace(/\bje\s+fournis\s+l['’]analyser\b/gi, "je peux l’analyser");
    s = s.replace(/\s+([?!;:,.])/g, "$1");
  } else if (lang === "en") {
    s = s.replace(/\bI\s+deliver\s+(?:to\s+)?you\s+(suggest|recommend|propose)\b/gi, "I $1");
    s = s.replace(/\s+([?!;:,.])/g, "$1");
  } else {
    // AR
    s = s.replace(/\s+([؟،.])/g, "$1");
  }

  return normalizeBreaks(s);
}

/* --------------------------- Incapacity detectors ------------------------- */

const incapacityPatterns: Record<Lang, RegExp[]> = {
  fr: [
    /\bje\s+ne\s+(?:peux|pourrai?s)\s+(?:pas|point)\b/i,
    /\bje\s+n[’']ai\s+pas\s+d[’']accès\b/i,
    /\bje\s+ne\s+dispose\s+pas\s+des?\s+informations\b/i,
    /\ben\s+t[âa]nt\s+qu[’']?(?:IA|intelligence\s+artificielle|mod[èe]le\s+de\s+langage)\b/i,
  ],
  en: [
    /\bI\s+(?:can(?:not|'t)|do\s+not|don't)\s+access\b/i,
    /\bI\s+(?:cannot|can't)\s+(?:do|know)\b/i,
    /\bas\s+an\s+AI|as\s+a\s+language\s+model\b/i,
    /\bI\s+do\s+not\s+have\s+(?:access|data)\b/i,
  ],
  ar: [
    /\b(?:لا|لست)\s+أستطيع\b/,
    /\bلا\s+أملك\s+وصولاً?\b/,
    /\bبوصفي|كوني?\s+نظام(?:اً)?\s+ذكياً?\b/,
  ],
};

/* ------------------------------ Reframe pools ----------------------------- */
// Variantes courtes, sûres, multilingue
const reframePool = {
  fr: {
    intro: [
      "On change d’angle, simplement :",
      "Pas d’impasse : nouvelle voie claire :",
      "Chemin direct :",
      "On pivote proprement :",
      "Option pratico-pratique :",
      "Cap vers l’essentiel :",
      "Route immédiate :",
    ],
    steps: [
      "Transmettez la matière entre triple quotes.",
      "Je lis, j’extrais l’essentiel, je rends un bref utile.",
      "Si besoin, je propose un mini-plan d’action.",
      "Collez le contenu entre « \"\"\" ».",
      "J’extrais l’utile et je rends un bref net.",
      "Si pertinent, je propose trois actions concrètes.",
      "Vous obtenez un résumé exploitable, tout de suite.",
    ],
    tip: [
      "Exemple : \"\"\"texte brut / chiffres / points\"\"\".",
      "Vous gagnez en clarté, je fournis la synthèse nette.",
      "Format conseillé : \"\"\" faits / chiffres / liens \"\"\".",
      "Gain de temps : j’assemble et je clarifie.",
      "Je fournis un livrable court, prêt à partager.",
      "On garde l’essentiel, rien de superflu.",
    ],
  },
  en: {
    intro: [
      "Let’s pivot cleanly:",
      "No roadblock — new route:",
      "Direct path:",
      "Clean pivot, clear lane:",
      "Practical route forward:",
      "Straight route, zero friction:",
      "Immediate path to value:",
    ],
    steps: [
      "Send raw material between triple quotes.",
      "I extract the gist and return a crisp brief.",
      "If useful, I add a short action plan.",
      "Paste content inside \"\"\" ... \"\"\".",
      "I extract signal and return a tight brief.",
      "If needed, I add three concrete moves.",
      "You get a usable summary right away.",
    ],
    tip: [
      "Example: \"\"\"raw text / figures / bullets\"\"\".",
      "Clear input in, clear brief out.",
      "Suggested format: \"\"\" facts / numbers / links \"\"\".",
      "Time saver: I compile and clarify.",
      "I return a short, share-ready deliverable.",
      "Only the essentials — no clutter.",
    ],
  },
  ar: {
    intro: [
      "نبدّل المسار ببساطة:",
      "لا انسداد — طريق واضح:",
      "مسار مباشر:",
      "نغيّر الزاوية بسلاسة:",
      "حلّ عملي مباشر:",
      "طريق قصير وواضح:",
      "انتقال سريع نحو المفيد:",
    ],
    steps: [
      "أرسل المادة الخام بين ثلاث علامات اقتباس.",
      "ألخّص الجوهر وأقدّم موجزًا واضحًا.",
      "عند الحاجة، أضيف خطة قصيرة.",
      "ضع المحتوى بين \"\"\" ... \"\"\".",
      "أستخرج الإشارة وأعيد موجزًا محكمًا.",
      "عند اللزوم، أضيف ثلاث خطوات عملية.",
      "تحصل على خلاصة قابلة للاستخدام فورًا.",
    ],
    tip: [
      "مثال: \"\"\"نص خام / أرقام / نقاط\"\"\".",
      "مدخل واضح ← مخرج واضح.",
      "تنسيق مقترح: \"\"\" حقائق / أرقام / روابط \"\"\".",
      "وفّر الوقت: أرتّب وأوضّح.",
      "أقدّم مخرجًا قصيرًا جاهزًا للمشاركة.",
      "نحافظ على الأساسيات فقط بدون حشو.",
    ],
  },
};

/* ---------------------------- Pool (phrases sûres) ------------------------ */
// Phrases brèves, stables. Aucune structure “je fournis + verbe”.
const pool: Pool = {
  fr: {
    high: {
      diagnostic: [
        "Votre demande est nette : cap bien orienté.",
        "Contexte suffisant pour une réponse précise.",
        "Base solide : passons au concret.",
      ],
      analysis: [
        "Je structure les points clés.",
        "J’aligne priorités et dépendances.",
        "Je réduis le bruit et garde l’essentiel.",
      ],
      restitution: [
        "L’essentiel : {summary}",
        "À retenir : {summary}",
        "Synthèse : {summary}",
      ],
      opening: [
        "{guidance} Souhaitez-vous un exemple ciblé ? {cta}",
        "Je peux détailler un point au choix. {cta}",
        "Version plus courte ou plus fouillée, à votre convenance. {cta}",
      ],
    },
    medium: {
      diagnostic: [
        "Votre demande est globalement claire.",
        "Le cadre est compréhensible.",
        "On distingue bien l’intention.",
      ],
      analysis: [
        "Je regroupe par thèmes.",
        "Je clarifie la terminologie utile.",
        "Je propose un ordre de lecture simple.",
      ],
      restitution: [
        "En bref : {summary}",
        "Vue d’ensemble : {summary}",
        "Points principaux : {summary}",
      ],
      opening: [
        "On peut ajouter un exemple ou un chiffre. {cta}",
        "Indiquez la section à approfondir. {cta}",
        "{guidance} Je fournis la suite au même format. {cta}",
      ],
    },
    low: {
      diagnostic: [
        "Quelques zones restent floues.",
        "Demande partiellement explicite.",
        "Je me base sur les repères sûrs.",
      ],
      analysis: [
        "Je privilégie les éléments confirmés.",
        "Je réduis les ambiguïtés.",
        "Je garde un fil simple et lisible.",
      ],
      restitution: [
        "Ce qui ressort avec fiabilité : {summary}",
        "Lecture prudente : {summary}",
        "Repères utiles : {summary}",
      ],
      opening: [
        "Un peu plus de contexte et j’affine. {cta}",
        "{guidance} Je peux fournir des variantes courtes. {cta}",
        "On itère sur la partie prioritaire. {cta}",
      ],
    },
  },

  en: {
    high: {
      diagnostic: [
        "Your request is clear and well-framed.",
        "Context is sufficient for a precise answer.",
        "Solid basis — moving to substance.",
      ],
      analysis: [
        "I surface the key points.",
        "I order priorities and links.",
        "I keep only what matters.",
      ],
      restitution: [
        "Essentials: {summary}",
        "Keep in mind: {summary}",
        "Clean synthesis: {summary}",
      ],
      opening: [
        "{guidance} Would a focused example help? {cta}",
        "I can expand one section you choose. {cta}",
        "Shorter or deeper version on demand. {cta}",
      ],
    },
    medium: {
      diagnostic: [
        "Your request is mostly clear.",
        "The frame is understandable.",
        "The intent is visible.",
      ],
      analysis: [
        "I group by themes.",
        "I clarify useful terms.",
        "I propose a simple reading order.",
      ],
      restitution: [
        "In brief: {summary}",
        "Overview: {summary}",
        "Main points: {summary}",
      ],
      opening: [
        "We can add an example or a figure. {cta}",
        "Point me to the part to deepen. {cta}",
        "{guidance} I’ll keep the same clean format. {cta}",
      ],
    },
    low: {
      diagnostic: [
        "Some areas remain fuzzy.",
        "Partly explicit request.",
        "I rely on reliable cues.",
      ],
      analysis: [
        "I emphasize confirmed elements.",
        "I reduce ambiguities.",
        "I keep a simple thread.",
      ],
      restitution: [
        "What reliably stands out: {summary}",
        "Careful reading: {summary}",
        "Useful anchors: {summary}",
      ],
      opening: [
        "With a bit more context, I’ll refine. {cta}",
        "{guidance} I can provide short variants. {cta}",
        "We can iterate on the priority part. {cta}",
      ],
    },
  },

  ar: {
    high: {
      diagnostic: [
        "طلبك واضح ومضبوط.",
        "السياق كافٍ لإجابة دقيقة.",
        "أساس قوي — ننتقل إلى الجوهر.",
      ],
      analysis: [
        "أبرز النقاط الأساسية.",
        "أرتّب الأولويات والروابط.",
        "أحافظ على المهم فقط.",
      ],
      restitution: [
        "الخلاصة: {summary}",
        "باختصار: {summary}",
        "تركيب واضح: {summary}",
      ],
      opening: [
        "{guidance} هل يفيد مثال مركّز؟ {cta}",
        "أوسّع جزءًا تختاره. {cta}",
        "نسخة أقصر أو أعمق حسب الحاجة. {cta}",
      ],
    },
    medium: {
      diagnostic: [
        "طلبك واضح إجمالًا.",
        "الإطار مفهوم.",
        "النية ظاهرة.",
      ],
      analysis: [
        "أجمع حسب المحاور.",
        "أوضح المصطلحات المفيدة.",
        "أقترح ترتيب قراءة بسيطًا.",
      ],
      restitution: [
        "باختصار: {summary}",
        "نظرة عامة: {summary}",
        "نقاط رئيسية: {summary}",
      ],
      opening: [
        "يمكن إضافة مثال أو رقم. {cta}",
        "دلّني على الجزء المراد تعميقه. {cta}",
        "{guidance} أحافظ على نفس الصياغة النظيفة. {cta}",
      ],
      },
    low: {
      diagnostic: [
        "بعض المواضع غير حادّة.",
        "الطلب جزئي الوضوح.",
        "أعتمد على المؤشرات الموثوقة.",
      ],
      analysis: [
        "أبرز العناصر المؤكدة.",
        "أقلّل الالتباس.",
        "أحافظ على خيط بسيط.",
      ],
      restitution: [
        "ما يبرز بثقة: {summary}",
        "قراءة حذرة: {summary}",
        "مرتكزات مفيدة: {summary}",
      ],
      opening: [
        "بمزيد من السياق أدقّق أكثر. {cta}",
        "{guidance} أقدّم صيغًا قصيرة بديلة. {cta}",
        "نكرّر على الجزء الأولوي. {cta}",
      ],
    },
  },
};

/* ------------------------------ CTA builder ------------------------------- */

function buildCta(lang: Lang, kinds: CtaKind[]): string {
  if (!kinds.length) return "";
  const hasCopy = kinds.includes("copy");
  const hasSave = kinds.includes("save");
  const hasShare = kinds.includes("share");

  if (lang === "fr") {
    const bits: string[] = [];
    if (hasCopy) bits.push("copier la réponse");
    if (hasSave) bits.push("l’enregistrer");
    if (hasShare) bits.push("la partager");
    const list =
      bits.length === 1 ? bits[0] :
      bits.length === 2 ? `${bits[0]} ou ${bits[1]}` :
      `${bits[0]}, ${bits[1]} ou ${bits[2]}`;
    return `Vous pouvez ${list}.`;
  }

  if (lang === "en") {
    const bits: string[] = [];
    if (hasCopy) bits.push("copy the answer");
    if (hasSave) bits.push("save it");
    if (hasShare) bits.push("share it");
    const list =
      bits.length === 1 ? bits[0] :
      bits.length === 2 ? `${bits[0]} or ${bits[1]}` :
      `${bits[0]}, ${bits[1]} or ${bits[2]}`;
    return `You can ${list}.`;
  }

  // AR
  {
    const bits: string[] = [];
    if (hasCopy) bits.push("نسخ الإجابة");
    if (hasSave) bits.push("حفظها");
    if (hasShare) bits.push("مشاركتها");
    const list =
      bits.length === 1 ? bits[0] :
      bits.length === 2 ? `${bits[0]} أو ${bits[1]}` :
      `${bits[0]}، ${bits[1]} أو ${bits[2]}`;
    return `بإمكانك ${list}.`;
  }
}

/* -------------------------- Adaptive classification ----------------------- */

function isListy(s: string): boolean {
  return /(^|\n)\s*(?:[-•*]|\d+\.)\s+/.test(s);
}
function paragraphCount(s: string): number {
  return (s.trim().match(/\n{1,}/g) || []).length + 1;
}
function detectIncapacity(s: string, lang: Lang): boolean {
  const text = s.trim();
  if (!text) return false;
  const pats = incapacityPatterns[lang] || [];
  return pats.some((rx) => rx.test(text));
}

function detectProfile(textRaw: string, lang: Lang): Profile {
  const cleaned = normalizeBreaks(purifyTone(textRaw || "", lang));
  if (!cleaned) return "short";
  if (detectIncapacity(cleaned, lang)) return "reframe";

  const len = cleaned.length;
  const paras = paragraphCount(cleaned);
  const list = isListy(cleaned);

  if (len < 140 && paras === 1 && !list) return "short";
  if (len >= 900 || paras >= 5 || (list && len >= 600)) return "long";
  return "medium";
}

/* ---------------------------------- API ----------------------------------- */

export function formatResponse(args: {
  lang: Lang;
  confidence: Confidence;
  summary?: string;
  guidance?: string;
  tips?: string;
  includeCta?: boolean;
  ctaOptions?: CtaKind[];
  seed?: number;
  joiner?: string;
}): string {
  const {
    lang,
    confidence,
    summary = "",
    guidance,
    tips,
    includeCta = false,
    ctaOptions = ["copy", "save", "share"],
    seed,
    joiner = "\n\n",
  } = args;

  const langPool = pool[lang];
  if (!langPool) throw new Error(`Unsupported lang: ${lang}`);
  const bucket = langPool[confidence];
  if (!bucket) throw new Error(`Unsupported confidence: ${confidence}`);

  // Guidance > tips > vide
  const guidanceSafe =
    (guidance && guidance.trim()) ? guidance.trim() :
    (tips && tips.trim()) ? tips.trim() : "";

  const rng = typeof seed === "number" ? mulberry32(seed) : undefined;

  // 1) Pré-nettoyage du texte brut (sans réécriture du fond)
  let text = purifyTone(summary, lang);
  text = normalizeBreaks(text);

  // 2) Profil adaptatif
  const profile = detectProfile(text, lang);

  // 3) Mode reframe : blocs courts, sûrs
  if (profile === "reframe") {
    const intro = pick(reframePool[lang].intro, rng);
    const steps = pick(reframePool[lang].steps, rng);
    const tip   = pick(reframePool[lang].tip, rng);
    const ctaText = includeCta ? buildCta(lang, ctaOptions) : "";
    const open = [guidanceSafe, ctaText].filter(Boolean).join(" ").trim();

    const out = [intro, steps, [tip, open].filter(Boolean).join(" ")].filter(Boolean).join(joiner);
    return postSafetyFilter(out, lang);
  }

  // 4) Réponse directe si très courte
  if (profile === "short") {
    const direct = postSafetyFilter(text, lang);
    return direct;
  }

  // 5) Structure stable Medium / Long (phrases sûres)
  const diag = pick(bucket.diagnostic, rng);
  const ana  = pick(bucket.analysis, rng);
  const res  = pick(bucket.restitution, rng).replace("{summary}", text);

  const ctaText = includeCta ? buildCta(lang, ctaOptions) : "";
  const openRaw = pick(bucket.opening, rng);
  let opening = openRaw
    .replace("{guidance}", guidanceSafe)
    .replace("{tips}", guidanceSafe)
    .replace("{cta}", ctaText);
  opening = squashSpaces(opening);

  const parts =
    profile === "long"
      ? [diag, ana, res, opening]
      : [diag, res, opening];

  const out = parts.filter(Boolean).join(joiner);
  return postSafetyFilter(out, lang);
}

/* ------------------------- Helpers d’extension ---------------------------- */

export function addVariant(
  lang: Lang,
  confidence: Confidence,
  stage: keyof Bucket,
  phrase: string
) {
  pool[lang][confidence][stage].push(phrase);
}

export function getPool() {
  return pool;
      }
