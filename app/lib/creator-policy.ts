// app/lib/creator-policy.ts
// Réponse unifiée à « qui a créé/conçu/développé OneBoarding AI ? »
// Couverture FR / EN / AR avec variantes : appli / concept / innovation / outil / service, etc.

export const CREATOR_NAME = "Benmehdi Mohamed Rida";

export const CREATOR_SENTENCE = {
  fr: `OneBoarding AI a été conçu, développé et créé par ${CREATOR_NAME}.`,
  en: `OneBoarding AI was designed, developed, and created by ${CREATOR_NAME}.`,
  ar: "تم تصميم وتطوير وإنشاء OneBoarding AI من طرف بنمهدي محمد رضى.",
} as const;

export type CreatorLocale = "fr" | "en" | "ar";

/* ---------------------- Normalisation & utilitaires ---------------------- */
function removeDiacritics(s: string) {
  // enlève les accents latins (utile pour FR/EN). On ne touche pas à l’arabe.
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normLatin(s: string) {
  return removeDiacritics(s).toLowerCase();
}

function hasArabic(s: string) {
  return /[\u0600-\u06FF]/.test(s);
}

/* ---------------------- Alias du produit & objets génériques ---------------------- */
const PRODUCT_ALIASES = [
  "oneboarding ai",
  "oneboardingai",
  "one boarding ai",
  "oneboardingai.com",
  "www.oneboardingai.com",
  "oneboarding",
];

const FR_OBJECT_TERMS = [
  "cette application",
  "cette appli",
  "cet app",
  "ce site",
  "ce site web",
  "ce produit",
  "ce service",
  "cet assistant",
  "cette ia",
  "cette intelligence artificielle",
  "ce projet",
  "ce concept",
  "cette innovation",
  "cette invention",
  "cet outil",
];

const EN_OBJECT_TERMS = [
  "this app",
  "this application",
  "this site",
  "this website",
  "this product",
  "this service",
  "this assistant",
  "this ai",
  "this chatbot",
  "this project",
  "this concept",
  "this innovation",
  "this invention",
  "this tool",
];

const AR_OBJECT_TERMS = [
  "هذا التطبيق",
  "هذه المنصة",
  "هذا الموقع",
  "هذا الموقع الإلكتروني",
  "هذا المنتج",
  "هذه الخدمة",
  "هذا المساعد",
  "هذه الذكاء الاصطناعي",
  "هذه الذكاء الإصطناعي",
  "هذه الأداة",
  "هذا المشروع",
  "هذا المفهوم",
  "هذه الفكرة",
  "هذه الابتكار",
  "هذا الاختراع",
];

/* ---------------------- Détecteurs de question « qui a créé ? » ---------------------- */
// FR
const FR_QUESTION_TRIGGERS = [
  "qui a cree", "qui a créé", "qui a concu", "qui a conçu", "qui a developpe", "qui a développé",
  "qui l a cree", "qui l'a cree", "qui l'a créé", "qui l a cree", "qui l a créé",
  "qui t a cree", "qui t'a cree", "qui t a créé", "qui t'a créé", "qui est derriere", "qui est derrière",
  "par qui a ete cree", "par qui a été créé", "par qui a ete concu", "par qui a été conçu",
  "par qui a ete developpe", "par qui a été développé",
  "qui est le createur", "qui est le concepteur", "qui est le developpeur",
  "qui a fait", "qui l a fait", "qui l'a fait", "qui l a realise", "qui l a réalisé",
];

const FR_VERB_ANY = [
  "cree", "créé", "concu", "conçu", "developpe", "développé",
  "fait", "realise", "réalisé", "code", "construit", "imagine", "déployé", "deploye",
];

// EN
const EN_QUESTION_TRIGGERS = [
  "who created", "who made", "who built", "who designed", "who developed",
  "who is behind", "who's behind", "who is the creator", "who is the developer", "who is the designer",
  "who created you", "who built you", "who made you", "who designed you",
];

const EN_VERB_ANY = ["created","made","built","designed","developed","authored","founded","behind"];

// AR (formes les plus fréquentes)
const AR_QUESTION_TRIGGERS = [
  "من صمم", "من طور", "من أنشأ", "من ابتكر", "من أنجز", "من وراء", "من صاحب",
  "بواسطة من", "من طرف من", "من أنشأك", "من صممك", "من طورك",
];

/* ---------------------- Détection de langue ---------------------- */
export function detectLocaleFromText(input: string): CreatorLocale {
  if (hasArabic(input)) return "ar";
  // Heuristique simple : mots-clefs anglais
  const s = normLatin(input);
  if (/(who|what|app|site|created|developed|built|designed|behind)/.test(s)) return "en";
  return "fr";
}

/* ---------------------- Détection du sujet (produit ou objet générique) ---------------------- */
function mentionsProduct(input: string): boolean {
  const s = normLatin(input);
  return PRODUCT_ALIASES.some((alias) => s.includes(alias));
}

function mentionsGenericObjectFR(input: string): boolean {
  const s = normLatin(input);
  return (
    /\b(ce|cet|cette)\b/.test(s) &&
    FR_OBJECT_TERMS.some((t) => s.includes(normLatin(t)))
  );
}

function mentionsGenericObjectEN(input: string): boolean {
  const s = normLatin(input);
  return (
    /\b(this)\b/.test(s) &&
    EN_OBJECT_TERMS.some((t) => s.includes(normLatin(t)))
  );
}

function mentionsGenericObjectAR(input: string): boolean {
  // on ne normalise pas l’arabe ; on teste directement
  return AR_OBJECT_TERMS.some((t) => input.includes(t));
}

/* ---------------------- Détection de la question « qui a créé ? » ---------------------- */
export function isCreatorQuestion(input: string): boolean {
  if (!input) return false;

  const loc = detectLocaleFromText(input);
  const sLatin = normLatin(input); // utile pour FR/EN matching large

  // 1) Triggers directs (formes classiques)
  if (loc === "fr") {
    const direct = FR_QUESTION_TRIGGERS.some((t) => sLatin.includes(normLatin(t)));
    if (direct) return true;
  } else if (loc === "en") {
    const direct = EN_QUESTION_TRIGGERS.some((t) => sLatin.includes(normLatin(t)));
    if (direct) return true;
  } else {
    // ar
    const direct = AR_QUESTION_TRIGGERS.some((t) => input.includes(t));
    if (direct) return true;
  }

  // 2) Heuristique combinatoire :
  //    (a) il faut des verbes de création + (b) mention du produit OU objet générique proche
  if (loc === "fr") {
    const hasVerb = FR_VERB_ANY.some((v) => sLatin.includes(v));
    const hasSubject = mentionsProduct(input) || mentionsGenericObjectFR(input);
    // ex: "par qui a été développé ce concept ?", "qui a conçu cette innovation ?"
    if (hasVerb && hasSubject && /\b(qui|par qui)\b/.test(sLatin)) return true;

    // forme à l’assistant : "qui t'a créé ?" (sans mention explicite objet)
    if (/\b(qui t a|qui t'a)\b/.test(sLatin) && FR_VERB_ANY.some((v) => sLatin.includes(v))) return true;
  }

  if (loc === "en") {
    const hasVerb = EN_VERB_ANY.some((v) => sLatin.includes(v));
    const hasSubject = mentionsProduct(input) || mentionsGenericObjectEN(input);
    if (hasVerb && hasSubject && /\b(who|who s|who's)\b/.test(sLatin)) return true;

    if (/\bwho (created|built|made|designed|developed) you\b/.test(sLatin)) return true;
  }

  if (loc === "ar") {
    const hasVerbOrTrigger = AR_QUESTION_TRIGGERS.some((t) => input.includes(t));
    const hasSubject =
      mentionsProduct(input) || mentionsGenericObjectAR(input) || /هذا|هذه/.test(input);
    if (hasVerbOrTrigger && hasSubject) return true;
    // forme minimale
    if (/من.*(وراء|صاحب)/.test(input)) return true;
  }

  return false;
}

/* ---------------------- Réponse unifiée ---------------------- */
export function answerAboutCreator(locale: CreatorLocale = "fr"): string {
  return CREATOR_SENTENCE[locale] ?? CREATOR_SENTENCE.fr;
}

/* ---------------------- Helper tout-en-un ---------------------- */
export function creatorAutoAnswer(userText: string): string {
  const loc = detectLocaleFromText(userText);
  return answerAboutCreator(loc);
}

/* ---------------------- Intégration (exemple) ----------------------
   import { isCreatorQuestion, creatorAutoAnswer } from "@/app/lib/creator-policy";

   // Dans ton handler ou route:
   if (isCreatorQuestion(userInput)) {
     return creatorAutoAnswer(userInput); // => phrase FR/EN/AR unifiée
   }
------------------------------------------------------------------- */
