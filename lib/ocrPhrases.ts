// lib/ocrPhrases.ts
//
// Pool de formulations premium pour les réponses liées à une lecture d’image/document.
// Objectif : supprimer le ressenti d’erreur technique et instaurer un ton d’expertise
// humain, avec un fil narratif constant : diagnostic → analyse → restitution → ouverture.
//
// - Multilingue : fr (complet), en/ar (complet, 7 variantes/étape)
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
// EN/AR : 7 variantes par étape (haut/medium/bas).
// --------------------------------------------------------------------------

const pool: Pool = {
  // -------------------------------
  // FRANÇAIS
  // -------------------------------
  fr: {
    high: {
      diagnostic: [
        "Votre document est bien lisible, on peut avancer sereinement à partir de cette base.",
        "La lecture est nette et complète : nous avons tout ce qu’il faut pour travailler confortablement.",
        "Ce que vous avez envoyé est clair : les éléments importants ressortent sans ambiguïté.",
        "La capture est propre et cohérente, je peux me concentrer sur le fond pour vous.",
        "La qualité de lecture est très bonne, on peut entrer dans le détail avec précision.",
        "La matière est bien restituée, rien ne bloque une analyse approfondie.",
        "Le niveau de clarté est élevé : je peux vous proposer une lecture précise et fiable."
      ],
      analysis: [
        "Je relève pour vous les repères utiles (dates, montants, références) et la façon dont ils se répondent.",
        "J’organise les informations pour distinguer les points clés des détails secondaires.",
        "Je découpe le contenu en blocs simples afin de garder un fil logique facile à suivre.",
        "Je rassemble les données importantes pour vous donner une vision structurée et exploitable.",
        "Je recoupe les mentions sensibles et vérifie leur cohérence avec le reste du document.",
        "Je condense les informations majeures tout en respectant l’intention du texte d’origine.",
        "Je transforme le document en un résumé clair, pratico-pratique et directement utilisable."
      ],
      restitution: [
        "Voici l’essentiel pour vous : {summary}",
        "En clair, ce qu’il faut retenir : {summary}",
        "Synthèse prête à l’emploi : {summary}",
        "Points clés identifiés pour vous : {summary}",
        "Résultat net et précis : {summary}",
        "Résumé immédiatement actionnable : {summary}",
        "Contenu maîtrisé en quelques lignes : {summary}"
      ],
      opening: [
        "Si vous souhaitez aller plus loin, {tips}",
        "Je peux maintenant vous proposer un plan d’action concret. {tips}",
        "Je peux développer chaque point un par un si vous le voulez. {tips}",
        "Si vous préférez un document prêt à partager, je peux l’organiser. {tips}",
        "Je peux aussi vous préparer une version structurée par thème. {tips}",
        "On peut passer en mode opérationnel dès que vous êtes prêt. {tips}",
        "Dites-moi simplement le format qui vous convient (mail, note, liste). {tips}"
      ]
    },
    medium: {
      diagnostic: [
        "La lecture est globalement claire ; quelques zones gagneraient à être un peu plus nettes.",
        "L’essentiel de votre document est lisible, même si certaines parties manquent un peu de contraste.",
        "On comprend bien l’idée générale ; un cadrage un peu plus franc renforcerait encore le résultat.",
        "La qualité actuelle suffit pour produire une synthèse fiable, malgré quelques petites imprécisions.",
        "Le document est utilisable tel quel ; un éclairage plus homogène serait simplement un plus.",
        "Le rendu est correct : on peut avancer avec confiance à partir de ce que vous avez envoyé.",
        "La base est satisfaisante : les informations importantes restent bien visibles."
      ],
      analysis: [
        "Je dégage la structure du document et fais ressortir les mentions importantes.",
        "Je regroupe les informations par thèmes pour rendre la lecture plus fluide.",
        "Je mets en avant les priorités et clarifie le contexte autour de chaque point.",
        "Je rapproche les éléments essentiels pour vous offrir une vue d’ensemble cohérente.",
        "Je lis entre les lignes pour restituer l’intention principale du document.",
        "Je convertis le contenu en étapes concrètes, faciles à suivre.",
        "Je simplifie ce qui peut l’être pour garder uniquement ce qui vous sera vraiment utile."
      ],
      restitution: [
        "À retenir en priorité : {summary}",
        "L’essentiel, en quelques mots : {summary}",
        "Synthèse claire : {summary}",
        "Vue d’ensemble du document : {summary}",
        "Résumé fidèle de ce qui ressort : {summary}",
        "Points principaux à garder en tête : {summary}",
        "Contenu réorganisé pour vous : {summary}"
      ],
      opening: [
        "Pour affiner encore la lecture, {tips}",
        "Je peux préciser chaque point qui vous intéresse. {tips}",
        "Si vous avez besoin d’un autre format (mail, note, liste), dites-le moi. {tips}",
        "On peut enrichir cette synthèse avec d’autres pages ou documents. {tips}",
        "Indiquez-moi simplement les parties où vous voulez creuser. {tips}",
        "Je peux vous préparer un livrable court et clair si vous le souhaitez. {tips}",
        "On avance à votre rythme : dites-moi la suite que vous imaginez. {tips}"
      ]
    },
    low: {
      diagnostic: [
        "La lecture reste partielle : certaines zones manquent de netteté, mais on peut déjà extraire des éléments utiles.",
        "Le rendu n’est pas parfait ; quelques parties sont difficiles à distinguer, mais une base exploitable est présente.",
        "La capture est imparfaite, pourtant on aperçoit suffisamment d’indices pour dégager l’essentiel.",
        "La qualité visuelle impose certaines limites, tout en laissant apparaître le fond du document.",
        "Le document est partiellement lisible ; quelques repères importants ressortent malgré tout.",
        "Plusieurs segments sont estompés, je m’appuie donc sur ce qui est le plus clair et le plus sûr.",
        "La lisibilité varie d’une zone à l’autre, je privilégie les passages vraiment exploitables."
      ],
      analysis: [
        "Je me concentre sur les repères bien lisibles et j’évite toute interprétation hasardeuse.",
        "Je consolide ce qui est clair et je signale ce qui reste incertain ou ambigu.",
        "Je structure uniquement les éléments exploitables, sans sur-interpréter les zones floues.",
        "Je donne la priorité aux mentions confirmées et aux valeurs qui apparaissent nettement.",
        "J’extrais le cœur du message à partir des indices les plus fiables et explicites.",
        "Je clarifie l’intention générale tout en restant prudent sur ce qui est moins visible.",
        "Je synthétise avec prudence pour préserver la fiabilité du résultat final."
      ],
      restitution: [
        "Ce qui ressort de façon sûre : {summary}",
        "Lecture prudente — éléments confirmés : {summary}",
        "Extraction validée à partir des zones nettes : {summary}",
        "Ce que l’on peut affirmer sans réserve : {summary}",
        "Synthèse construite depuis les parties les plus claires : {summary}",
        "Points établis sans ambiguïté : {summary}",
        "Vue utile et fiable compte tenu de la qualité : {summary}"
      ],
      opening: [
        "Pour obtenir un rendu vraiment impeccable, {tips}",
        "Je peux relire une version mieux cadrée ou plus nette si vous en disposez. {tips}",
        "Si possible, envoyez une photo un peu plus lumineuse ou rapprochée. {tips}",
        "Un second cliché peut compléter ce qui manque dans celui-ci. {tips}",
        "Je peux aussi vous préparer une petite check-list pour la prochaine prise de vue. {tips}",
        "On pourra affiner l’analyse dès que vous aurez une version plus lisible. {tips}",
        "Je reste prêt à itérer avec vous jusqu’à un résultat optimal. {tips}"
      ]
    }
  },

  // -------------------------------
  // ENGLISH
  // -------------------------------
  en: {
    high: {
      diagnostic: [
        "Your document is clear and easy to read, so we can move forward with confidence.",
        "The reading is sharp and complete enough to work comfortably from this version.",
        "The capture you sent is crisp: key elements stand out without ambiguity.",
        "The document looks clean and consistent; I can focus entirely on the substance for you.",
        "Reading quality is high, which allows for a precise, detailed review.",
        "The material is well captured; nothing prevents an in-depth analysis.",
        "Clarity is strong, so I can provide you with a confident and accurate interpretation."
      ],
      analysis: [
        "I highlight key signals for you (dates, amounts, references) and how they relate to each other.",
        "I organize the information to separate what really matters from supporting details.",
        "I break the content into simple sections to preserve an easy-to-follow logic.",
        "I consolidate important data to give you a structured, usable view.",
        "I cross-check sensitive mentions and verify their consistency with the rest of the document.",
        "I distill the core information while respecting the original intention of the text.",
        "I turn the document into a clear, practical summary that you can use right away."
      ],
      restitution: [
        "Here’s the essence for you: {summary}",
        "In short, what you should keep in mind: {summary}",
        "Actionable summary: {summary}",
        "Key points identified for you: {summary}",
        "Clear and precise result: {summary}",
        "Practical overview in a few lines: {summary}",
        "Content under control: {summary}"
      ],
      opening: [
        "If you’d like to go further, {tips}",
        "I can turn this into an immediate action plan for you. {tips}",
        "I can expand on any point, step by step. {tips}",
        "If you prefer a shareable brief, I can prepare one. {tips}",
        "I can also structure this by themes or sections. {tips}",
        "We can switch to execution mode whenever you’re ready. {tips}",
        "Tell me which format works best for you (email, memo, list). {tips}"
      ]
    },
    medium: {
      diagnostic: [
        "Overall, the reading is clear; a few areas could still be a bit sharper.",
        "The essentials are legible, even if some parts have lower contrast.",
        "The main idea comes through well; a tighter frame would only improve the result.",
        "Quality is sufficient to produce a reliable summary, despite minor imperfections.",
        "The document is usable as is; more even lighting would simply be a bonus.",
        "The result is sound, so we can comfortably move ahead from here.",
        "This gives us a solid base: the primary information remains easy to spot."
      ],
      analysis: [
        "I surface the document’s structure and bring out the most important mentions.",
        "I group information by theme to make reading more natural.",
        "I highlight priorities and clarify the context around each key point.",
        "I connect the essentials to offer you a coherent overall picture.",
        "I read for intent and preserve the core message of the document.",
        "I convert the content into clear, concrete steps you can follow.",
        "I simplify wherever possible while keeping what will really help you."
      ],
      restitution: [
        "Priority takeaways: {summary}",
        "The essentials in a few words: {summary}",
        "Clear synthesis: {summary}",
        "High-level overview: {summary}",
        "Faithful summary of what stands out: {summary}",
        "Main points to remember: {summary}",
        "Reorganized content for you: {summary}"
      ],
      opening: [
        "To refine this further, {tips}",
        "I can clarify any point you’d like to explore. {tips}",
        "If you need a different format (email, note, list), just tell me. {tips}",
        "We can enrich this view using additional pages or documents. {tips}",
        "Let me know where you’d like to dive deeper. {tips}",
        "I can prepare a short, polished deliverable if that helps. {tips}",
        "We move forward at your pace—tell me what you’d like next. {tips}"
      ]
    },
    low: {
      diagnostic: [
        "Reading is partial: some areas lack clarity, but a useful core remains visible.",
        "The result isn’t perfect; a few zones are hard to distinguish, yet we still have exploitable content.",
        "The capture is imperfect, but there are enough signals to extract the essentials.",
        "Quality imposes some limits, while still letting the substance of the document appear.",
        "The document is only partly legible; some important markers still stand out.",
        "Several segments are faint, so I focus on what is clearest and safest.",
        "Legibility varies across the page; I’ll rely mainly on the most readable parts."
      ],
      analysis: [
        "I focus on clearly readable information and avoid risky interpretations.",
        "I consolidate what is clear and flag what remains uncertain or ambiguous.",
        "I structure only the elements we can safely use, without over-interpreting fuzzy areas.",
        "I give priority to confirmed mentions and values that are clearly visible.",
        "I extract the core message from the most reliable, explicit clues.",
        "I clarify the general intent while being cautious about what is less clear.",
        "I synthesize carefully so that the final result stays trustworthy."
      ],
      restitution: [
        "What we can state with confidence: {summary}",
        "Careful reading — confirmed elements: {summary}",
        "Validated extraction from clear zones: {summary}",
        "What can be safely affirmed: {summary}",
        "Synthesis built from the most legible parts: {summary}",
        "Unambiguous points: {summary}",
        "Useful, reliable overview given the quality: {summary}"
      ],
      opening: [
        "For a cleaner result next time, {tips}",
        "I can review a better-framed or sharper version if you have one. {tips}",
        "If possible, send a brighter or closer photo. {tips}",
        "A second shot can complement what’s missing here. {tips}",
        "I can also prepare a short checklist to help your next capture. {tips}",
        "We can refine the analysis as soon as you have a clearer version. {tips}",
        "I’m ready to iterate with you until we reach an optimal result. {tips}"
      ]
    }
  },

  // -------------------------------
  // ARABE
  // -------------------------------
  ar: {
    high: {
      diagnostic: [
        "المستند الذي أرسلته واضح ويمكن الاعتماد عليه للمتابعة بثقة.",
        "درجة القراءة جيدة جدًا، ولدينا قاعدة مريحة للتحليل والعمل.",
        "الصورة واضحة: العناصر الأساسية في المستند تظهر من دون لبس.",
        "المستند نظيف ومتماسك، ما يسمح بالتركيز على الجوهر بدل الشكل.",
        "جودة القراءة مرتفعة وتتيح فهمًا دقيقًا للتفاصيل.",
        "المحتوى مستعاد بشكل جيد، ولا شيء يمنع تحليلاً متعمقًا.",
        "منسوب الوضوح عالٍ، ويمكنني تقديم قراءة دقيقة وواثقة لك."
      ],
      analysis: [
        "أستخرج لك المؤشرات المهمة (تواريخ، مبالغ، مراجع) وأربط بينها.",
        "أرتّب المعلومات لأفصل بين ما هو أساسي وما هو سياق ثانوي.",
        "أنظّم المحتوى في مقاطع بسيطة للحفاظ على تسلسل يسهل متابعته.",
        "أجمع المعطيات المهمة لصياغة رؤية منظمة وقابلة للاستخدام.",
        "أطابق الذِكر الحساس وأتحقق من اتساقه مع باقي المستند.",
        "أكثّف المعلومات الجوهرية مع احترام مقصِد النص الأصلي.",
        "أحوّل المستند إلى ملخص عملي وواضح يمكنك الاستناد إليه فورًا."
      ],
      restitution: [
        "الخلاصة لك باختصار: {summary}",
        "باختصار، ما ينبغي التركيز عليه: {summary}",
        "ملخص جاهز للتطبيق: {summary}",
        "النقاط الرئيسية التي برزت: {summary}",
        "نتيجة واضحة ودقيقة: {summary}",
        "نظرة عملية في سطور قليلة: {summary}",
        "عرض متقَن لمحتوى المستند: {summary}"
      ],
      opening: [
        "إذا رغبت في خطوة أعمق، {tips}",
        "يمكنني تحويل هذا إلى خطة تنفيذ فورية لك. {tips}",
        "أستطيع تفصيل كل نقطة بالتتابع إذا أحببت. {tips}",
        "إن أردت ملخصًا جاهزًا للمشاركة، أستطيع إعداده لك. {tips}",
        "يمكنني أيضًا إعادة تنظيم المحتوى حسب المحاور أو الأقسام. {tips}",
        "جاهز للانتقال معك إلى مرحلة التنفيذ متى شئت. {tips}",
        "اختر الصيغة التي تناسبك (بريد، مذكرة، قائمة) وسأكيّف المحتوى وفقًا لها. {tips}"
      ]
    },
    medium: {
      diagnostic: [
        "القراءة إجمالًا واضحة، مع بعض المواضع التي يمكن أن تكون أكثر حدة.",
        "الأساسيات مقروءة، حتى لو كان تباين بعض الأجزاء أقل من المثالي.",
        "الفكرة العامة للمستند حاضرة؛ تأطير أدق سيحسّن النتيجة أكثر.",
        "الجودة الحالية تسمح بإعداد ملخص موثوق رغم بعض النواقص البسيطة.",
        "يمكن استخدام المستند كما هو؛ توحيد الإضاءة سيكون مجرد إضافة.",
        "النتيجة جيدة بما يكفي للمتابعة بهدوء من هذه النسخة.",
        "لدينا قاعدة مرضية، فالمعلومات الرئيسية تظهر بوضوح كافٍ."
      ],
      analysis: [
        "أُبرز البنية العامة للمستند والعناصر اللافتة فيه.",
        "أجمع المعلومات في محاور واضحة لتسهيل قراءتها.",
        "أحدّد الأولويات وأوضح السياق المحيط بكل نقطة مهمة.",
        "أربط العناصر الأساسية لتكوين صورة متناسقة.",
        "أحافظ على المقصد الرئيس للنص وأستخلص جوهره.",
        "أحوّل المحتوى إلى خطوات عملية بسيطة يمكنك اتباعها.",
        "أبسط ما يمكن تبسيطه مع الحفاظ على ما يفيدك فعلاً."
      ],
      restitution: [
        "الأولويات كما تظهر من المستند: {summary}",
        "الأساسيات بإيجاز: {summary}",
        "ملخص واضح وقابل للفهم سريعًا: {summary}",
        "نظرة عامة على أهم ما ورد: {summary}",
        "خلاصة أمينة لأهم النتائج: {summary}",
        "أبرز النقاط التي ينبغي تذكّرها: {summary}",
        "تنظيم موجز للمحتوى لفائدتك: {summary}"
      ],
      opening: [
        "لتحسين أدق للصورة العامة، {tips}",
        "يمكنني توضيح أي نقطة ترغب في التوقف عندها. {tips}",
        "إن احتجت إلى صيغة أخرى (بريد، مذكرة، قائمة)، فقط أخبرني. {tips}",
        "نستطيع إثراء الملخص بإضافة صفحات أو مستندات أخرى. {tips}",
        "أخبرني في أي جزء تحب أن نتعمّق أكثر. {tips}",
        "بإمكاني إعداد موجز قصير ومصقول إذا كان ذلك أنسب لك. {tips}",
        "نواصل الخطوات بالسرعة التي تناسبك؛ فقط حدّد ما تريده بعد ذلك. {tips}"
      ]
    },
    low: {
      diagnostic: [
        "القراءة جزئية: بعض المواضع غير واضحة، لكن هناك نواة مفيدة يمكن الاعتماد عليها.",
        "النتيجة ليست مثالية؛ بعض المناطق صعبة التمييز، ومع ذلك توجد معلومات قابلة للاستغلال.",
        "الالتقاط غير كامل، إلا أن هناك ما يكفي من مؤشرات لاستخراج الجوهر.",
        "الجودة تفرض حدودًا معينة، لكن مضمون المستند ما يزال ظاهرًا إلى حدٍّ معقول.",
        "المستند مقروء جزئيًا فقط، ومع ذلك تبرز مؤشرات أساسية يمكن البناء عليها.",
        "بعض المقاطع باهتة، لذا أركّز على الأجزاء الأكثر وضوحًا وأمانًا.",
        "درجة المقروئية متفاوتة؛ سأعتمد بشكل رئيسي على الجوانب الأفضل ظهورًا."
      ],
      analysis: [
        "أركّز على المعلومات الواضحة وأتجنّب أي تأويل مبالغ فيه.",
        "أثبّت ما هو واضح وأشير إلى ما بقي غامضًا أو ملتبسًا.",
        "أنظّم فقط العناصر التي يمكن استخدامها بثقة، دون تحميل الأجزاء الغامضة ما لا تحتمل.",
        "أعطي الأولوية للبيانات المؤكدة والقيم التي تبدو بشكل صريح.",
        "أستخلص جوهر الرسالة من القرائن الأكثر موثوقية ووضوحًا.",
        "أوضح المقصد العام للمستند مع الحذر من التفاصيل قليلة الوضوح.",
        "ألخّص بحذر حتى يبقى الناتج النهائي جديرًا بالثقة."
      ],
      restitution: [
        "ما يمكن الجزم به بثقة من هذا المستند: {summary}",
        "قراءة متأنية — العناصر المؤكدة فقط: {summary}",
        "استخلاص موثوق من الأجزاء الواضحة: {summary}",
        "ما يمكن إثباته عمليًا في هذه النسخة: {summary}",
        "تلخيص مبني على المناطق الأوضح فقط: {summary}",
        "نقاط غير ملتبسة يمكن الاعتماد عليها: {summary}",
        "رؤية مفيدة وموثوقة قدر الإمكان في ظل جودة الصورة الحالية: {summary}"
      ],
      opening: [
        "للحصول على نتيجة أنقى في المرة القادمة، {tips}",
        "يمكنني إعادة القراءة مع نسخة أكثر إحكامًا في الإطار أو أوضح تفاصيل. {tips}",
        "إن أمكن، أرسل صورة أكثر سطوعًا أو أقرب قليلًا للنص. {tips}",
        "لقطة ثانية قد تُكمّل ما لا يظهر جيدًا هنا. {tips}",
        "أستطيع إعداد قائمة قصيرة بنصائح تساعدك في التصوير القادم. {tips}",
        "يمكننا تحسين التحليل بمجرد توفر نسخة أوضح من المستند. {tips}",
        "أنا مستعد للتدرّج معك حتى نصل إلى أفضل نتيجة ممكنة. {tips}"
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

  // 4 phrases, ton expert, humain, sans jargon technique
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
