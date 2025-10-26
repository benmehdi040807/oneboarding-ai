// lib/ocrPhrases.ts
//
// Pool de formulations premium pour les réponses liées à une lecture d’image/document.
// Objectif : supprimer le ressenti d’erreur technique et instaurer un ton d’expertise,
// avec un fil narratif constant : diagnostic → analyse → restitution → ouverture.
//
// - Multilingue : fr (complet), en/ar (désormais complet, 7 variantes/étape)
// - Variantes étiquetées par niveau de confiance : "high" | "medium" | "low"
// - API principale : formatResponse({ lang, confidence, summary, tips, seed })
//
// Usage suggéré côté LLM / UI :
//   import { formatResponse } from "@/lib/ocrPhrases";
//   const message = formatResponse({
//     lang: "fr",
//     confidence: "medium",
//     summary: "Relevé d’informations clés (montants, dates, références).",
//     tips: "Si possible, recadrez la page et vérifiez la luminosité.",
//   });
//
// NB : Par choix, le mot « OCR » n’apparaît nulle part. On parle de « lecture » / « analyse ».
// NB 2 : Les placeholders {summary} / {tips} sont injectés par formatResponse si fournis.

export type Lang = "fr" | "en" | "ar";
export type Confidence = "high" | "medium" | "low";

type Bucket = {
  diagnostic: string[];
  analysis: string[];
  restitution: string[]; // accepte {summary}
  opening: string[];     // accepte {tips}
};

type Pool = Record<Lang, Record<Confidence, Bucket>>;

// Petite RNG déterministe (optionnelle) pour varier les formulations tout en gardant une trace.
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

// --------------------------------------------------------------------------
// POOL DE PHRASES
// FR : 7 variantes par étape (haut/medium/bas).
// EN/AR : désormais 7 variantes par étape (haut/medium/bas).
// --------------------------------------------------------------------------

const pool: Pool = {
  fr: {
    high: {
      diagnostic: [
        "La lecture est nette et suffisamment complète pour avancer sereinement.",
        "Nous disposons d’une base lisible et fiable pour poursuivre l’analyse.",
        "La capture présente une qualité solide : la compréhension est au rendez-vous.",
        "Le document est clair : les éléments majeurs émergent sans ambiguïté.",
        "La matière est bien restituée : on peut se concentrer sur l’essentiel.",
        "L’ensemble est cohérent et propre : rien n’empêche d’aller au bout.",
        "La qualité de lecture permet une analyse précise dès maintenant."
      ],
      analysis: [
        "J’isole les repères utiles (dates, montants, identifiants) et les relations entre sections.",
        "Je hiérarchise l’information pour distinguer les points clés des détails annexes.",
        "J’organise les éléments en segments compréhensibles pour garder le fil logique.",
        "Je consolide les données afin d’obtenir une vision structurée et exploitable.",
        "Je recoupe les mentions importantes et vérifie leur cohérence contextuelle.",
        "Je synthétise les informations majeures en gardant l’intention initiale du document.",
        "Je transforme le contenu en un résumé opérationnel, prêt à l’emploi."
      ],
      restitution: [
        "Voici l’essentiel : {summary}",
        "En clair, à retenir : {summary}",
        "Synthèse exploitable : {summary}",
        "Points clés identifiés : {summary}",
        "Résultat net et précis : {summary}",
        "Résumé immédiatement actionnable : {summary}",
        "Contenu maîtrisé : {summary}"
      ],
      opening: [
        "Besoin d’aller plus loin ? {tips}",
        "Souhaitez-vous un plan d’action immédiat ? {tips}",
        "Je peux détailler chaque point si nécessaire. {tips}",
        "Vous voulez un export prêt à partager ? {tips}",
        "Je peux produire une version structurée par thème. {tips}",
        "On passe en mode opérationnel quand vous voulez. {tips}",
        "Dites-moi le format souhaité (mail, note, liste). {tips}"
      ]
    },
    medium: {
      diagnostic: [
        "La lecture est globalement claire ; quelques zones peuvent gagner en netteté.",
        "L’essentiel est lisible, même si certaines parties sont moins contrastées.",
        "On voit l’idée générale ; un cadrage plus franc améliorerait encore le résultat.",
        "La qualité suffit pour une synthèse fiable, malgré de légères imprécisions.",
        "Le document est utilisable tel quel ; un éclairage plus homogène serait un plus.",
        "Le rendu est correct : on peut avancer avec confiance.",
        "Base satisfaisante : les informations majeures ressortent bien."
      ],
      analysis: [
        "Je dégage la structure du document et les mentions saillantes.",
        "Je regroupe les données par thèmes afin d’en faciliter la lecture.",
        "Je fais émerger les priorités et clarifie les points de contexte.",
        "Je rapproche les éléments essentiels pour une vue d’ensemble cohérente.",
        "Je lis entre les lignes pour restituer l’intention principale.",
        "Je convertis le contenu en étapes concrètes et compréhensibles.",
        "Je simplifie sans perte pour garder l’utile."
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
        "Pour affiner encore, {tips}",
        "Je peux préciser chaque point si besoin. {tips}",
        "Besoin d’un format différent ? {tips}",
        "On peut enrichir la synthèse à partir d’autres pages. {tips}",
        "Dites-moi où vous voulez approfondir. {tips}",
        "Je prépare un livrable court si vous le souhaitez. {tips}",
        "On passe à la suite quand vous êtes prêt. {tips}"
      ]
    },
    low: {
      diagnostic: [
        "La lecture est partielle : quelques éléments manquent de netteté.",
        "Le rendu est exploitable, mais certaines zones sont difficiles à distinguer.",
        "La capture est imparfaite ; nous pouvons néanmoins en extraire l’essentiel.",
        "La qualité pose quelques limites, tout en laissant apparaître le fond.",
        "Le document est incomplet visuellement, mais des repères utiles ressortent.",
        "Plusieurs segments sont atténués ; je m’appuie sur ce qui est lisible.",
        "La lisibilité fluctue : je me concentre sur les zones claires."
      ],
      analysis: [
        "Je priorise les repères fiables et j’évite toute interprétation hasardeuse.",
        "Je consolide ce qui est net et signale ce qui reste ambigu.",
        "Je structure les éléments exploitables sans sur-interpréter.",
        "Je donne la priorité aux mentions confirmées et aux valeurs visibles.",
        "J’extrais le cœur du message et je laisse de côté les parties incertaines.",
        "Je clarifie l’intention générale à partir des indices les plus sûrs.",
        "Je synthétise prudemment pour préserver la fiabilité."
      ],
      restitution: [
        "Ce qui ressort de façon sûre : {summary}",
        "Lecture prudente — éléments fiables : {summary}",
        "Extraction confirmée : {summary}",
        "Ce que l’on peut valider : {summary}",
        "Synthèse à partir des zones nettes : {summary}",
        "Points établis sans ambiguïté : {summary}",
        "Vue utile et fiable : {summary}"
      ],
      opening: [
        "Pour un rendu impeccable, {tips}",
        "Je peux relire une version mieux cadrée si vous en disposez. {tips}",
        "Si possible, renvoyez une photo plus lumineuse. {tips}",
        "Un second cliché peut compléter ce qui manque. {tips}",
        "Souhaitez-vous que je prépare une check-list de reprise ? {tips}",
        "On peut affiner dès que vous avez une version plus nette. {tips}",
        "Prêt à itérer avec vous. {tips}"
      ]
    }
  },

  // EN (complet — 7 variantes par étape)
  en: {
    high: {
      diagnostic: [
        "The reading is clear and sufficiently complete to proceed with confidence.",
        "We have a solid, legible base to continue the analysis.",
        "The capture is crisp: key elements stand out without ambiguity.",
        "The document is clean and coherent; we can focus on the substance.",
        "Quality is strong enough to enable precise interpretation now.",
        "The material is well captured: nothing prevents us from going all the way.",
        "Clarity is high, allowing a confident, accurate review."
      ],
      analysis: [
        "I extract key signals (dates, amounts, references) and map their relations.",
        "I prioritize what matters and distinguish highlights from context.",
        "I organize content into digestible segments to preserve the logic.",
        "I consolidate data to form a structured, usable view.",
        "I cross-check important mentions and ensure contextual consistency.",
        "I distill the core information while preserving intent.",
        "I transform the content into an operational, ready-to-use summary."
      ],
      restitution: [
        "Here’s the essence: {summary}",
        "In short, what matters: {summary}",
        "Actionable summary: {summary}",
        "Key points identified: {summary}",
        "Clear, precise result: {summary}",
        "Practical overview: {summary}",
        "Mastered content: {summary}"
      ],
      opening: [
        "Want to go further? {tips}",
        "Shall I outline an immediate action plan? {tips}",
        "I can expand each point as needed. {tips}",
        "Prefer a shareable brief? {tips}",
        "I can structure it by themes if you wish. {tips}",
        "Ready to switch to execution mode. {tips}",
        "Tell me your preferred format (email, memo, list). {tips}"
      ]
    },
    medium: {
      diagnostic: [
        "Overall, the reading is clear; a few areas could be sharper.",
        "The essentials are legible, though some sections are lower contrast.",
        "The main idea is visible; tighter framing would enhance the result.",
        "Quality is sufficient for a reliable synthesis, despite minor flaws.",
        "Usable as is; more even lighting would be a plus.",
        "The result is sound: we can move forward with confidence.",
        "A solid base: the primary information stands out well."
      ],
      analysis: [
        "I surface the structure and the salient mentions.",
        "I group information by theme to improve readability.",
        "I highlight priorities and clarify the context.",
        "I connect the essentials to present a coherent overview.",
        "I read for intent and preserve the document’s core message.",
        "I convert the content into simple, concrete steps.",
        "I simplify without losing what matters."
      ],
      restitution: [
        "Priority takeaways: {summary}",
        "The essentials, briefly: {summary}",
        "Clear synthesis: {summary}",
        "High-level overview: {summary}",
        "Faithful summary: {summary}",
        "Main points: {summary}",
        "Reorganized content: {summary}"
      ],
      opening: [
        "To refine further, {tips}",
        "I can clarify any point on request. {tips}",
        "Need a different format? {tips}",
        "We can enrich this with additional pages. {tips}",
        "Tell me where you want to go deeper. {tips}",
        "I can prepare a short deliverable if useful. {tips}",
        "We proceed whenever you’re ready. {tips}"
      ]
    },
    low: {
      diagnostic: [
        "Reading is partial: a few areas lack clarity.",
        "Usable, though some zones are hard to distinguish.",
        "The capture is imperfect; we can still extract the core.",
        "Quality imposes some limits, yet the substance is visible.",
        "Visually incomplete, but useful markers stand out.",
        "Several segments are faint; I’ll focus on what’s clear.",
        "Legibility varies; I rely on the most readable parts."
      ],
      analysis: [
        "I prioritize confirmed signals and avoid risky interpretations.",
        "I consolidate what’s clear and flag what remains uncertain.",
        "I structure usable elements without over-interpreting.",
        "I focus on confirmed mentions and visible values.",
        "I extract the core message and set aside ambiguous parts.",
        "I infer the general intent from the safest clues.",
        "I synthesize cautiously to preserve reliability."
      ],
      restitution: [
        "What we can state confidently: {summary}",
        "Prudent reading — confirmed elements: {summary}",
        "Validated extraction: {summary}",
        "What can be affirmed: {summary}",
        "Synthesis from clear regions: {summary}",
        "Unambiguous points: {summary}",
        "Useful, reliable view: {summary}"
      ],
      opening: [
        "For a clean result, {tips}",
        "I can review a better-framed version if available. {tips}",
        "If possible, send a brighter photo. {tips}",
        "A second shot can complement what’s missing. {tips}",
        "Shall I prepare a short recovery checklist? {tips}",
        "We can refine as soon as you have a clearer version. {tips}",
        "Ready to iterate with you. {tips}"
      ]
    }
  },

  // AR (complet — 7 variantes par étape)
  ar: {
    high: {
      diagnostic: [
        "القراءة واضحة وكافية للمتابعة بثقة.",
        "لدينا قاعدة مقروءة ومتماسكة تتيح تحليلًا دقيقًا.",
        "الالتقاط واضح: العناصر الأساسية ظاهرة بلا لبس.",
        "المستند نظيف ومتّسق؛ يمكننا التركيز على الجوهر.",
        "الجودة مرتفعة بما يسمح بفهم دقيق من الآن.",
        "المحتوى مستعاد بشكل جيد؛ لا شيء يمنع إتمام التحليل.",
        "درجة الوضوح عالية وتمنحنا مراجعة واثقة."
      ],
      analysis: [
        "أستخرج المؤشرات المهمة (تواريخ، مبالغ، مراجع) وأربط بينها.",
        "أرتّب الأولويات وأفصل بين الأساسيات والسياق.",
        "أنظّم المحتوى في مقاطع سهلة الفهم للحفاظ على التسلسل.",
        "أدمج البيانات لتكوين رؤية منظمة وقابلة للاستخدام.",
        "أطابق الذِكر المهم وأتحقق من اتساق السياق.",
        "أكثّف المعلومات الجوهرية مع الحفاظ على مقصد المستند.",
        "أحوّل المحتوى إلى خلاصة عملية جاهزة للتطبيق."
      ],
      restitution: [
        "الخلاصة: {summary}",
        "باختصار، الأهم: {summary}",
        "ملخص قابل للتطبيق: {summary}",
        "النقاط الرئيسية: {summary}",
        "نتيجة واضحة ودقيقة: {summary}",
        "نظرة عملية سريعة: {summary}",
        "عرض متقن للمحتوى: {summary}"
      ],
      opening: [
        "هل ترغب بالمتابعة بخطوة أعمق؟ {tips}",
        "أقترح خطة تنفيذ فورية إن رغبت. {tips}",
        "أستطيع تفصيل كل نقطة حسب الحاجة. {tips}",
        "تفضّل ملخصًا قابلاً للمشاركة؟ {tips}",
        "أعيد الهيكلة حسب المحاور إن شئت. {tips}",
        "جاهز للانتقال إلى التنفيذ. {tips}",
        "اختر الصيغة المفضلة لديك (بريد، مذكرة، قائمة). {tips}"
      ]
    },
    medium: {
      diagnostic: [
        "القراءة إجمالًا واضحة؛ بعض المواضع يمكن تحسين حدتها.",
        "الأساسيات مقروءة رغم تفاوت بسيط في الإضاءة.",
        "الفكرة العامة حاضرة؛ تأطير أدق سيحسّن النتيجة.",
        "الجودة تسمح بملخص موثوق مع بعض الهفوات الطفيفة.",
        "قابلة للاستخدام كما هي؛ توحيد الإضاءة سيكون إضافة.",
        "النتيجة جيدة ونستطيع المتابعة بثقة.",
        "قاعدة مرضية: تظهر المعلومات الرئيسية بوضوح."
      ],
      analysis: [
        "أُبرز البنية العامة والمواضع اللافتة.",
        "أجمع المعلومات في محاور لتسهيل القراءة.",
        "أحدد الأولويات وأوضح السياق الأساسي.",
        "أصل العناصر المهمة لتكوين رؤية متسقة.",
        "أحافظ على مقصد النص وأستخلص جوهره.",
        "أحوّل المحتوى إلى خطوات واضحة ومباشرة.",
        "أبسط دون إهدار لما هو مهم."
      ],
      restitution: [
        "الأولويات باختصار: {summary}",
        "الأساسيات بإيجاز: {summary}",
        "ملخص واضح: {summary}",
        "نظرة عامة عليا: {summary}",
        "خلاصة أمينة: {summary}",
        "أهم النقاط: {summary}",
        "إعادة تنظيم موجزة: {summary}"
      ],
      opening: [
        "لتحسين أدق، {tips}",
        "يمكنني توضيح أي نقطة تطلبها. {tips}",
        "بحاجة لصيغة مختلفة؟ {tips}",
        "نستطيع الإثراء بمزيد من الصفحات. {tips}",
        "أخبرني أين تريد التعمّق. {tips}",
        "أعدّ لك موجزًا قصيرًا إن رغبت. {tips}",
        "نُكمل حين تكون جاهزًا. {tips}"
      ]
    },
    low: {
      diagnostic: [
        "القراءة جزئية: بعض المواضع تفتقر للوضوح.",
        "قابلة للاستخدام، مع صعوبة في تمييز بعض المناطق.",
        "الالتقاط غير مثالي؛ ما زال بالإمكان استخراج الجوهر.",
        "الجودة تفرض حدودًا، لكن المعنى العام ظاهر.",
        "المشهد ناقص بصريًا، وإن بدت مؤشرات مفيدة.",
        "تبدو مقاطع عدّة باهتة؛ أركّز على الأوضح.",
        "درجة المقروئية متفاوتة؛ أعتمد على الأجزاء الأنسب."
      ],
      analysis: [
        "أعطي الأولوية للعلامات المؤكدة وأتجنب التأويل الزائد.",
        "أثبت الواضح وأشير إلى ما بقي ملتبسًا.",
        "أنظم العناصر القابلة للاستخدام دون إفراط في الاستنتاج.",
        "أركّز على الذِكر المؤكد والقيم الظاهرة.",
        "أستخرج اللب وأستبعد ما تشوبه الريبة.",
        "أستدل على المقصد العام من أوثق القرائن.",
        "ألخّص بحذر حفاظًا على الموثوقية."
      ],
      restitution: [
        "ما يمكن الجزم به بثقة: {summary}",
        "قراءة متأنية — عناصر مؤكدة: {summary}",
        "استخلاص موثّق: {summary}",
        "ما يمكن إثباته: {summary}",
        "تلخيص من المناطق الأوضح: {summary}",
        "نقاط غير ملتبسة: {summary}",
        "رؤية مفيدة وموثوقة: {summary}"
      ],
      opening: [
        "لنتيجة أنقى، {tips}",
        "يمكنني إعادة القراءة مع نسخة مُحكمة الإطار. {tips}",
        "إن أمكن، أرسل صورة أكثر سطوعًا. {tips}",
        "لقطة ثانية قد تُكمل ما ينقص. {tips}",
        "هل أعدّ لك قائمة متابعة قصيرة؟ {tips}",
        "يمكننا تحسينها فور توفّر نسخة أوضح. {tips}",
        "جاهز للتدرّج معك. {tips}"
      ]
    }
  }
};

// --------------------------------------------------------------------------
// API
// --------------------------------------------------------------------------

export function formatResponse(args: {
  lang: Lang;
  confidence: Confidence;
  summary?: string; // injecté dans {summary}
  tips?: string;    // injecté dans {tips}
  seed?: number;    // pour variabilité déterministe
  joiner?: string;  // séparateur entre phrases
}): string {
  const {
    lang,
    confidence,
    summary = "",
    tips = "si possible, capturez une page bien cadrée et lumineuse.",
    seed,
    joiner = " "
  } = args;

  const langPool = pool[lang];
  if (!langPool) throw new Error(`Unsupported lang: ${lang}`);
  const bucket = langPool[confidence];
  if (!bucket) throw new Error(`Unsupported confidence: ${confidence}`);

  const rng = typeof seed === "number" ? mulberry32(seed) : undefined;

  const diag = pick(bucket.diagnostic, rng);
  const ana = pick(bucket.analysis, rng);
  const res = pick(bucket.restitution, rng).replace("{summary}", summary);
  const open = pick(bucket.opening, rng).replace("{tips}", tips);

  // 4 phrases, ton expert, sans jargon
  return [diag, ana, res, open].filter(Boolean).join(joiner);
}

// Helpers pour étendre facilement le pool
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
