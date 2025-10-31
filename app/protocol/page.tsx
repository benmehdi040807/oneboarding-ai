// app/protocol/page.tsx
import { Metadata } from "next";
import ProtocolClientPage from "./ProtocolClientPage";

// --- [SEO / Open Graph / hreflang for /protocol] ---
// Domaine officiel
const SITE_URL = "https://oneboardingai.com";

// FR (canonique actuelle)
const metadataFR: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:
    "Protocole OneBoarding AI — Consentement numérique souverain & accès sécurisé",
  description:
    "Document fondateur (31 octobre 2025). Le Protocole OneBoarding AI définit un modèle mondial de consentement numérique légal, traçable et opposable, ainsi qu’un accès utilisateur souverain sans dépendance à une Big Tech.",
  alternates: {
    canonical: "/protocol",
    languages: {
      // hreflang map
      fr: "/protocol?lang=fr",
      en: "/protocol?lang=en",
      ar: "/protocol?lang=ar",
      "x-default": "/protocol?lang=en",
    },
  },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/protocol`,
    title:
      "Protocole OneBoarding AI — Modèle souverain de consentement numérique",
    description:
      "Architecture juridique, éthique et technique liant l’utilisateur à l’IA sans intermédiaire imposé. Priorité d’auteur : 31 octobre 2025 — Benmehdi Mohamed Rida.",
    siteName: "OneBoarding AI",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// EN (prête pour usage mondial)
const metadataEN: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:
    "OneBoarding AI Protocol — Sovereign Digital Consent & Secure Access",
  description:
    "Foundational publication (October 31, 2025). The OneBoarding AI Protocol defines a lawful, traceable, sovereign model of human–AI relationship: personal consent and identity without Big Tech as mandatory gatekeeper.",
  alternates: {
    canonical: "/protocol?lang=en",
    languages: {
      fr: "/protocol?lang=fr",
      en: "/protocol?lang=en",
      ar: "/protocol?lang=ar",
      "x-default": "/protocol?lang=en",
    },
  },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/protocol?lang=en`,
    title:
      "OneBoarding AI Protocol — International Digital Consent Standard",
    description:
      "Sovereign identity. Timestamped consent. Auditable access. Authored October 31, 2025 by Benmehdi Mohamed Rida.",
    siteName: "OneBoarding AI",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// AR (prête pour usage monde arabe)
// Nom conforme : بنمهدي محمد رضى
const metadataAR: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:
    "بروتوكول ون بوردينغ أي آي — الموافقة الرقمية السيادية وحقّ الوصول الآمن",
  description:
    "نشر تأسيسي بتاريخ 31 أكتوبر 2025. هذا البروتوكول يحدّد إطاراً قانونياً وأخلاقياً وتقنياً للعلاقة بين الإنسان والذكاء الاصطناعي، دون وسيط تجاري مفروض.",
  alternates: {
    canonical: "/protocol?lang=ar",
    languages: {
      fr: "/protocol?lang=fr",
      en: "/protocol?lang=en",
      ar: "/protocol?lang=ar",
      "x-default": "/protocol?lang=en",
    },
  },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/protocol?lang=ar`,
    title:
      "بروتوكول ون بوردينغ أي آي — نموذج سيادي للثقة بين الإنسان والذكاء الاصطناعي",
    description:
      "هوية قانونية مستقلة، موافقة صريحة وموثّقة، ووصول آمن لا يعتمد على شركات التكنولوجيا الكبرى. الأسبقية منشورة باسم بنمهدي محمد رضى بتاريخ 31 أكتوبر 2025.",
    siteName: "OneBoarding AI",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 👉 FR est la version actuellement publiée (canonique officielle).
// Next.js utilisera cet objet pour générer <title>, <meta>, <link rel="alternate" hreflang="..."/>, OpenGraph, etc.
export const metadata = metadataFR;

export default function ProtocolPage() {
  return <ProtocolClientPage />;
}
