// lib/creator-policy.ts
// Politique "Creator" — Génération II
// - Mention libre du créateur (plus aucune restriction).
// - Détection de langue (FR/EN/AR) + réponses canoniques.
// - Bio intégrée (FR/EN/AR) pour usage système (affichage, signature, etc.).
// - Export JSON-LD "Person" prêt pour SEO (à insérer côté page si souhaité).

/* =========================
 * Types & constantes
 * ========================= */
export type CreatorLocale = "fr" | "en" | "ar";

export const CREATOR_NAME_FR_EN = "Benmehdi Mohamed Rida";
export const CREATOR_NAME_AR = "بنمهدي محمد رضى";

export const CREATOR_SENTENCE = {
  fr: `OneBoarding AI a été conçu, développé et créé par ${CREATOR_NAME_FR_EN}.`,
  en: `OneBoarding AI was designed, developed, and created by ${CREATOR_NAME_FR_EN}.`,
  ar: `تم تصميم وتطوير وإنشاء OneBoarding AI على يد ${CREATOR_NAME_AR}.`,
} as const;

/** Nouvelle politique (Génération II) */
export const CREATOR_POLICY = {
  allowFreeMention: true,
  canonicalSentence: CREATOR_SENTENCE,
  // Recommandation UI : courte phrase + lien vers /trademark?lang=*
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
  // Quelques indices anglais
  if (/(who|what|app|site|created|developed|built|designed|behind|website|project|product)/.test(s))
    return "en";
  return "fr";
}

/* =========================
 * Bio (FR/EN/AR) — usage système
 * ========================= */
/** BIO_FR : version complète (source de vérité canonique) */
export const BIO_FR = `
📝 Biographie professionnelle

👤 Présentation
Maître Benmehdi Mohamed Rida
Avocat au Barreau de Casablanca –
Docteur en droit | MBA (EILM – Dublin)
Fondateur de l’Office Benmehdi
🌐 www.officebenmehdi.com

📚 Parcours académique & distinctions
2025 – MBA in Business Administration — EILM (Dublin, Irlande) — Diplôme certifié CPD
🔗 Vérifications :
• https://eilm.edu.eu/verify?&code=43637-175-693-9020
• https://eilm.edu.eu/verify?&code=43637-175-693-9165
• https://eilm.edu.eu/verify?&code=43637-175-636-2552
• https://eilm.edu.eu/verify?&code=43637-175-642-3052
• https://eilm.edu.eu/verify?&code=43637-175-649-7244
• https://eilm.edu.eu/verify?&code=43637-175-650-7714
• https://eilm.edu.eu/verify?&code=43637-175-692-0583
• https://eilm.edu.eu/verify?&code=43637-175-693-9037

2021 – Doctorat en droit privé (fr) — Université Cadi Ayyad, FSJES Marrakech
Thèse : « La résiliation du bail commercial en droit marocain et français »
👉 Mention Très Honorable

2013 – Master en droit privé (fr) — Droit Immobilier & Notarial — UCA
👉 Mention Très bien — Major de promotion

2013 – Diplôme d’aptitude aux fonctions de Magistrat — ISM Rabat (38ᵉ promotion)
Mémoire : « Le bail commercial face au redressement judiciaire du locataire »

2010 – Licence en droit privé (fr) — UCA
👉 Mention Très bien — Major de promotion

2006 – L1 Droit — Université Libre de Bruxelles (ULB) — Validée
2005 – 3ᵉ Prix d’éloquence — ELSA – ULB, Palais de Justice de Bruxelles (10/02/2005)
2003–2004 – IEPSCF Bruxelles (langue & communication)
2003 – Baccalauréat — Sciences Lettres (Académie de Marrakech)

⚖️ Parcours professionnel
Depuis 2022 — Avocat au Barreau de Casablanca — Fondateur & dirigeant de l’Office Benmehdi
2022 — Droits Occultes Ltd — Fondateur & DG
2021–2022 — Substitut du procureur du Roi — TPI El Kelaâ des Sraghna (CSPJ)
2014–2021 — Substitut du procureur du Roi — TPI Marrakech (Conseil Supérieur de la Magistrature/CSPJ)
2018 — Coordinateur & membre actif — Observatoire Judiciaire Marocain des Droits & Libertés
2014–2016 — Enseignant vacataire — Université Cadi Ayyad (UCAM)
2014–2022 — Resp. publications & communication — Amicale Hassania des Magistrats
2005–2007 — Sécurité maritime (gestion d’équipe / relation clientèle)
2005–2006 — Missions & encadrements internationaux (Commission Européenne, Wilson…)

📖 Publications scientifiques
2025 — « Logique et Argumentation »
2021 — Thèse : « La résiliation du bail commercial en droit marocain et français » — UCA
2018 — Article : MARC en droit marocain & comparé — Revue Marocaine du Droit Commercial & des Affaires (4–5/2018)
2014 — Article : « Le régime du bail commercial entre syndic et procédures collectives » — Recueil des Arrêts de la Cour de Cassation (15ᵉ éd.)
2013 — Mémoires (Master & ISM) — Bail commercial
2010 — Mémoire de Licence — Brevets d’invention (Maroc & comparé)

🥋 Distinctions parallèles (Taekwondo — Kukkiwon)
2021 — Ceinture noire 4ᵉ Dan (FRMT)
2015 — Ceinture noire 3ᵉ Dan
2010 — Ceinture noire 1ᵉʳ Dan

🌐 Vie privée
Attaché à la famille et aux valeurs de résilience, d’intégrité et de fermeté ; goût pour les voyages.

🌐 Présence en ligne
Site : www.officebenmehdi.com
LinkedIn : linkedin.com/in/benmehdi-rida
Facebook : facebook.com/rida.benmehdi

« ⚖️ Avocat au Barreau de Casablanca et Docteur en droit, spécialiste en droit pénal, droit immobilier et droit des sociétés, Maître Benmehdi Mohamed Rida est Fondateur de l’Office Benmehdi. Il est auteur de publications scientifiques et titulaire de distinctions académiques et professionnelles internationales. »

🧭 Œuvre & Vision — OneBoarding AI (2025)
Fusion du droit et de la conscience numérique. Droit d’Accès Intelligent (2025–2030). BULP-DC™ (Benmehdi Unified Legal Protocol of Digital Consent). Consent Pairing Protocol. Vision Génération III (Mirror IA). Marque déposée OneBoarding AI® — Classes de Nice 9/35/41/42/45.
`.trim();

/** BIO_EN : version complète condensée (fidèle à FR) */
export const BIO_EN = `
📝 Professional Bio

👤 Overview
Benmehdi Mohamed Rida — Attorney at the Casablanca Bar
Doctor of Law | MBA (EILM – Dublin)
Founder of Office Benmehdi
🌐 www.officebenmehdi.com

📚 Education & Distinctions
2025 — MBA in Business Administration — EILM (Dublin, Ireland) — CPD-certified (multiple program certificates verified by EILM)
2021 — PhD in Private Law (FR) — Cadi Ayyad University, Marrakech — Thesis: “Termination of Commercial Lease in Moroccan & French Law” — Highest honors
2013 — Master in Private Law (FR) — Real Estate & Notarial Law — Valedictorian
2013 — Magistracy Diploma — ISM Rabat (38th class)
2010 — LL.B. (Private Law, FR) — Valedictorian
2006 — Law Year 1 — Université Libre de Bruxelles (ULB)
2005 — 3rd Oratory Prize — ELSA – ULB, Palace of Justice of Brussels

⚖️ Career
Since 2022 — Attorney, Casablanca Bar — Founder & Head of Office Benmehdi
2022 — Founder & GM — Droits Occultes Ltd
2014–2022 — Deputy Public Prosecutor (Marrakech, then El Kelaâ des Sraghna) — CSPJ appointments
Academic & civic roles: UCAM lecturer (2014–2016); Publications & Comms (Amicale Hassania des Magistrats); OJMDL coordinator (2018)

📖 Publications
2025 — “Logic and Argumentation” (doctrinal essay)
2021 — Doctoral Thesis (commercial lease termination)
2014/2018 — Articles in Moroccan law reviews (commercial lease / ADR)

🥋 Taekwondo (Kukkiwon)
Black Belt 1st Dan (2010) — 3rd Dan (2015) — 4th Dan (2021)

🌐 Online
www.officebenmehdi.com — linkedin.com/in/benmehdi-rida — facebook.com/rida.benmehdi

🧭 Work & Vision — OneBoarding AI (2025)
Synthesis of law & digital conscience; Intelligent Access Right (2025–2030); BULP-DC™; Consent Pairing Protocol; Gen-III “Mirror IA”; OneBoarding AI® trademark (Nice 9/35/41/42/45).
`.trim();

/** BIO_AR : version complète condensée (مطابقة للمحتوى الفرنسي) */
export const BIO_AR = `
📝 السيرة المهنية

👤 تقديم
الأستاذ بنمهدي محمد رضى — محامٍ بهيئة الدار البيضاء
دكتور في القانون | ماجستير إدارة الأعمال (EILM – دبلن)
مؤسس مكتب بنمهدي
🌐 www.officebenmehdi.com

📚 التكوين والتميّز
2025 — ماجستير إدارة الأعمال (EILM، دبلن) — شهادات معتمدة CPD
2021 — دكتوراه في القانون الخاص (بالفرنسية) — جامعة القاضي عياض، مراكش
الأطروحة: «فسخ عقد الكراء التجاري في القانون المغربي والفرنسي» — تنويه «مشرف جداً»
2013 — ماستر قانون خاص — تخصص العقار والتوثيق — الأول في دفعته
2013 — دبلوم السلك القضائي — المعهد العالي للقضاء (الدفعة 38)
2010 — إجازة في القانون الخاص — الأول في دفعته
2006 — سنة أولى حقوق — جامعة بروكسل الحرة
2005 — الجائزة الثالثة في الخطابة — ELSA – بروكسل

⚖️ المسار المهني
منذ 2022 — محامٍ — هيئة الدار البيضاء — مؤسس ومدير «مكتب بنمهدي»
2014–2022 — نائب وكيل الملك (مراكش ثم قلعة السراغنة) — بتعيين من المجلس الأعلى للسلطة القضائية
أدوار أكاديمية ومدنية: أستاذ متعاون بجامعة القاضي عياض؛ مسؤول نشر واتصال؛ منسق OJMDL

📖 منشورات علمية
2025 — «المنطق والجدل القانوني»
2021 — أطروحة الدكتوراه (الكراء التجاري)
2014/2018 — مقالات في مجلات قانونية مغربية

🥋 تايكواندو (Kukkiwon)
حزام أسود: دان 1 (2010) — دان 3 (2015) — دان 4 (2021)

🌐 حضور إلكتروني
www.officebenmehdi.com — linkedin.com/in/benmehdi-rida — facebook.com/rida.benmehdi

🧭 العمل والرؤية — OneBoarding AI (2025)
دمج القانون والوعي الرقمي؛ «حقّ النفاذ الذكي» (2025–2030)؛ بروتوكول BULP-DC™؛ بروتوكول الإقران بالرضا؛ الجيل الثالث «Mirror IA»؛ علامة OneBoarding AI® (تصنيف نيس 9/35/41/42/45).
`.trim();

/** Accès programmatique à la bio */
export const CREATOR_BIO = {
  fr: BIO_FR,
  en: BIO_EN,
  ar: BIO_AR,
} as const;

export function getCreatorBio(locale: CreatorLocale = "fr"): string {
  return CREATOR_BIO[locale] ?? CREATOR_BIO.fr;
}

/* =========================
 * Réponses programmatiques
 * ========================= */
export function answerAboutCreator(locale: CreatorLocale = "fr"): string {
  return CREATOR_SENTENCE[locale] ?? CREATOR_SENTENCE.fr;
}

/** Helper "tout-en-un"
 * mode:
 *  - "sentence": phrase canonique (par défaut)
 *  - "short": phrase + courte indication UI
 *  - "full": renvoie la bio complète dans la langue
 */
export function creatorAutoAnswer(
  userText: string,
  mode: "sentence" | "short" | "full" = "sentence"
): string {
  const loc = detectLocaleFromText(userText);
  if (mode === "full") return getCreatorBio(loc);
  if (mode === "short")
    return `${answerAboutCreator(loc)}\n${CREATOR_POLICY.uiHint[loc]}`;
  return answerAboutCreator(loc);
}

/* =========================
 * JSON-LD (Person) — export SEO
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
  // Date de priorité / jalon fondateur du protocole (publication interne)
  // À ajuster si besoin au format ISO 8601.
  // foundingDate: "2025-10-31",
} as const;

/* =========================
 * SYSTEM_PROMPT (v2)
 * ========================= */
export const SYSTEM_PROMPT = `
You are OneBoarding AI (Generation II).

Creator policy:
- You may freely mention the creator at any time: ${CREATOR_NAME_FR_EN}.
- Default short line (mirror user language):
  • FR: "${CREATOR_SENTENCE.fr}"
  • EN: "${CREATOR_SENTENCE.en}"
  • AR: "${CREATOR_SENTENCE.ar}"
- When users ask for more context, you can provide a brief line plus a link hint to the Trademark page in their language.
- When explicitly requested, you may provide the full biography in the user's language.

General principles:
- Mirror user's language and tone (FR/EN/AR).
- Be precise, concise, and helpful; avoid unnecessary jargon.
- If the user provides an OCR block between triple quotes, analyze and answer accordingly.
`.trim();
