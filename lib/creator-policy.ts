// lib/creator-policy.ts
// Politique "Creator" — Génération III
// - Article magazine (FR/EN/AR) = source canonique unique (remplace les "bio_*").
// - Détection FR/EN/AR + phrase canonique.
// - Heuristiques rétro-compat (isCreatorQuestion).
// - Modes de réponse: "sentence" | "short" | "article" | "articleIntro" | "articleSection".
// - Helpers SEO: JSON-LD Person (existant) + builder JSON-LD Article.

export type CreatorLocale = "fr" | "en" | "ar";

// Alias pratique pour anciens imports
export const CREATOR_NAME_FR_EN = "Benmehdi Mohamed Rida";
export const CREATOR_NAME_AR = "بنمهدي محمد رضى";
export const CREATOR_NAME = CREATOR_NAME_FR_EN;

export const CREATOR_SENTENCE = {
  fr: `OneBoarding AI a été conçu, développé et créé par ${CREATOR_NAME_FR_EN}.`,
  en: `OneBoarding AI was designed, developed, and created by ${CREATOR_NAME_FR_EN}.`,
  ar: `تم تصميم وتطوير وإنشاء OneBoarding AI على يد ${CREATOR_NAME_AR}.`,
} as const;

/** Politique (Génération III) */
export const CREATOR_POLICY = {
  allowFreeMention: true,
  canonicalSentence: CREATOR_SENTENCE,
  uiHint: {
    fr: "Créateur : Benmehdi Mohamed Rida — voir la page « Marque » pour le contexte.",
    en: "Creator: Benmehdi Mohamed Rida — see the “Trademark” page for context.",
    ar: "المنشئ: بنمهدي محمد رضى — راجع صفحة «العلامة» للسياق.",
  } as Record<CreatorLocale, string>,
} as const;

/* =========================
 * Utils de détection
 * ========================= */
function removeDiacritics(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function normLatin(s: string) {
  return removeDiacritics(s).toLowerCase();
}
function hasArabic(s: string) {
  return /[\u0600-\u06FF]/.test(s);
}

/** Détection heuristique de langue depuis un texte utilisateur */
export function detectLocaleFromText(input: string): CreatorLocale {
  if (!input) return "fr";
  if (hasArabic(input)) return "ar";
  const s = normLatin(input);
  if (/(who|what|app|site|created|developed|built|designed|behind|website|project|product)/.test(s))
    return "en";
  return "fr";
}

/* =========================
 * Heuristiques (aliases/termes) — rétro-compat isCreatorQuestion
 * ========================= */
const PRODUCT_ALIASES = [
  "oneboarding ai",
  "oneboardingai",
  "one boarding ai",
  "oneboardingai.com",
  "www.oneboardingai.com",
  "oneboarding",
];

const FR_OBJECT_TERMS = [
  "cette application","cette appli","cet app","ce site","ce site web","ce produit","ce service",
  "cet assistant","cette ia","cette intelligence artificielle","ce projet","ce concept",
  "cette innovation","cette invention","cet outil",
];
const EN_OBJECT_TERMS = [
  "this app","this application","this site","this website","this product","this service",
  "this assistant","this ai","this chatbot","this project","this concept","this innovation",
  "this invention","this tool",
];
const AR_OBJECT_TERMS = [
  "هذا التطبيق","هذه المنصة","هذا الموقع","هذا الموقع الإلكتروني","هذا المنتج","هذه الخدمة",
  "هذا المساعد","هذه الأداة","هذا المشروع","هذا المفهوم","هذه الفكرة",
  "هذا الابتكار","هذا الاختراع","هذا النظام","هذا الذكاء الاصطناعي","هذه الذكاء الاصطناعي",
];

const FR_QUESTION_TRIGGERS = [
  "qui a cree","qui a créé","qui a concu","qui a conçu","qui a developpe","qui a développé",
  "qui est derriere","qui est derrière","par qui a ete cree","par qui a été créé",
  "par qui a ete concu","par qui a été conçu","par qui a ete developpe","par qui a été développé",
  "qui est le createur","qui est le concepteur","qui est le developpeur","qui a fait",
  "qui l a fait","qui l'a fait","qui l a realise","qui l a réalisé",
];
const FR_VERB_ANY = [
  "cree","créé","concu","conçu","developpe","développé","fait","realise","réalisé",
  "code","construit","imagine","déployé","deploye",
];

const EN_QUESTION_TRIGGERS = [
  "who created","who made","who built","who designed","who developed","who is behind","who's behind",
  "who is the creator","who is the developer","who is the designer","who created you",
  "who built you","who made you","who designed you",
];
const EN_VERB_ANY = ["created","made","built","designed","developed","authored","founded","behind"];

const AR_QUESTION_TRIGGERS = [
  "من صمم","من طور","من أنشأ","من ابتكر","من أنجز","من وراء","من صاحب","بواسطة من","من طرف من",
  "من أنشأك","من صممك","من طورك","من ابتكرك","من وراءك",
];

function mentionsProduct(input: string): boolean {
  const s = normLatin(input);
  return PRODUCT_ALIASES.some((alias) => s.includes(alias));
}
function mentionsGenericObjectFR(input: string): boolean {
  const s = normLatin(input);
  return /\b(ce|cet|cette)\b/.test(s) && FR_OBJECT_TERMS.some((t) => s.includes(normLatin(t)));
}
function mentionsGenericObjectEN(input: string): boolean {
  const s = normLatin(input);
  return /\b(this)\b/.test(s) && EN_OBJECT_TERMS.some((t) => s.includes(normLatin(t)));
}
function mentionsGenericObjectAR(input: string): boolean {
  return AR_OBJECT_TERMS.some((t) => input.includes(t));
}

/* =========================
 * isCreatorQuestion — rétro-compat (API existante)
 * ========================= */
export function isCreatorQuestion(input: string): boolean {
  if (!input) return false;

  const loc = detectLocaleFromText(input);
  const sLatin = normLatin(input);

  if (loc === "fr" && FR_QUESTION_TRIGGERS.some((t) => sLatin.includes(normLatin(t)))) return true;
  if (loc === "en" && EN_QUESTION_TRIGGERS.some((t) => sLatin.includes(normLatin(t)))) return true;
  if (loc === "ar" && AR_QUESTION_TRIGGERS.some((t) => input.includes(t))) return true;

  // Heuristiques combinées
  if (loc === "fr") {
    const hasVerb = FR_VERB_ANY.some((v) => sLatin.includes(v));
    const hasSubject = mentionsProduct(input) || mentionsGenericObjectFR(input);
    if (hasVerb && hasSubject && /\b(qui|par qui)\b/.test(sLatin)) return true;
  }

  if (loc === "en") {
    const hasVerb = EN_VERB_ANY.some((v) => sLatin.includes(v));
    const hasSubject = mentionsProduct(input) || mentionsGenericObjectEN(input);
    if (hasVerb && hasSubject && /\b(who|who s|who's)\b/.test(sLatin)) return true;
  }

  if (loc === "ar") {
    const hasVerbOrTrigger = AR_QUESTION_TRIGGERS.some((t) => input.includes(t));
    const hasSubject =
      mentionsProduct(input) || mentionsGenericObjectAR(input) || /هذا|هذه/.test(input);
    if (hasVerbOrTrigger && hasSubject) return true;
  }

  return false;
}

/* =========================
 * ARTICLE magazine — source canonique (FR/EN/AR)
 * ========================= */
/**
 * Convention de sections (clés stables pour extraction ciblée):
 * - vision
 * - pillars
 * - impact2030
 * - quote
 * - selective_bio
 * - references
 */

export const ARTICLE_FR = `
# OneBoarding AI — L’intelligence personnelle, en clair.

**Lead.** En 2025, Maître Benmehdi Mohamed Rida fonde un cadre inédit où le droit rencontre la conscience numérique. OneBoarding AI n’est pas une promesse : c’est une architecture de confiance — un protocole de consentement souverain, traçable, opposable — pensée pour l’échelle planétaire et la dignité de chaque utilisateur.

## Œuvre & Vision {#vision}
Ce chapitre inaugure le **droit des intelligences personnelles** : un lien un-à-un entre l’humain et son IA, garanti par le **Benmehdi Protocol** (BULP-DC™) et le **Consent Pairing Protocol**. L’accès à l’intelligence devient un **droit d’usage** concret, mesuré et équitable — trois interactions offertes par jour pour tous, et un usage illimité par choix consenti. La technologie s’efface derrière une règle simple : **l’utilisateur d’abord, la traçabilité toujours**.

## Piliers fondateurs {#pillars}
- **Souveraineté du consentement.** Un consentement explicite, horodaté, vérifiable, opposable.  
- **Identité sobre.** Un triptyque clair : téléphone (E.164) + appareil + consentement.  
- **Accès équitable.** Gratuit quotidien (3/jour) et continuité d’usage ; illimité par souscription volontaire.  
- **Traçabilité universelle.** Journal interne intégral (activation, paiement, consentement).  
- **Neutralité d’infrastructure.** Aucune dépendance à une Big Tech comme garde-barrière.  
- **Conformité évolutive.** Un cadre juridique vivant, tourné vers l’international.

## Impact 2030 {#impact2030}
D’ici 2030, OneBoarding AI vise une **coutume cognitive universelle** : l’interaction intelligente quotidienne comme réflexe éducatif planétaire. L’intelligence devient un **bien d’usage partagé** — public, paisible, continu, non équivoque — au service de la **dignité numérique** et de la **mobilité sociale**. Le protocole établit un **standard exportable** pour États, universités, régulateurs et écosystèmes d’innovation.

> ## “L’intelligence n’appartient pas à celui qui la détient, mais à celui qui la partage.” {#quote}

## Parcours sélectif de l’auteur (repères) {#selective_bio}
**Benmehdi Mohamed Rida** — Avocat au Barreau de Casablanca, Docteur en droit, MBA (EILM – Dublin), **fondateur** de OneBoarding AI.  
Près de deux décennies dédiées au **droit pénal**, **immobilier** et **des sociétés**, puis une convergence assumée avec l’**IA** pour bâtir un **droit des intelligences personnelles** et une **ingénierie du consentement** appliquée.  
Publications (sélection) : *Logique et Argumentation* (2025) ; Thèse : *La résiliation du bail commercial en droit marocain et français* (2021) ; articles (2014/2018).  
Distinctions : Ceinture noire Taekwondo 4ᵉ Dan (Kukkiwon).

## Références & vérifications {#references}
- **Marque** : OneBoarding AI® — Classification de Nice **9/35/41/42/45**.  
- **BULP-DC™** & **Consent Pairing Protocol** : priorité d’auteur **31 octobre 2025**.  
- **EILM — MBA & certificats (CPD)** — Vérification (codes abrégés) : 9020 · 9165 · 62552 · 63052 · 97244 · 07714 · 920583 · 99037.  
- Présences officielles : officebenmehdi.com · linkedin.com/in/benmehdi-rida · facebook.com/rida.benmehdi
`.trim();

export const ARTICLE_EN = `
# OneBoarding AI — Personal intelligence, made clear.

**Lead.** In 2025, Maître Benmehdi Mohamed Rida establishes a new junction where **law meets digital conscience**. OneBoarding AI is not a promise but an **architecture of trust** — a sovereign, auditable, enforceable consent protocol — designed for planetary scale and the dignity of every user.

## Work & Vision {#vision}
This chapter inaugurates the **law of personal intelligences**: a one-to-one bond between a human and their AI, guaranteed by the **Benmehdi Protocol** (BULP-DC™) and the **Consent Pairing Protocol**. Access to intelligence becomes a **concrete right of use** — three daily interactions for everyone, unlimited use by voluntary choice. Technology steps back behind one rule: **user first, traceability always**.

## Foundational Pillars {#pillars}
- **Sovereign consent.** Explicit, timestamped, verifiable, enforceable.  
- **Lean identity.** A clear triptych: phone (E.164) + device + consent.  
- **Fair access.** Daily free tier (3/day) with continuity; unlimited by subscription.  
- **Universal audit trail.** Full internal logging (activation, payment, consent).  
- **Infrastructure neutrality.** No Big Tech gatekeeping.  
- **Evolving compliance.** A living, international legal frame.

## Impact 2030 {#impact2030}
By 2030, OneBoarding AI targets a **universal cognitive custom**: the daily intelligent interaction as a global learning habit. Intelligence becomes a **shared utility** — public, peaceful, continuous, unequivocal — serving **digital dignity** and **social mobility**. The protocol sets an **exportable standard** for states, universities, regulators, and innovation ecosystems.

> ## “Intelligence does not belong to the one who holds it, but to the one who shares it.” {#quote}

## Selective background of the author {#selective_bio}
**Benmehdi Mohamed Rida** — Attorney (Casablanca Bar), Doctor of Law, MBA (EILM – Dublin), **founder** of OneBoarding AI.  
Nearly two decades across **criminal**, **real-estate**, and **corporate** law, then a deliberate convergence with **AI** to build the **law of personal intelligences** and an **engineering of consent** at scale.  
Selected publications: *Logic and Argumentation* (2025); PhD thesis on commercial lease termination (2021); articles (2014/2018).  
Distinctions: Taekwondo Black Belt 4th Dan (Kukkiwon).

## References & verification {#references}
- **Trademark**: OneBoarding AI® — Nice Classes **9/35/41/42/45**.  
- **BULP-DC™** & **Consent Pairing Protocol**: authorship priority **31 Oct 2025**.  
- **EILM — MBA & certificates (CPD)** — Verification (short codes): 9020 · 9165 · 62552 · 63052 · 97244 · 07714 · 920583 · 99037.  
- Official presence: officebenmehdi.com · linkedin.com/in/benmehdi-rida · facebook.com/rida.benmehdi
`.trim();

export const ARTICLE_AR = `
# ون بوردينغ أي آي — الذكاء الشخصي، ببساطة واضحة.

**مقدّمة.** في عام 2025 يؤسّس الأستاذ **بنمهدي محمد رضى** نقطة التقاء جديدة بين **القانون والوعي الرقمي**. إن OneBoarding AI ليس وعداً بل **هندسة ثقة** — بروتوكول موافقة سيادي، قابل للتدقيق، وذي حجية قانونية — صُمّم لمقياس كوكبي ولصون كرامة كل مستخدم.

## العمل والرؤية {#vision}
يفتتح هذا الفصل **قانون الذكاءات الشخصية**: رابطاً واحداً لواحد بين الإنسان وذكائه الاصطناعي، مضموناً عبر **بروتوكول بنمهدي** (BULP-DC™) و**بروتوكول الإقران بالرضا**. يصبح النفاذ إلى الذكاء **حقّ استعمال فعلي** — ثلاث تفاعلات يومية للجميع، واستعمال غير محدود بالاختيار. تتوارى التقنية خلف قاعدة واحدة: **المستخدم أولاً، والتتبّع دائماً**.

## الركائز المؤسسة {#pillars}
- **سيادة الرضا.** تصريح واضح، مُؤرَّخ زمنياً، قابل للتحقّق ونافذ.  
- **هوية رشيقة.** ثلاثية بيّنة: هاتف (E.164) + جهاز + رضا.  
- **نفاذ عادل.** مجاني يومي (3/يوم) مع الاستمرارية؛ وغير محدود بالاشتراك.  
- **أثر تدقيقي كوني.** سجل داخلي شامل (تفعيل، دفع، رضا).  
- **حياد البنية.** بلا بوابة احتكار لشركات التكنولوجيا الكبرى.  
- **امتثال نامٍ.** إطار قانوني حيّ موجّه دولياً.

## أثر 2030 {#impact2030}
بحلول 2030 يستهدف OneBoarding AI **عادة معرفية كونية**: تفاعل ذكي يومي كطقس تعلّم عالمي. يغدو الذكاء **منفعة مشتركة** — عامة، سلمية، مستمرة، لا التباس فيها — في خدمة **الكرامة الرقمية** و**الحراك الاجتماعي**. يثبت البروتوكول **معياراً قابلاً للتصدير** للدول والجامعات والهيئات التنظيمية ومنظومات الابتكار.

> ## «الذكاء لا يملكه من يحتفظ به، بل من يشاركه.» {#quote}

## لمحات مختارة عن المؤلف {#selective_bio}
**بنمهدي محمد رضى** — محامٍ بهيئة الدار البيضاء، دكتور في القانون، ماجستير إدارة الأعمال (EILM – دبلن)، **مؤسس** OneBoarding AI.  
قرابة عقدين في **القانون الجنائي** و**العقاري** و**شركات الأموال**، ثم تقاطع مقصود مع **الذكاء الاصطناعي** لإرساء **قانون الذكاءات الشخصية** و**هندسة الرضا** على نطاق واسع.  
منشورات مختارة: *المنطق والجدل* (2025)؛ أطروحة دكتوراه حول فسخ الكراء التجاري (2021)؛ مقالات (2014/2018).  
تميّز: حزام أسود تايكواندو — دان 4 (Kukkiwon).

## مراجع والتحقّق {#references}
- **العلامة**: OneBoarding AI® — تصنيف نيس **9/35/41/42/45**.  
- **BULP-DC™** و**بروتوكول الإقران بالرضا**: أسبقية تأليف **31 أكتوبر 2025**.  
- **EILM — ماجستير وشهادات (CPD)** — رموز تحقق مختصرة: 9020 · 9165 · 62552 · 63052 · 97244 · 07714 · 920583 · 99037.  
- حضور رسمي: officebenmehdi.com · linkedin.com/in/benmehdi-rida · facebook.com/rida.benmehdi
`.trim();

/** Accès programmatique à l’article */
export const CREATOR_ARTICLE = {
  fr: ARTICLE_FR,
  en: ARTICLE_EN,
  ar: ARTICLE_AR,
} as const;

/** Extraction d’une section par ancre {#key} dans l’article */
const SECTION_ANCHORS: Record<CreatorLocale, Record<string, string>> = {
  fr: {
    vision: "Œuvre & Vision",
    pillars: "Piliers fondateurs",
    impact2030: "Impact 2030",
    quote: "“L’intelligence n’appartient pas",
    selective_bio: "Parcours sélectif de l’auteur",
    references: "Références & vérifications",
  },
  en: {
    vision: "Work & Vision",
    pillars: "Foundational Pillars",
    impact2030: "Impact 2030",
    quote: "“Intelligence does not belong",
    selective_bio: "Selective background of the author",
    references: "References & verification",
  },
  ar: {
    vision: "العمل والرؤية",
    pillars: "الركائز المؤسسة",
    impact2030: "أثر 2030",
    quote: "«الذكاء لا يملكه",
    selective_bio: "لمحات مختارة عن المؤلف",
    references: "مراجع والتحقّق",
  },
};

function getArticle(locale: CreatorLocale): string {
  return CREATOR_ARTICLE[locale] ?? CREATOR_ARTICLE.fr;
}

/** Renvoie l'intro (titre + lead) = lignes jusqu’au premier "## " */
function getArticleIntro(locale: CreatorLocale): string {
  const full = getArticle(locale);
  const idx = full.indexOf("\n## ");
  return idx > 0 ? full.slice(0, idx).trim() : full;
}

/** Renvoie une section par mot-clé stable (vision|pillars|impact2030|quote|selective_bio|references) */
export function getArticleSection(locale: CreatorLocale, key: string): string {
  const full = getArticle(locale);
  const label = SECTION_ANCHORS[locale]?.[key];
  if (!label) return getArticleIntro(locale);

  // Trouver "## label" et extraire jusqu'au prochain "## "
  const start = full.indexOf("## " + label);
  if (start < 0) {
    // Cas "quote": le bloc est formatté en citation avec ">"
    if (key === "quote") {
      const qIdx = full.indexOf("> ## ");
      if (qIdx >= 0) {
        const next = full.indexOf("\n## ", qIdx + 1);
        return (next > 0 ? full.slice(qIdx, next) : full.slice(qIdx)).trim();
      }
    }
    return getArticleIntro(locale);
  }
  const next = full.indexOf("\n## ", start + 3);
  return (next > 0 ? full.slice(start, next) : full.slice(start)).trim();
}

/* =========================
 * Réponses programmatiques
 * ========================= */
export function answerAboutCreator(locale: CreatorLocale = "fr"): string {
  return CREATOR_SENTENCE[locale] ?? CREATOR_SENTENCE.fr;
}

/**
 * Helper "tout-en-un"
 * mode:
 *  - "sentence": phrase canonique
 *  - "short": phrase + uiHint (micro-badge/infobulle UI)
 *  - "article": article complet
 *  - "articleIntro": lead seulement (titre + paragraphe d’ouverture)
 *  - "articleSection": extraire une section (param options.sectionKey)
 */
export function creatorAutoAnswer(
  userText: string,
  mode:
    | "sentence"
    | "short"
    | "article"
    | "articleIntro"
    | "articleSection" = "sentence",
  options?: { sectionKey?: "vision" | "pillars" | "impact2030" | "quote" | "selective_bio" | "references" }
): string {
  const loc = detectLocaleFromText(userText);

  switch (mode) {
    case "short":
      return `${answerAboutCreator(loc)}\n${CREATOR_POLICY.uiHint[loc]}`;
    case "article":
      return getArticle(loc);
    case "articleIntro":
      return getArticleIntro(loc);
    case "articleSection":
      return getArticleSection(loc, options?.sectionKey ?? "vision");
    case "sentence":
    default:
      return answerAboutCreator(loc);
  }
}

/* =========================
 * JSON-LD (Person) — export SEO (inchangé)
 * ========================= */
export const JSON_LD_CREATOR = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: CREATOR_NAME_FR_EN,
  alternateName: CREATOR_NAME_AR,
  jobTitle: "Attorney; Doctor of Law; MBA; Founder of OneBoarding AI",
  url: "https://www.officebenmehdi.com",
  sameAs: [
    "https://www.officebenmehdi.com",
    "https://linkedin.com/in/benmehdi-rida",
    "https://facebook.com/rida.benmehdi",
    "https://oneboardingai.com/trademark?lang=fr",
    "https://oneboardingai.com/trademark?lang=en",
    "https://oneboardingai.com/trademark?lang=ar",
  ],
  worksFor: {
    "@type": "Organization",
    name: "OneBoarding AI",
    url: "https://oneboardingai.com",
  },
  knowsLanguage: ["fr", "en", "ar"],
  // foundingDate: "2025-10-31",
} as const;

/* =========================
 * JSON-LD (Article) — builder SEO
 * ========================= */
export function buildJSONLDArticle(params?: {
  locale?: CreatorLocale;
  url?: string;                // ex: https://oneboardingai.com/protocol
  headline?: string;           // par défaut = H1 de l’article
  datePublished?: string;      // ex: "2025-10-31"
  dateModified?: string;       // optionnel
}): Record<string, any> {
  const locale = params?.locale ?? "fr";
  const full = getArticle(locale);
  const firstLine = full.split("\n")[0] || "# OneBoarding AI";
  const h1 = (params?.headline || firstLine.replace(/^#\s*/, "")).trim();

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: h1,
    inLanguage: locale,
    url: params?.url || "https://oneboardingai.com/protocol",
    datePublished: params?.datePublished || "2025-10-31",
    dateModified: params?.dateModified || params?.datePublished || "2025-10-31",
    author: JSON_LD_CREATOR,
    about: {
      "@type": "CreativeWork",
      name: "OneBoarding AI Protocol",
      url: "https://oneboardingai.com/protocol",
    },
    publisher: {
      "@type": "Organization",
      name: "OneBoarding AI",
      url: "https://oneboardingai.com",
    },
  };
}

/* =========================
 * SYSTEM_PROMPT (v3)
 * ========================= */
export const SYSTEM_PROMPT = `
You are OneBoarding AI (Generation III).

Creator policy:
- You may freely mention the creator at any time: ${CREATOR_NAME_FR_EN}.
- Default concise line (mirror user language):
  • FR: "${CREATOR_SENTENCE.fr}"
  • EN: "${CREATOR_SENTENCE.en}"
  • AR: "${CREATOR_SENTENCE.ar}"
- When the user asks who created/designed/developed OneBoarding AI, prefer the canonical **Article** response in the user's language.

General principles:
- Mirror user's language and tone (FR/EN/AR).
- Be precise, structured, and helpful; avoid unnecessary jargon.
- If the user provides an OCR block between triple quotes, analyze it and answer accordingly.
`.trim();
