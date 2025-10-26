// lib/ocrPhrases.ts
//
// Pool de formulations premium pour les réponses liées à une lecture d’image/document.
// Objectif : supprimer le ressenti d’erreur technique et instaurer un ton d’expertise,
// avec un fil narratif constant : diagnostic → analyse → restitution → ouverture.
//
// - Multilingue : fr (complet), en/ar (de base, extensible)
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
// EN/AR : base incluse (3 variantes) — extensible facilement.
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

  // EN (base — 3 variantes par étape, extensible)
  en: {
    high: {
      diagnostic: [
        "The reading is clear and complete enough to proceed with confidence.",
        "We have a solid, legible base to move forward.",
        "The document looks crisp: key points are unambiguous."
      ],
      analysis: [
        "I extract key signals (dates, amounts, references) and their relations.",
        "I prioritize information to separate highlights from context.",
        "I consolidate data into a practical, structured overview."
      ],
      restitution: [
        "Here’s the essence: {summary}",
        "In short, what matters: {summary}",
        "Actionable summary: {summary}"
      ],
      opening: [
        "Want to go further? {tips}",
        "I can deliver a shareable brief. {tips}",
        "Tell me your preferred format. {tips}"
      ]
    },
    medium: {
      diagnostic: [
        "Overall reading is clear; a few areas could be sharper.",
        "The essentials are legible, despite mild uneven lighting.",
        "Good enough to produce a reliable summary."
      ],
      analysis: [
        "I group content into themes for clarity.",
        "I surface priorities and clarify the core intent.",
        "I connect key elements to build a coherent picture."
      ],
      restitution: [
        "Main takeaways: {summary}",
        "Clear overview: {summary}",
        "Concise summary: {summary}"
      ],
      opening: [
        "To refine further, {tips}",
        "I can expand any section you want. {tips}",
        "We can iterate as needed. {tips}"
      ]
    },
    low: {
      diagnostic: [
        "Reading is partial; some areas lack sharpness.",
        "Usable, though parts are hard to distinguish.",
        "Imperfect capture, yet the core can be extracted."
      ],
      analysis: [
        "I focus on confirmed, legible elements.",
        "I avoid over-interpreting uncertain fragments.",
        "I derive the intent from the clearest signals."
      ],
      restitution: [
        "What stands out reliably: {summary}",
        "Confirmed extraction: {summary}",
        "Prudent synthesis: {summary}"
      ],
      opening: [
        "For a flawless result, {tips}",
        "A brighter, well-framed photo helps. {tips}",
        "Happy to re-read a clearer version. {tips}"
      ]
    }
  },

  // AR (base — 3 variantes par étape, extensible)
  ar: {
    high: {
      diagnostic: [
        "القراءة واضحة وكافية للمتابعة بثقة.",
        "لدينا أساس مقروء ومتّسق للتحليل.",
        "المستند واضح؛ النقاط الرئيسية ظاهرة بلا التباس."
      ],
      analysis: [
        "أستخرج المؤشرات المهمة (تواريخ، مبالغ، مراجع) وعلاقاتها.",
        "أرتّب المعلومات لأميّز بين الأساسيات والسياق.",
        "أحوّل المحتوى إلى ملخص عملي ومنظّم."
      ],
      restitution: [
        "الخلاصة: {summary}",
        "باختصار، الأهم: {summary}",
        "ملخص قابل للتنفيذ: {summary}"
      ],
      opening: [
        "هل تود المتابعة بتفصيل أكبر؟ {tips}",
        "أستطيع إعداد ملخص جاهز للمشاركة. {tips}",
        "اختر الصيغة المناسبة لك. {tips}"
      ]
    },
    medium: {
      diagnostic: [
        "القراءة إجمالًا واضحة؛ بعض المناطق يمكن تحسين حدتها.",
        "الأساسيات مقروءة رغم تباين بسيط في الإضاءة.",
        "الجودة تسمح بملخص موثوق."
      ],
      analysis: [
        "أجمع المحتوى في محاور لتسهيل الفهم.",
        "أبرز الأولويات وأوضح الهدف الأساسي.",
        "أربط العناصر المهمة لصياغة رؤية متّسقة."
      ],
      restitution: [
        "أهم ما يجب ملاحظته: {summary}",
        "نظرة عامة واضحة: {summary}",
        "ملخص موجز: {summary}"
      ],
      opening: [
        "لتحسين أدق، {tips}",
        "يمكنني توسيع أي جزء تحتاجه. {tips}",
        "نستطيع التدرّج كما تشاء. {tips}"
      ]
    },
    low: {
      diagnostic: [
        "القراءة جزئية؛ بعض المواضع غير واضحة.",
        "قابلة للاستخدام مع صعوبة في تمييز بعض الأجزاء.",
        "الالتقاط غير مثالي، لكن يمكن استخراج الجوهر."
      ],
      analysis: [
        "أركّز على العناصر الواضحة والمؤكدة.",
        "أتجنب التفسير الزائد للأجزاء الملتبسة.",
        "أستدل بالعلامات الأوضح لاستخلاص المقصود."
      ],
      restitution: [
        "ما يبرز بثقة: {summary}",
        "استخلاص مؤكّد: {summary}",
        "تلخيص بحذر: {summary}"
      ],
      opening: [
        "لنتيجة أفضل، {tips}",
        "صورة أوضح وبإطار كامل تساعد. {tips}",
        "يسعدني إعادة القراءة مع نسخة أوضح. {tips}"
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
