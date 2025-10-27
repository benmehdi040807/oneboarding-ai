// lib/txtPhrases.ts
//
// Pool de formulations premium pour les réponses IA liées à des entrées texte
// (saisie directe ou audio transcrit). Objectif : maintenir un ton d’expertise
// constant avec le fil narratif : diagnostic → analyse → restitution → ouverture.
// - Multilingue : fr / en / ar
// - 7 variantes par niveau (high / medium / low) et par étape
// - Ouverture libre : CTA optionnels (désactivés par défaut)
//
// API principale : formatResponse({ lang, confidence, summary, guidance, tips, includeCta, ctaOptions, seed, joiner })
//
// Exemple :
//   import { formatResponse } from "@/lib/txtPhrases";
//   const msg = formatResponse({
//     lang: "fr",
//     confidence: "medium",
//     summary: "Les points clés X / Y, puis recommandations Z.",
//     guidance: "Si vous voulez, je peux développer le point Y.",
//     // tips est un alias souple ; si guidance est vide, tips est utilisé.
//     tips: "Menu → Mon historique : enregistrer ou partager.",
//     includeCta: false, // par défaut : false (ouverture non « pushy »)
//   });
//
// Notes :
// - Le mot « erreur » est proscrit. On privilégie : “lecture prudente”, “analyse partielle”, etc.
// - {summary} est injecté dans la phase “restitution”.
// - {guidance} et {cta} peuvent être mentionnés dans “ouverture” selon includeCta et guidance.
// - {tips} est aussi pris en charge si présent dans les formulations.

export type Lang = "fr" | "en" | "ar";
export type Confidence = "high" | "medium" | "low";
export type CtaKind = "copy" | "save" | "share";

type Bucket = {
  diagnostic: string[];
  analysis: string[];
  restitution: string[]; // accepte {summary}
  opening: string[];     // accepte {guidance} / {tips} et {cta}
};

type Pool = Record<Lang, Record<Confidence, Bucket>>;

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
    const hint = hasSave || hasShare ? " depuis Menu → Mon historique" : "";
    return `Vous pouvez ${list}${hint}.`;
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
    const hint = hasSave || hasShare ? " from Menu → My history" : "";
    return `You can ${list}${hint}.`;
  }

  // ar
  {
    const bits: string[] = [];
    if (hasCopy) bits.push("نسخ الإجابة");
    if (hasSave) bits.push("حفظها");
    if (hasShare) bits.push("مشاركتها");
    const list =
      bits.length === 1 ? bits[0] :
      bits.length === 2 ? `${bits[0]} أو ${bits[1]}` :
      `${bits[0]}، ${bits[1]} أو ${bits[2]}`;
    const hint = hasSave || hasShare ? " من القائمة → السجل" : "";
    return `بإمكانك ${list}${hint}.`;
  }
}

/* ------------------------------ POOL (7x) --------------------------------- */
/* 7 variantes par étape et par niveau — FR/EN/AR. Ton premium, posé, expert. */

const pool: Pool = {
  fr: {
    high: {
      diagnostic: [
        "Votre demande est claire et bien cadrée : nous pouvons avancer sereinement.",
        "Le contexte est net et suffisant pour une réponse de haut niveau.",
        "Les éléments fournis sont précis : passons directement à l’essentiel.",
        "Bonne base : la compréhension est complète et sans ambiguïté.",
        "Le sujet est bien posé ; nous pouvons dérouler une analyse aboutie.",
        "La formulation est solide : je peux entrer immédiatement dans le fond.",
        "Tout est en place pour une synthèse claire et opérationnelle."
      ],
      analysis: [
        "Je structure la matière, isole les concepts clés et relie les dépendances.",
        "J’organise les points en séquences logiques et hiérarchisées.",
        "Je clarifie le cadre, ordonne les priorités et balise les étapes.",
        "Je mets en perspective les idées fortes et réduis le bruit contextuel.",
        "Je synthétise l’essentiel et prépare des transitions lisibles.",
        "Je consolide le raisonnement afin d’aboutir à un rendu net et actionnable.",
        "Je transforme le fond en un plan compréhensible et directement utile."
      ],
      restitution: [
        "Voici l’essentiel : {summary}",
        "En clair, à retenir : {summary}",
        "Résumé exploitable : {summary}",
        "Points clés : {summary}",
        "Synthèse nette : {summary}",
        "Contenu maîtrisé : {summary}",
        "Vision d’ensemble : {summary}"
      ],
      opening: [
        "Souhaitez-vous approfondir un volet précis ? {guidance} {cta}",
        "Je peux détailler chaque section selon votre priorité. {guidance} {cta}",
        "Dites-moi sur quel axe vous voulez prolonger. {guidance} {cta}",
        "Je peux produire une version plus fouillée, point par point. {guidance} {cta}",
        "Prêt à passer en mode opérationnel si besoin. {guidance} {cta}",
        "Besoin d’un livrable prêt à partager ? {guidance} {cta}",
        "Nous pouvons itérer rapidement sur les parties qui comptent. {guidance} {cta}"
      ]
    },
    medium: {
      diagnostic: [
        "Votre demande est globalement claire ; quelques zones gagneront à être précisées.",
        "Le cadre est compréhensible ; je consolide l’essentiel pour avancer.",
        "On perçoit bien l’intention ; j’organise les éléments utiles.",
        "La base est suffisante pour une synthèse fiable et lisible.",
        "Contexte pertinent : je procède à une clarification progressive.",
        "Nous avons de quoi établir une réponse structurée.",
        "L’ensemble permet une analyse sereine avec quelques nuances."
      ],
      analysis: [
        "Je regroupe les informations par thèmes et fais émerger les priorités.",
        "Je simplifie la trame en conservant les points saillants.",
        "Je relie les idées et réduis les redondances.",
        "Je donne un ordre de lecture logique et progressif.",
        "Je convertis les éléments en étapes concrètes.",
        "Je clarifie la terminologie et les relations clés.",
        "Je construis une progression fluide vers la conclusion."
      ],
      restitution: [
        "À retenir en priorité : {summary}",
        "L’essentiel, en bref : {summary}",
        "Synthèse claire : {summary}",
        "Vue d’ensemble : {summary}",
        "Résumé fidèle : {summary}",
        "Points principaux : {summary}",
        "Contenu réorganisé : {summary}"
      ],
      opening: [
        "Pour affiner encore, je peux préciser certains points. {guidance} {cta}",
        "Souhaitez-vous des exemples ciblés ? {guidance} {cta}",
        "On peut détailler une section si vous le jugez utile. {guidance} {cta}",
        "Je peux proposer un plan d’action court. {guidance} {cta}",
        "Indiquez-moi la partie à approfondir. {guidance} {cta}",
        "Je peux produire une version plus compacte ou plus détaillée. {guidance} {cta}",
        "À votre rythme, nous itérons. {guidance} {cta}"
      ]
    },
    low: {
      diagnostic: [
        "Votre demande est partiellement explicite ; j’avance avec une lecture prudente.",
        "Le contexte présente quelques zones floues ; je m’appuie sur ce qui est solide.",
        "La formulation laisse place à interprétation ; je privilégie la clarté utile.",
        "Certains éléments restent implicites ; je mets en avant les points confirmés.",
        "Je retiens les signaux les plus fiables et évite les extrapolations.",
        "La compréhension progresse, même si quelques précisions seraient utiles.",
        "Je garde un cap sûr en m’appuyant sur les marques les plus nettes."
      ],
      analysis: [
        "Je priorise les repères confirmés et structure une trame lisible.",
        "Je réduis les ambiguïtés et consolide une base exploitable.",
        "J’unifie la lecture en évitant toute sur-interprétation.",
        "Je clarifie l’intention générale et maintiens un fil logique.",
        "Je mets en cohérence les éléments visibles et utiles.",
        "Je propose une synthèse ferme sur les parties fiables.",
        "Je fais ressortir l’essentiel sans forcer les zones incertaines."
      ],
      restitution: [
        "Ce qui ressort avec fiabilité : {summary}",
        "Lecture prudente — éléments solides : {summary}",
        "Extraction confirmée : {summary}",
        "Points validés : {summary}",
        "Synthèse à partir du certain : {summary}",
        "Repères utiles et sûrs : {summary}",
        "Vue fiable : {summary}"
      ],
      opening: [
        "Si vous souhaitez, je peux préciser en fonction d’exemples concrets. {guidance} {cta}",
        "On peut lever les ambiguïtés avec un peu plus de contexte. {guidance} {cta}",
        "Je peux compléter dès que vous me donnez un angle plus précis. {guidance} {cta}",
        "Prêt à itérer pour aboutir à une version plus riche. {guidance} {cta}",
        "Je peux formuler des variantes selon l’usage visé. {guidance} {cta}",
        "Nous pouvons étendre la synthèse en ajoutant des éléments ciblés. {guidance} {cta}",
        "Dès que vous le souhaitez, on approfondit. {guidance} {cta}"
      ]
    }
  },

  en: {
    high: {
      diagnostic: [
        "Your request is clear and well-framed: we can proceed confidently.",
        "The context is sharp and sufficient for a high-quality answer.",
        "The input is precise — let’s focus on what matters most.",
        "Strong basis: understanding is complete and unambiguous.",
        "The topic is well defined; we can deliver a thorough analysis.",
        "Solid formulation: I can dive straight into substance.",
        "Everything is in place for a crisp, actionable synthesis."
      ],
      analysis: [
        "I structure the material, surface key concepts, and map dependencies.",
        "I organize the points into a coherent, prioritized sequence.",
        "I clarify the scope, order priorities, and mark the steps.",
        "I highlight core ideas while reducing contextual noise.",
        "I compress the essentials and prepare readable transitions.",
        "I consolidate the reasoning to reach a precise, usable output.",
        "I turn the content into a practical, ready-to-use plan."
      ],
      restitution: [
        "Here’s the essence: {summary}",
        "In short, what to keep in mind: {summary}",
        "Actionable summary: {summary}",
        "Key points: {summary}",
        "Clean synthesis: {summary}",
        "Mastered content: {summary}",
        "Big-picture view: {summary}"
      ],
      opening: [
        "Would you like to deepen a specific angle? {guidance} {cta}",
        "I can expand any section you prioritize. {guidance} {cta}",
        "Tell me which thread to extend. {guidance} {cta}",
        "I can produce a more granular version, step by step. {guidance} {cta}",
        "Ready to switch to an operational plan if needed. {guidance} {cta}",
        "Need a shareable brief? {guidance} {cta}",
        "We can iterate quickly on what matters most. {guidance} {cta}"
      ]
    },
    medium: {
      diagnostic: [
        "Your request is mostly clear; a few areas could benefit from refinement.",
        "The frame is understandable; I’ll consolidate the essentials.",
        "The intent is visible; I’ll organize the useful elements.",
        "The basis is sufficient for a reliable summary.",
        "Relevant context: I’ll clarify progressively.",
        "We have enough to produce a structured answer.",
        "Overall, the material supports a calm, nuanced analysis."
      ],
      analysis: [
        "I group information by themes and surface priorities.",
        "I simplify the storyline while preserving salient points.",
        "I connect ideas and reduce redundancies.",
        "I provide a logical, progressive reading order.",
        "I convert elements into concrete steps.",
        "I clarify terminology and key relations.",
        "I build a smooth progression to the conclusion."
      ],
      restitution: [
        "Main takeaways: {summary}",
        "In brief: {summary}",
        "Clear synthesis: {summary}",
        "Overview: {summary}",
        "Faithful summary: {summary}",
        "Primary points: {summary}",
        "Reorganized content: {summary}"
      ],
      opening: [
        "To refine further, I can expand selected parts. {guidance} {cta}",
        "Would examples help? {guidance} {cta}",
        "We can detail any section you find useful. {guidance} {cta}",
        "I can propose a short action plan. {guidance} {cta}",
        "Point me to the area you want to deepen. {guidance} {cta}",
        "I can deliver a more compact or more detailed version. {guidance} {cta}",
        "We’ll iterate at your pace. {guidance} {cta}"
      ]
    },
    low: {
      diagnostic: [
        "Your request is partly explicit; I’ll proceed with a careful reading.",
        "Some areas are fuzzy; I’ll rely on the most solid signals.",
        "There’s room for interpretation; I’ll favor clear, useful ground.",
        "A few elements remain implicit; I’ll surface confirmed points.",
        "I’ll prioritize reliable cues and avoid over-extrapolation.",
        "Understanding moves forward, though details would help.",
        "I’ll keep a steady course using the sharpest markers."
      ],
      analysis: [
        "I prioritize confirmed anchors and build a readable structure.",
        "I reduce ambiguities and consolidate a usable base.",
        "I unify the reading while avoiding over-interpretation.",
        "I clarify the general intent and maintain a logical flow.",
        "I align visible, useful elements into coherence.",
        "I propose a firm synthesis of the most reliable parts.",
        "I bring out the essentials without forcing uncertain areas."
      ],
      restitution: [
        "What stands out reliably: {summary}",
        "Careful reading — solid elements: {summary}",
        "Confirmed extraction: {summary}",
        "Validated points: {summary}",
        "Synthesis from the certain: {summary}",
        "Useful, reliable anchors: {summary}",
        "Trustworthy view: {summary}"
      ],
      opening: [
        "If you wish, I can add clarity with targeted examples. {guidance} {cta}",
        "We can lift ambiguities with a bit more context. {guidance} {cta}",
        "I can complete this as soon as you share a sharper angle. {guidance} {cta}",
        "Ready to iterate toward a richer version. {guidance} {cta}",
        "I can draft alternatives based on your intended use. {guidance} {cta}",
        "We can extend the synthesis with focused additions. {guidance} {cta}",
        "Whenever you’re ready, we’ll deepen it. {guidance} {cta}"
      ]
    }
  },

  ar: {
    high: {
      diagnostic: [
        "طلبك واضح ومضبوط؛ يمكننا المتابعة بثقة.",
        "السياق دقيق وكافٍ لإجابة رفيعة المستوى.",
        "المعطيات محددة — نركّز مباشرة على الجوهر.",
        "أساس قوي: الفهم كامل وبدون التباس.",
        "الموضوع محدّد جيدًا؛ سنقدّم تحليلًا متكاملًا.",
        "الصياغة متينة: يمكنني الدخول مباشرةً في الجوهر.",
        "كل العناصر متوفّرة لملخص واضح وقابل للتنفيذ."
      ],
      analysis: [
        "أنسّق المادة، وأستخرج المفاهيم الأساسية، وأربط الاعتمادات.",
        "أنظم النقاط في تسلسل منطقي ومُرتّب حسب الأولوية.",
        "أوضّح الإطار، وأرتّب الأولويات، وأحدّد المراحل.",
        "أبرز الأفكار المحورية وأخفّف الضجيج السياقي.",
        "أكثّف المهم وأجهّز انتقالات سلسة.",
        "أوحّد الاستدلال للوصول إلى مخرج دقيق وعملي.",
        "أحوّل المحتوى إلى خطة قابلة للتطبيق فورًا."
      ],
      restitution: [
        "الخلاصة: {summary}",
        "باختصار، الأهم: {summary}",
        "ملخّص عملي: {summary}",
        "النقاط الأساسية: {summary}",
        "تركيب واضح: {summary}",
        "محتوى مضبوط: {summary}",
        "نظرة شاملة: {summary}"
      ],
      opening: [
        "هل تود تعميق محور محدّد؟ {guidance} {cta}",
        "أستطيع توسيع أي جزء تحدّده. {guidance} {cta}",
        "أخبرني بالخيط الذي تريد متابعته. {guidance} {cta}",
        "يمكنني إعداد نسخة أكثر تفصيلاً خطوة بخطوة. {guidance} {cta}",
        "جاهز للتحوّل إلى خطة تنفيذية عند الحاجة. {guidance} {cta}",
        "تريد موجزًا قابلًا للمشاركة؟ {guidance} {cta}",
        "نستطيع التكرار بسرعة على ما يهمّك. {guidance} {cta}"
      ]
    },
    medium: {
      diagnostic: [
        "طلبك واضح إجمالًا؛ بعض المواضع تستفيد من مزيد من الضبط.",
        "الإطار مفهوم؛ سأوحّد الأساسيات للمضي قدمًا.",
        "النيّة ظاهرة؛ سأرتّب العناصر المفيدة.",
        "الأساس كافٍ لملخّص موثوق.",
        "سياق مناسب؛ سأوضح تدريجيًا.",
        "لدينا ما يكفي لإجابة منظّمة.",
        "المعطيات تتيح تحليلًا هادئًا مع بعض الدقائق."
      ],
      analysis: [
        "أجمع المعلومات حسب المحاور وأبرز الأولويات.",
        "أبسط السرد مع الحفاظ على النقاط البارزة.",
        "أربط الأفكار وأقلّل التكرار.",
        "أقدّم ترتيبًا منطقيًا متدرّجًا للقراءة.",
        "أحوّل العناصر إلى خطوات عملية.",
        "أوضح المصطلحات والعلاقات الأساسية.",
        "أبني تدرّجًا سلسًا نحو الخلاصة."
      ],
      restitution: [
        "أهمّ ما ينبغي ملاحظته: {summary}",
        "باختصار: {summary}",
        "ملخّص واضح: {summary}",
        "نظرة عامة: {summary}",
        "ملخّص موثوق: {summary}",
        "النقاط الرئيسية: {summary}",
        "محتوى معاد ترتيبه: {summary}"
      ],
      opening: [
        "للمزيد من الضبط، أستطيع توسيع الأجزاء التي تختارها. {guidance} {cta}",
        "هل تفيد أمثلة مركّزة؟ {guidance} {cta}",
        "يمكننا تفصيل أي قسم تراه مهمًا. {guidance} {cta}",
        "أستطيع اقتراح خطة عمل قصيرة. {guidance} {cta}",
        "دلّني على الجزء الذي تريد تعميقه. {guidance} {cta}",
        "أستطيع تقديم نسخة مختصرة أو موسّعة. {guidance} {cta}",
        "نواصل على راحتك. {guidance} {cta}"
      ]
    },
    low: {
      diagnostic: [
        "طلبك جزئي الوضوح؛ سأتقدّم بقراءة متأنّية.",
        "بعض المواضع غير حادّة؛ سأعتمد على العلامات الأوثق.",
        "هناك مجال للتفسير؛ سأفضّل الأرضية الواضحة والمفيدة.",
        "بعض العناصر ضمنية؛ سأظهر النقاط المؤكدة.",
        "أعطي الأولوية للمؤشرات الموثوقة وأتجنّب التوسّع الزائد.",
        "الفهم يتقدّم، مع أن بعض التفاصيل ستفيد.",
        "سأحافظ على مسار ثابت اعتمادًا على العلامات الأوضح."
      ],
      analysis: [
        "أقدّم ركائز مؤكّدة وأبني هيكلًا مقروءًا.",
        "أقلّل الالتباسات وأوحد أساسًا قابلًا للاستخدام.",
        "أوحّد القراءة مع تجنّب التفسير الزائد.",
        "أوضح القصد العام وأحافظ على تتابع منطقي.",
        "أجعل العناصر المفيدة والظاهرة في اتساق.",
        "أقترح خلاصة ثابتة لأكثر الأجزاء موثوقية.",
        "أبرز الجوهري من دون الضغط على المناطق غير الواضحة."
      ],
      restitution: [
        "ما يبرز بثقة: {summary}",
        "قراءة حذرة — عناصر ثابتة: {summary}",
        "استخلاص مؤكّد: {summary}",
        "نقاط موثوقة: {summary}",
        "خلاصة من المؤكّد: {summary}",
        "مرتكزات مفيدة: {summary}",
        "رؤية جديرة بالاعتماد: {summary}"
      ],
      opening: [
        "إذا رغبت، أضيف وضوحًا بأمثلة مركّزة. {guidance} {cta}",
        "يمكننا رفع الالتباس بمزيد من السياق. {guidance} {cta}",
        "أستكمل فور تزويدي بزوايا أوضح. {guidance} {cta}",
        "جاهز للتكرار وصولًا إلى نسخة أغنى. {guidance} {cta}",
        "أصيغ بدائل وفق الاستخدام المقصود. {guidance} {cta}",
        "نوسّع الخلاصة بإضافات مركّزة. {guidance} {cta}",
        "حين تكون مستعدًا، نعزّز التفاصيل. {guidance} {cta}"
      ]
    }
  }
};

/* ---------------------------------- API ----------------------------------- */

export function formatResponse(args: {
  lang: Lang;
  confidence: Confidence;
  summary?: string;          // injecté dans {summary}
  guidance?: string;         // injecté dans {guidance}
  tips?: string;             // alias souple ; si guidance vide, tips est utilisé
  includeCta?: boolean;      // si true, injecte un CTA dans {cta}
  ctaOptions?: CtaKind[];    // par défaut: ["copy","save","share"]
  seed?: number;             // variabilité déterministe
  joiner?: string;           // séparateur entre phrases (par défaut : " ")
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
    joiner = " "
  } = args;

  const langPool = pool[lang];
  if (!langPool) throw new Error(`Unsupported lang: ${lang}`);
  const bucket = langPool[confidence];
  if (!bucket) throw new Error(`Unsupported confidence: ${confidence}`);

  // Compat : si guidance absent/vidé mais tips fourni → utiliser tips comme guidance.
  const guidanceSafe = (guidance && guidance.trim()) ? guidance.trim() : ((tips && tips.trim()) ? tips.trim() : "");

  const rng = typeof seed === "number" ? mulberry32(seed) : undefined;

  const diag = pick(bucket.diagnostic, rng);
  const ana  = pick(bucket.analysis, rng);
  const res  = pick(bucket.restitution, rng).replace("{summary}", summary);

  const ctaText = includeCta ? buildCta(lang, ctaOptions) : "";
  const openRaw = pick(bucket.opening, rng);

  // Remplacements souples : {guidance} et/ou {tips} selon disponibilité.
  let open = openRaw
    .replace("{guidance}", guidanceSafe)
    .replace("{tips}", guidanceSafe) // support si des variantes utilisent {tips}
    .replace("{cta}", ctaText);

  open = squashSpaces(open);

  // 4 phrases, ton expert, sans jargon ni auto-flagellation.
  return [diag, ana, res, open].filter(Boolean).join(joiner);
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
