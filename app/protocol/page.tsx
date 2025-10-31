// app/protocol/page.tsx

import { Suspense } from "react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { protocolCopy } from "@/lib/protocol/copy";

// --- [SEO / Open Graph / hreflang for /protocol] ---
// Domaine officiel
const SITE_URL = "https://oneboardingai.com";

// FR (canonique actuelle)
const metadataFR = {
  metadataBase: new URL(SITE_URL),
  title:
    "Protocole OneBoarding AI — Consentement numérique souverain & accès sécurisé",
  description:
    "Document fondateur (31 octobre 2025). Le Protocole OneBoarding AI définit un modèle mondial de consentement numérique légal, traçable et opposable, ainsi qu’un accès utilisateur souverain sans dépendance à une Big Tech.",
  alternates: {
    canonical: "/protocol",
    languages: {
      fr: "/protocol?lang=fr",
      en: "/protocol?lang=en",
      ar: "/protocol?lang=ar",
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

// EN (prête pour future route /en/protocol)
const metadataEN = {
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

// AR (prête pour future route /ar/protocol)
// Correction du nom : بنمهدي محمد رِضى
const metadataAR = {
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
    },
  },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/protocol?lang=ar`,
    title:
      "بروتوكول ون بوردينغ أي آي — نموذج سيادي للثقة بين الإنسان والذكاء الاصطناعي",
    description:
      "هوية قانونية مستقلة، موافقة صريحة وموثّقة، ووصول آمن لا يعتمد على شركات التكنولوجيا الكبرى. الأسبقية منشورة باسم بنمهدي محمد رِضى بتاريخ 31 أكتوبر 2025.",
    siteName: "OneBoarding AI",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 👉 FR est la version actuellement publiée.
// Next.js va prendre celle-ci pour construire les balises <title>, <meta>, OG, etc.
export const metadata = metadataFR;


// -----------------------------------------------------------------------------
// WRAPPER SERVER COMPONENT
// -----------------------------------------------------------------------------

export default function ProtocolPageWrapper() {
  return (
    <Suspense>
      <ProtocolClientPage />
    </Suspense>
  );
}


// -----------------------------------------------------------------------------
// CLIENT COMPONENT (ton code existant, inchangé visuellement)
// -----------------------------------------------------------------------------

function ProtocolClientPage() {
  "use client";

  type Lang = "fr" | "en" | "ar";

  const searchParams = useSearchParams();
  const langParam = (searchParams.get("lang") || "fr").toLowerCase() as Lang;

  // Sécurité : forcer fr/en/ar uniquement
  const lang: Lang = ["fr", "en", "ar"].includes(langParam) ? langParam : "fr";

  const copy = useMemo(() => protocolCopy[lang], [lang]);
  const isRTL = lang === "ar";

  return (
    <main
      className={`min-h-screen w-full bg-neutral-950 text-neutral-100 flex justify-center px-4 py-10`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <article className="w-full max-w-3xl text-base leading-relaxed text-neutral-200">
        {/* PREFACE / HEADER */}
        <header className="mb-10 border border-neutral-800/60 rounded-2xl bg-neutral-900/40 p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          {/* petite accroche trilingue */}
          <div className="text-xs sm:text-[13px] text-neutral-400 space-y-1 mb-4">
            {copy.intro.prefaceTop.map((line, idx) => (
              <div key={idx} className="flex flex-wrap gap-1">
                <span>{line}</span>
              </div>
            ))}
          </div>

          {/* Titre principal */}
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-100 mb-2">
            {copy.intro.heading}
          </h1>

          {/* Sous-titre */}
          <p className="text-sm text-neutral-400 mb-3">
            {copy.intro.subtitle}
          </p>

          {/* Version / date */}
          <p className="text-xs text-neutral-500">
            {copy.intro.dateVersion}
          </p>
        </header>

        {/* SECTIONS PRINCIPALES */}
        <section className="space-y-10">
          {copy.sections.map((section, i) => (
            <div
              key={i}
              className="border-l-2 border-neutral-800 pl-4 rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-4"
            >
              {/* Titre de section */}
              <h2 className="text-lg font-semibold text-neutral-100 mb-4">
                {section.title}
              </h2>

              {/* Paragraphes principaux */}
              <div className="space-y-4 text-neutral-300">
                {section.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-[15px] leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {/* Liste éventuelle */}
              {section.list && section.list.length > 0 && (
                <ul className="mt-4 space-y-2 text-[15px] text-neutral-300 leading-relaxed">
                  {section.list.map((item, idx2) => (
                    <li
                      key={idx2}
                      className="flex gap-2"
                    >
                      <span className="text-neutral-500 select-none">
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Sous-sections éventuelles */}
              {section.subSections && section.subSections.length > 0 && (
                <div className="mt-6 space-y-6">
                  {section.subSections.map((sub, idx3) => (
                    <div
                      key={idx3}
                      className="rounded-xl bg-neutral-900/40 border border-neutral-800/60 p-4"
                    >
                      <h3 className="text-[15px] font-semibold text-neutral-100 mb-3">
                        {sub.subTitle}
                      </h3>

                      <div className="space-y-3 text-[15px] leading-relaxed text-neutral-300">
                        {sub.paragraphs.map((sp, idx4) => (
                          <p key={idx4}>{sp}</p>
                        ))}
                      </div>

                      {sub.list && sub.list.length > 0 && (
                        <ul className="mt-3 space-y-2 text-[15px] text-neutral-300 leading-relaxed">
                          {sub.list.map((li, idx5) => (
                            <li
                              key={idx5}
                              className="flex gap-2"
                            >
                              <span className="text-neutral-500 select-none">
                                •
                              </span>
                              <span>{li}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* BLOCS RÉFÉRENCES */}
        <section className="mt-14 border border-neutral-800/60 rounded-2xl bg-neutral-900/30 p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <h2 className="text-base font-semibold text-neutral-100 mb-4">
            {copy.referencesBlockTitle}
          </h2>

          <ul className="space-y-2 text-[15px] leading-relaxed text-blue-400">
            {copy.referencesLinks.map((ref, idx) => (
              <li key={idx} className="break-all">
                <a
                  href={ref.href}
                  className="hover:underline focus:underline outline-none"
                >
                  {ref.text}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* SIGNATURE OFFICIELLE */}
        <section className="mt-10 border border-neutral-800/60 rounded-2xl bg-neutral-900/40 p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <h2 className="text-base font-semibold text-neutral-100 mb-4 flex flex-wrap items-center gap-2">
            {copy.signatureBlock.heading}
          </h2>

          <div className="text-[15px] leading-relaxed text-neutral-300 space-y-1 mb-4">
            {copy.signatureBlock.authorLines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>

          <div className="text-[13px] leading-relaxed text-neutral-500 space-y-1">
            {copy.signatureBlock.footerLines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </section>

        {/* BOUTON RETOUR ACCUEIL */}
        <div className="mt-12 flex">
          <a
            href="/"
            className="inline-block rounded-xl bg-neutral-800 text-neutral-100 text-sm font-medium px-4 py-2 border border-neutral-700 hover:bg-neutral-700 focus:bg-neutral-700 outline-none transition-colors"
          >
            {copy.backButtonLabel}
          </a>
        </div>

        {/* FOOTER TECH INFO (lang/debug) */}
        <footer className="mt-8 text-[11px] text-neutral-600 text-center select-none">
          <div>
            OneBoarding AI · {lang.toUpperCase()} · {copy.intro.dateVersion}
          </div>
        </footer>
      </article>
    </main>
  );
}
