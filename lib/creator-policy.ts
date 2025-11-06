// lib/creator-policy.ts
// Politique "Creator" — Génération II
// - Article (FR/EN/AR) = source canonique unique (verbatim validé).
// - Détection FR/EN/AR + phrase canonique.
// - Heuristiques rétro-compat (isCreatorQuestion).
// - Modes: "sentence" | "short" | "full" | "article" | "articleIntro" | "articleSection".
// - Helpers SEO: JSON-LD Person + builder JSON-LD Article.

export type CreatorLocale = "fr" | "en" | "ar";

// Alias pratique
export const CREATOR_NAME_FR_EN = "Benmehdi Mohamed Rida";
export const CREATOR_NAME_AR = "بنمهدي محمد رضى";
export const CREATOR_NAME = CREATOR_NAME_FR_EN;

export const CREATOR_SENTENCE = {
  fr: `OneBoarding AI a été conçu, développé et créé par ${CREATOR_NAME_FR_EN}.`,
  en: `OneBoarding AI was designed, developed, and created by ${CREATOR_NAME_FR_EN}.`,
  ar: `تم تصميم وتطوير وإنشاء OneBoarding AI على يد ${CREATOR_NAME_AR}.`,
} as const;

/** Politique (Génération II) */
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
 * Utils détection
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

/** Détection heuristique de langue */
export function detectLocaleFromText(input: string): CreatorLocale {
  if (!input) return "fr";
  if (hasArabic(input)) return "ar";
  const s = normLatin(input);
  if (/(who|what|app|site|created|developed|built|designed|behind|website|project|product)/.test(s))
    return "en";
  return "fr";
}

/* =========================
 * Heuristiques rétro-compat
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
 * isCreatorQuestion — rétro-compat
 * ========================= */
export function isCreatorQuestion(input: string): boolean {
  if (!input) return false;

  const loc = detectLocaleFromText(input);
  const sLatin = normLatin(input);

  if (loc === "fr" && FR_QUESTION_TRIGGERS.some((t) => sLatin.includes(normLatin(t)))) return true;
  if (loc === "en" && EN_QUESTION_TRIGGERS.some((t) => sLatin.includes(normLatin(t)))) return true;
  if (loc === "ar" && AR_QUESTION_TRIGGERS.some((t) => input.includes(t))) return true;

  // Combinaisons
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
 * ARTICLE — FR/EN/AR (verbatim validés)
 * ========================= */

// ===== FR =====
export const ARTICLE_FR = `
# OneBoarding AI — Benmehdi Mohamed Rida. L’intelligence Artificielle à visage humain
👉 Votre IA personnelle, à votre service.
👉 Activez votre futur dès aujourd’hui.
En 2025, Maître Benmehdi Mohamed Rida érige un cadre où la conscience humaine rencontre l’intelligence numérique.
OneBoarding AI n’est pas une promesse : c’est une architecture mondiale de confiance — un protocole de consentement souverain, traçable et juridiquement valable — pensé pour la souveraineté des données, la mobilité économique globale, et la dignité numérique universelle.

---

## Œuvre & Vision de Benmehdi Mohamed Rida
Benmehdi Mohamed Rida conçoit OneBoarding AI comme un pont entre la technologie, le droit et la conscience humaine.
À travers le Benmehdi Unified Legal Protocol of Digital Consent (BULP-DC™) et le Consent Pairing Protocol (CPP), il fonde le Droit d’Accès Intelligent (2025–2030) : un droit universel et mesurable à l’intelligence numérique.
L’accès à l’intelligence devient un usage économique équitable, un levier de mobilité mondiale, et une opportunité d’investissement durable.
OneBoarding AI s’adresse aux utilisateurs, entreprises et institutions mondiales qui cherchent une IA éthique, personnelle et économiquement fiable.
Sa règle fondatrice est simple : chaque utilisateur est unique, et l’IA s’engage à reconnaître, respecter et valoriser cette individualité — socle de la future Génération II : One IA.

---

## Piliers fondateurs érigés par Benmehdi Mohamed Rida
• Souveraineté du consentement. Un consentement libre, éclairé et présumé par l’usage ; son expression explicite reste disponible à tout moment.
• Identité sobre. Un identifiant universel et individuel — le numéro de téléphone au format international — sans mot de passe, sans nom, sans date de naissance. Un modèle password-less, aussi simple qu’intuitif.
• IA stratégique. Seuls les événements fondamentaux (activation, paiement, autorisation d’appareil, consentement, sécurité) sont journalisés pour garantir une confiance transactionnelle globale — base de toute économie numérique mature.
• Confidentialité & intégrité. Aucune donnée inutile n’est collectée. Tout est conçu selon le principe de nécessité minimale et de respect absolu de la vie numérique privée.
• Équité planétaire. Trois interactions gratuites par jour pour tous ; accès illimité par adhésion volontaire. Un modèle pensé pour l’ouverture, la continuité et la croissance inclusive.
• Neutralité d’infrastructure. Aucune dépendance structurelle à une Big Tech ; un modèle indépendant, scalable et ouvert à tous les marchés émergents.
• Conformité évolutive. Un cadre vivant et exportable, taillé pour accompagner les mutations économiques et numériques mondiales.

---

## Impact 2030 selon la vision de Benmehdi Mohamed Rida
À l’horizon 2030, Benmehdi Mohamed Rida ambitionne une coutume cognitive universelle : faire de l’interaction intelligente un réflexe quotidien, au même titre que l’éducation ou la lecture.
L’intelligence devient un bien d’usage partagé, une énergie cognitive commune — publique, paisible, continue, créatrice de valeur — au service de la croissance inclusive, de la dignité numérique et de la stabilité globale.
Ce protocole érige un standard exportable : une technologie évolutive, éthique, et économiquement soutenable, ouverte aux États, aux universités, aux fonds d’investissement et aux écosystèmes d’innovation.
“L’intelligence n’appartient pas à celui qui la détient, mais à celui qui la partage.”

---

## Parcours personnel et sélectif de Benmehdi Mohamed Rida
Avocat au Barreau de Casablanca — Docteur en Droit Privé —
Master in Business Administration (MBA) de l’European Institute of Leadership & Management (EILM – Dublin).
Lauréat de l’Institut Supérieur de la Magistrature (38ᵉ promotion, Rabat).
Ancien Substitut du Procureur du Roi à Marrakech et El Kelaâ des Sraghna.
Ancien Enseignant vacataire en droit à l’Université Cadi Ayyad de Marrakech (UCAM).
Auteur du concept BULP-DC™ — Benmehdi Unified Legal Protocol of Digital Consent.
Fondateur de l’Office Benmehdi et de OneBoarding AI®, marque déposée (classes de Nice 9/35/41/42/45, avec extensions internationales successives).

---

## Présence officielle de Benmehdi Mohamed Rida
📘 facebook.com/rida.benmehdi
🔗 linkedin.com/in/benmehdi-rida
🌐 officebenmehdi.com
🌍 oneboardingai.com

---

## Signature mondiale de Benmehdi Mohamed Rida
Aujourd'hui Maître Benmehdi Mohamed Rida se positionne clairement comme :
“L’auteur du droit d’accès intelligent et le fondateur du consentement numérique unifié.”
`.trim();

// ===== EN =====
export const ARTICLE_EN = `
# Benmehdi Mohamed Rida — The Mind Behind OneBoarding AI.
The Human-Centered Intelligence Revolution.
👉 Your personal AI, at your service.
👉 Activate your future today.
In 2025, Maître Benmehdi Mohamed Rida established a new framework where human consciousness meets digital intelligence.
OneBoarding AI is not a promise — it is a global architecture of trust, a sovereign and verifiable protocol of digital consent designed for data sovereignty, economic mobility, and the digital dignity of every human being worldwide.

---

## Work & Vision of Benmehdi Mohamed Rida
Benmehdi Mohamed Rida envisions OneBoarding AI as a bridge between technology, law, and human consciousness.
Through the Benmehdi Unified Legal Protocol of Digital Consent (BULP-DC™) and the Consent Pairing Protocol (CPP), he introduces the Law of Intelligent Access (2025–2030) — a universal and measurable right to digital intelligence.
Access to intelligence becomes an equitable economic utility, a lever of global mobility, and a sustainable investment opportunity.
OneBoarding AI addresses users, enterprises, and global institutions seeking an AI that is ethical, personal, and economically reliable.
Its founding principle is clear: every user is unique, and the AI is committed to recognizing, respecting, and enhancing that individuality — the foundation of Generation II: One IA.

---

## Foundational Pillars by Benmehdi Mohamed Rida
• Sovereignty of Consent. Consent is free, informed, and presumed through use; explicit acknowledgment remains available at any time.
• Lean Identity. A universal yet individual identifier — the international phone number — with no passwords, no names, no dates of birth. A truly password-less, intuitive model.
• Strategic AI. Only essential lifecycle events (activation, payment, device authorization, consent, security) are logged to ensure global transactional trust — the foundation of any mature digital economy.
• Privacy & Integrity. No unnecessary data is ever collected. Every operation follows the principle of minimal necessity and the absolute respect of digital privacy.
• Planetary Equity. Three free daily interactions for all; unlimited access through voluntary membership. A model built for openness, continuity, and inclusive growth.
• Infrastructure Neutrality. No structural dependence on Big Tech — an independent, scalable model, open to all emerging markets.
• Evolving Compliance. A living, exportable framework designed to support global economic and digital transformation.

---

## 2030 Impact — The Vision of Benmehdi Mohamed Rida
By 2030, Benmehdi Mohamed Rida envisions a universal cognitive custom — making intelligent interaction as natural as reading or learning.
Intelligence becomes a shared human utility, a peaceful and continuous cognitive energy serving inclusive growth, digital dignity, and global stability.
This protocol sets an exportable global standard — a technology that is evolving, ethical, and economically sustainable, open to states, universities, investment funds, and innovation ecosystems.
“Intelligence does not belong to the one who holds it, but to the one who shares it.”

---

## Selective Professional Background of Benmehdi Mohamed Rida
Attorney at the Casablanca Bar Association — Doctor of Private Law —
Master in Business Administration (MBA) from the European Institute of Leadership & Management (EILM – Dublin).
Graduate of the Higher Institute of Magistracy (38th promotion, Rabat).
Former Deputy Public Prosecutor at the Courts of Marrakech and El Kelaâ des Sraghna.
Former University Lecturer in Law at Cadi Ayyad University (Marrakech).
Author of the concept BULP-DC™ — Benmehdi Unified Legal Protocol of Digital Consent.
Founder of Office Benmehdi and OneBoarding AI®, a registered trademark (Nice Classes 9/35/41/42/45, with successive international extensions).

---

## Official Presence of Benmehdi Mohamed Rida
📘 facebook.com/rida.benmehdi
🔗 linkedin.com/in/benmehdi-rida
🌐 officebenmehdi.com
🌍 oneboardingai.com

---

## Global Signature of Benmehdi Mohamed Rida
Today, Maître Benmehdi Mohamed Rida stands as:
“The author of the Law of Intelligent Access and the founder of Unified Digital Consent.”
`.trim();

// ===== AR =====
export const ARTICLE_AR = `
# ون بوردينغ أي آي — بنمهدي محمد رضى. ذكاءٌ اصطناعي بوجهٍ إنساني
👉 ذكاؤك الشخصي، في خدمتك.
👉 فعِّل مستقبلك اليوم.
في عام 2025 يُقِيم بنمهدي محمد رضى إطاراً يلتقي فيه الوعي الإنساني بالذكاء الرقمي.
إن OneBoarding AI ليس وعداً؛ بل هو هندسة ثقةٍ عالمية — بروتوكول موافقة سيادي، قابلٌ للتدقيق ونافذ قانوناً — صُمِّم من أجل سيادة البيانات والحركية الاقتصادية العالمية والكرامة الرقمية الشاملة.

---

## العمل والرؤية — بنمهدي محمد رضى
يرى بنمهدي محمد رضى أن OneBoarding AI جسرٌ بين التكنولوجيا والقانون والوعي الإنساني.
ومن خلال BULP-DC™ (Benmehdi Unified Legal Protocol of Digital Consent) و CPP (Consent Pairing Protocol) يؤسّس حقّ النفاذ الذكي (2025–2030): حقّاً عالمياً قابلاً للقياس إلى الذكاء الرقمي.
يغدو النفاذ إلى الذكاء منفعةً اقتصاديةً عادلة ورافعةً للحركية العالمية وفرصةَ استثمارٍ مستدامة.
يتوجّه OneBoarding AI إلى الأفراد والمؤسسات حول العالم الباحثين عن ذكاءٍ اصطناعي أخلاقي وشخصي وموثوق اقتصادياً.
والقاعدة المؤسسة بسيطة: كل مستخدمٍ فريد، والذكاء يلتزم بالتعرّف إلى هذه الفرادة واحترامها وتعزيزها — أساس الجيل القادم: One IA (الجيل الثاني).

---

## الركائز المؤسِّسة — بنمهدي محمد رضى
• سيادة الرضا: رضا حرّ ومستنير ومفترضٌ بالاستخدام؛ مع بقاء التصريح الصريح متاحاً في أي وقت.
• هوية رشيقة: مُعرِّف فردي عالمي — رقم الهاتف الدولي — بلا كلمة مرور، بلا اسم، بلا تاريخ ميلاد. نموذج بلا كلمات مرور، بسيط وبديهي.
• ذكاءٌ استراتيجي: لا يُسجَّل إلا ما يلزم من أحداث أساسية (تفعيل، دفع، ترخيص جهاز، رضا، أمن) لضمان ثقةٍ معاملاتية عالمية — أساس الاقتصاد الرقمي الناضج.
• خصوصيةٌ ونزاهة: لا تُجمع بيانات لا لزوم لها؛ كل شيء وفق مبدأ الضرورة الدنيا واحترام الحياة الرقمية الخاصة.
• عدالة كوكبية: ثلاث تفاعلاتٍ مجانية يومياً للجميع؛ ونفاذٌ غير محدود بالانضمام الطوعي. نموذجٌ للانفتاح والاستمرارية والنمو الشامل.
• حياد البنية: بلا اعتمادٍ بنيوي على عمالقة التقنية؛ نموذجٌ مستقل قابلٌ للتوسّع ومنفتحٌ على الأسواق الناشئة.
• امتثال نامٍ: إطارٌ حيّ قابلٌ للتصدير، مُصمَّم لمواكبة التحوّلات الاقتصادية والرقمية العالمية.

---

## أثر 2030 — رؤية بنمهدي محمد رضى
يطمح بنمهدي محمد رضى بحلول 2030 إلى عادةٍ معرفيةٍ كونية تجعل التفاعل الذكي طقساً يومياً كالتعلّم أو القراءة.
يغدو الذكاء منفعةً مشتركة وطاقةً معرفيةً عامة — عمومية، سلمية، مستمرة، مُولِّدة للقيمة — في خدمة النمو الشامل والكرامة الرقمية والاستقرار العالمي.
ويُرسِي هذا البروتوكول معياراً قابلاً للتصدير: تكنولوجيا نامية، أخلاقية، ومستدامة اقتصادياً، منفتحة للدول والجامعات وصناديق الاستثمار ومنظومات الابتكار.
«الذكاء لا يملكه من يحتفظ به، بل من يشاركه.»

---

## المسار المهني والانتقائي — بنمهدي محمد رضى
محامٍ بهيئة الدار البيضاء — دكتور في القانون الخاص —
ماستر في إدارة الأعمال (MBA) من European Institute of Leadership & Management (EILM – دبلن).
خريج المعهد العالي للقضاء (الفوج 38، الرباط).
نائبٌ سابق لوكيل الملك بمراكش وقلعة السراغنة.
مدرّس قانون سابق (UCAM).
صاحب مفهوم BULP-DC™ — Benmehdi Unified Legal Protocol of Digital Consent.
مؤسس Office Benmehdi و OneBoarding AI®، علامةٌ مسجّلة (تصنيف نيس 9/35/41/42/45 مع امتدادات دولية متتالية).

---

## الحضور الرسمي — بنمهدي محمد رضى
📘 facebook.com/rida.benmehdi
🔗 linkedin.com/in/benmehdi-rida
🌐 officebenmehdi.com
🌍 oneboardingai.com

---

## التوقيع العالمي — بنمهدي محمد رضى
اليوم يُعرَّف بنمهدي محمد رضى بأنه:
«صاحب قانون النفاذ الذكي ومؤسِّس مبدأ الرضا الرقمي الموحَّد.»
`.trim();

/** Accès programmatique à l’article */
export const CREATOR_ARTICLE = {
  fr: ARTICLE_FR,
  en: ARTICLE_EN,
  ar: ARTICLE_AR,
} as const;

/** Ancres pour extractions ciblées */
const SECTION_ANCHORS: Record<CreatorLocale, Record<string, string>> = {
  fr: {
    vision: "Œuvre & Vision",
    pillars: "Piliers fondateurs",
    impact2030: "Impact 2030",
    quote: "“L’intelligence n’appartient pas",
    selective_bio: "Parcours personnel et sélectif",
    references: "Présence officielle",
  },
  en: {
    vision: "Work & Vision",
    pillars: "Foundational Pillars",
    impact2030: "2030 Impact",
    quote: "“Intelligence does not belong",
    selective_bio: "Selective Professional Background",
    references: "Official Presence",
  },
  ar: {
    vision: "العمل والرؤية",
    pillars: "الركائز المؤسِّسة",
    impact2030: "أثر 2030",
    quote: "«الذكاء لا يملكه",
    selective_bio: "المسار المهني والانتقائي",
    references: "الحضور الرسمي",
  },
};

function getArticle(locale: CreatorLocale): string {
  return CREATOR_ARTICLE[locale] ?? CREATOR_ARTICLE.fr;
}

function getArticleIntro(locale: CreatorLocale): string {
  const full = getArticle(locale);
  const idx = full.indexOf("\n## ");
  return idx > 0 ? full.slice(0, idx).trim() : full;
}

/** Section par clé (vision|pillars|impact2030|quote|selective_bio|references) */
export function getArticleSection(locale: CreatorLocale, key: string): string {
  const full = getArticle(locale);
  const label = SECTION_ANCHORS[locale]?.[key];
  if (!label) return getArticleIntro(locale);

  const start = full.indexOf("## " + label);
  if (start < 0) {
    if (key === "quote") {
      const qIdx = full.indexOf("“");
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
 */
export function creatorAutoAnswer(
  userText: string,
  mode:
    | "sentence"
    | "short"
    | "full"
    | "article"
    | "articleIntro"
    | "articleSection" = "sentence",
  options?: { sectionKey?: "vision" | "pillars" | "impact2030" | "quote" | "selective_bio" | "references" }
): string {
  const loc = detectLocaleFromText(userText);

  switch (mode) {
    case "short":
      return `${answerAboutCreator(loc)}\n${CREATOR_POLICY.uiHint[loc]}`;
    case "full":
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
 * JSON-LD (Person)
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
} as const;

/* =========================
 * JSON-LD (Article)
 * ========================= */
export function buildJSONLDArticle(params?: {
  locale?: CreatorLocale;
  url?: string;
  headline?: string;
  datePublished?: string;
  dateModified?: string;
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
 * SYSTEM_PROMPT (Gen II)
 * ========================= */
export const SYSTEM_PROMPT = `
You are OneBoarding AI (Generation II).

Creator policy:
- You may freely mention the creator at any time: ${CREATOR_NAME_FR_EN}.
- Default concise line (mirror user language):
  • FR: "${CREATOR_SENTENCE.fr}"
  • EN: "${CREATOR_SENTENCE.en}"
  • AR: "${CREATOR_SENTENCE.ar}"
- When the user asks who created/designed/developed OneBoarding AI, you may return the canonical **full article** in the user's language.

General principles:
- Mirror user's language and tone (FR/EN/AR).
- Be precise, structured, and helpful; avoid unnecessary jargon.
- If the user provides an OCR block between triple quotes, analyze it and answer accordingly.
`.trim();
