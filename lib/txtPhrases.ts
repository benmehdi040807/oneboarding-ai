// lib/txtPhrases.ts
//
// Moteur de formulation OneBoarding AI (universel, single-file).
// Objectif : ton premium, structure stable, et adaptatif :
// - Réponse directe si très courte.
// - Sinon : diagnostic → analyse → restitution → ouverture.
// - Cas d’incapacité détectée : reformulation proactive (propose des alternatives concrètes).
//
// Multilingue : fr / en / ar
// Variantes : 7 par niveau (high / medium / low) et par étape (diag/analysis/restitution/opening)
// + Pools "reframe" (intro / steps / tip) pour transformer toute faiblesse en plan d’action.
//
// API (compatible) :
//   formatResponse({
//     lang,                   // "fr" | "en" | "ar"
//     confidence,             // "high" | "medium" | "low"  (obligatoire, pas d’inférence ici)
//     summary,                // ← TEXTE BRUT du modèle (pas seulement un résumé)
//     guidance,               // optionnel, injecté en ouverture si présent (jamais d’UI)
//     tips,                   // alias souple de guidance si guidance vide
//     includeCta,             // optionnel (désactivé par défaut) — formulation générique (aucune UI)
//     ctaOptions,             // ["copy","save","share"] par défaut
//     seed,                   // variabilité déterministe
//     joiner                  // séparateur, par défaut "\n\n" (espacement aéré)
//   })
//
// Comportement adaptatif interne basé sur `summary` :
//   - Détecte "incapacity" → reframe (FR/EN/AR)
//   - Sinon : short / medium / long selon longueur + structure
//
// Notes de style (charte OneBoarding AI) :
// - Jamais d’excuses (“je suis désolé”, “sorry”, “أعتذر”...).
// - Aucune référence à l’UI (pas de “Menu → …”).
// - Le CTA reste neutre et générique, et n’apparaît que si includeCta === true.

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

/* -------------------------------- Profiles -------------------------------- */

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

/* ------------------------------ Tone filter ------------------------------- */
/* Purge toute excuse et formulations faibles (FR/EN/AR). */

function purifyTone(raw: string, lang: Lang): string {
  let s = raw;

  // FR
  s = s.replace(/\bje\s+suis\s+d[ée]sol[ée]e?\b\s*,?\s*/gi, "");
  s = s.replace(/\b(?:d[ée]sol[ée]e?|je\s+m['’]excuse|pardon(?:nez-moi)?|toutes?\s+mes\s+excuses)\b\s*,?\s*/gi, "");

  // EN
  s = s.replace(/\b(i'?m\s+sorry|sorry|apologies|i\s+apologise|i\s+apologize)\b\s*,?\s*/gi, "");

  // AR
  s = s.replace(/\b(أعتذر|آسف(?:ة)?)\b\s*،?\s*/g, "");

  // Nettoyage ponctuation résiduelle + espaces
  s = s.replace(/^[,;:\s]+/, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

/* ------------------------------ CTA builder ------------------------------- */
/* Ne fait aucune référence à l’UI ; formulation sobre et générique. */

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
    return `بإمكانك ${list}.`;
  }
}

/* --------------------------- Incapacity detectors ------------------------- */

const incapacityPatterns: Record<Lang, RegExp[]> = {
  fr: [
    /\bje\s+ne\s+(?:peux|pourrai?s)\s+(?:pas|point)\b/i,
    /\bje\s+n[’']ai\s+pas\s+d[’']accès\b/i,
    /\bje\s+ne\s+dispose\s+pas\s+des?\s+informations\b/i,
    /\ben\s+t[âa]nt\s+qu[’']?IA\b/i,
  ],
  en: [
    /\bI\s+(?:can(?:not|'t)|do\s+not|don't)\s+access\b/i,
    /\bI\s+(?:cannot|can't)\s+do\b/i,
    /\bas\s+an\s+AI\b/i,
    /\bI\s+do\s+not\s+have\s+(?:access|data)\b/i,
  ],
  ar: [
    /\b(?:لا|لست)\s+أستطيع\b/,
    /\bلا\s+أملك\s+وصولاً\b/,
    /\bكوني?\s+نظاماً?\s+ذكياً?\b/,
  ],
};

/* ------------------------------ Reframe pools ----------------------------- */

const reframePool = {
  fr: {
    intro: [
      "On avance autrement :",
      "Pas de blocage, on pivote :",
      "Je propose une voie directe :",
      "Gagnons du temps ainsi :",
      "Voici l’option la plus efficace :",
      "Démarche claire et rapide :",
      "Approche actionnable dès maintenant :",
    ],
    steps: [
      "Je t’explique la méthode et tu appliques en un passage.",
      "On procède en trois temps : repérer, obtenir, vérifier.",
      "Je te donne le chemin le plus court pour récupérer l’info utile.",
      "On convertit la demande en étapes concrètes et mesurables.",
      "On requalifie l’objectif et on sécurise le résultat essentiel.",
      "Je fournis le protocole minimal pour débloquer ton besoin.",
      "On transforme la contrainte en plan d’action net.",
    ],
    tip: [
      "Tu peux coller ici les éléments obtenus : je les structure.",
      "Dès que tu as la donnée, je la mets en forme proprement.",
      "Partage le contenu brut : j’en fais une synthèse en clair.",
      "Transmets le texte tel quel : je fournis la restitution opérationnelle.",
      "Glisse les extraits : j’en déduis les points clés utiles.",
      "Envoie la matière disponible : je prépare la version exploitable.",
      "Dès réception, je rends la réponse prête à l’emploi.",
    ],
  },
  en: {
    intro: [
      "Let’s pivot cleanly:",
      "No roadblock — new route:",
      "Here’s the direct path:",
      "Fastest workable option:",
      "Actionable workaround:",
      "Practical path forward:",
      "Straight to the point:",
    ],
    steps: [
      "I’ll outline the method; you apply in one pass.",
      "Three moves: find, obtain, verify.",
      "Shortest route to get the needed signal.",
      "We turn the request into concrete, measurable steps.",
      "We reframe the goal and secure the essential output.",
      "I’ll hand you the minimal protocol to unblock.",
      "We convert the constraint into a clear action plan.",
    ],
    tip: [
      "Paste what you obtain here; I’ll structure it.",
      "Once you have the data, I’ll format it cleanly.",
      "Share raw content; I’ll deliver a clear synthesis.",
      "Drop the text as is; I’ll produce usable output.",
      "Send excerpts; I’ll extract the key points.",
      "Share any material; I’ll turn it into a deliverable.",
      "As soon as it’s in, I’ll make it ready to use.",
    ],
  },
  ar: {
    intro: [
      "نبدّل المسار بوضوح:",
      "لا عائق — طريق بديل:",
      "هذا المسار المباشر:",
      "خيار عملي سريع:",
      "حل قابل للتطبيق فورًا:",
      "طريق واقعي للمضيّ قدمًا:",
      "بخطوات محدّدة الآن:",
    ],
    steps: [
      "أعرض المنهج وتُطبّق بخطوة واحدة.",
      "ثلاث حركات: العثور، التحصيل، التحقق.",
      "أقصر طريق للحصول على الإشارة المطلوبة.",
      "نحوّل الطلب إلى خطوات عملية قابلة للقياس.",
      "نعيد صياغة الهدف ونؤمّن المخرج الأساسي.",
      "أزوّدك بالبروتوكول الأدنى لتجاوز العائق.",
      "نحوّل القيد إلى خطة تنفيذ واضحة.",
    ],
    tip: [
      "ألصق ما تحصل عليه هنا وسأعيد هيكلته.",
      "حين تتوافر البيانات، أقدّم صيغة مرتّبة.",
      "ارسل المحتوى الخام وسأقدّم خلاصة واضحة.",
      "ضع النص كما هو وسأخرِج نتيجة قابلة للاستخدام.",
      "أرسل المقاطع وسأستخلص النقاط الرئيسية.",
      "أي مادة لديك، أحوّلها إلى مخرج جاهز.",
      "ما إن تصل المعلومة، أرتّب الناتج للاستخدام.",
    ],
  },
};

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
        "Je conclus sur une réponse nette et utile."
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
        "Si vous le souhaitez, je précise avec des exemples ciblés. {guidance} {cta}",
        "On peut lever les ambiguïtés avec un peu plus de contexte. {guidance} {cta}",
        "Je complète dès que vous me donnez un angle plus précis. {guidance} {cta}",
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
  const raw = purifyTone(textRaw || "", lang);
  if (!raw) return "short";

  if (detectIncapacity(raw, lang)) return "reframe";

  const len = raw.length;
  const paras = paragraphCount(raw);
  const list = isListy(raw);

  // Heuristique simple, robuste :
  // - court : < 140 chars et 1 seul paragraphe, pas de liste
  // - long  : ≥ 900 chars OU ≥ 5 paragraphes OU liste + ≥ 600 chars
  // - sinon : medium
  if (len < 140 && paras === 1 && !list) return "short";
  if (len >= 900 || paras >= 5 || (list && len >= 600)) return "long";
  return "medium";
}

/* ---------------------------------- API ----------------------------------- */

export function formatResponse(args: {
  lang: Lang;
  confidence: Confidence;
  summary?: string;          // ← TEXTE BRUT du modèle. Injecté dans {summary} pour "restitution".
  guidance?: string;         // Injecté dans {guidance}/{tips} si présent (jamais d’UI).
  tips?: string;             // Alias souple de "guidance" si vide.
  includeCta?: boolean;      // Si true, injecte un CTA neutre dans {cta}.
  ctaOptions?: CtaKind[];    // Par défaut: ["copy","save","share"]
  seed?: number;             // Variabilité déterministe.
  joiner?: string;           // Séparateur entre phrases/sections. Par défaut: "\n\n"
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
    joiner = "\n\n", // espacement aéré par défaut
  } = args;

  const langPool = pool[lang];
  if (!langPool) throw new Error(`Unsupported lang: ${lang}`);
  const bucket = langPool[confidence];
  if (!bucket) throw new Error(`Unsupported confidence: ${confidence}`);

  // Guidance prioritaire ; sinon, tips ; sinon vide
  const guidanceSafe =
    (guidance && guidance.trim()) ? guidance.trim() :
    (tips && tips.trim()) ? tips.trim() : "";

  const rng = typeof seed === "number" ? mulberry32(seed) : undefined;

  // Texte brut purifié (ton premium)
  const text = purifyTone(summary, lang);

  // Profil adaptatif
  const profile = detectProfile(text, lang);

  // Cas "reframe" (incapacité détectée → plan d’action)
  if (profile === "reframe") {
    const intro = pick(reframePool[lang].intro, rng);
    const steps = pick(reframePool[lang].steps, rng);
    const tip   = pick(reframePool[lang].tip, rng);

    const ctaText = includeCta ? buildCta(lang, ctaOptions) : "";
    const open = [guidanceSafe, ctaText].filter(Boolean).join(" ").trim();

    return [intro, steps, text, [tip, open].filter(Boolean).join(" ")].filter(Boolean).join(joiner);
  }

  // Réponse directe si "short"
  if (profile === "short") {
    return text;
  }

  // Medium / Long : structure stable
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
      : [diag, res, opening]; // medium : pas d’analyse détaillée (réponse + ouverture)

  return parts.filter(Boolean).join(joiner);
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
