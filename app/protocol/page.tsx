// app/protocol/page.tsx
import type { Metadata } from "next";
import { protocolCopy } from "@/lib/protocol/copy";

export const runtime = "nodejs";
export const revalidate = 3600; // ISR: refresh metadata/HTML at most once per hour

type Lang = "fr" | "en" | "ar";
const SITE_URL = "https://oneboardingai.com";

/* ---------- Helpers ---------- */
function normalizeLang(raw?: string | string[]): Lang {
  const v = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase();
  return v === "en" || v === "ar" ? (v as Lang) : "fr";
}

function descFor(lang: Lang) {
  if (lang === "ar")
    return "بروتوكول OneBoarding AI — إطار سيادي للموافقة الرقمية والوصول الآمن (31 أكتوبر 2025).";
  if (lang === "en")
    return "OneBoarding AI Protocol — Sovereign digital consent and secure access (October 31, 2025).";
  return "Protocole OneBoarding AI — Consentement numérique souverain et accès sécurisé (31 octobre 2025).";
}

function titleFor(lang: Lang) {
  if (lang === "ar")
    return "بروتوكول ون بوردينغ أي آي — الموافقة الرقمية السيادية وحقّ الوصول الآمن";
  if (lang === "en")
    return "OneBoarding AI Protocol — Sovereign Digital Consent & Secure Access";
  return "Protocole OneBoarding AI — Consentement numérique souverain & accès sécurisé";
}

/* ---------- JSON-LD (no coupling) ---------- */
function jsonLdFor(lang: Lang) {
  const url = `${SITE_URL}/protocol${lang === "fr" ? "" : `?lang=${lang}`}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#org`,
        name: "OneBoarding AI",
        url: SITE_URL,
        logo: `${SITE_URL}/brand/oneboardingai-logo.png`,
        sameAs: [
          "https://www.officebenmehdi.com",
          "https://www.linkedin.com/in/benmehdi-rida",
          "https://www.facebook.com/rida.benmehdi",
        ],
        founder: {
          "@type": "Person",
          name: "Benmehdi Mohamed Rida",
          url: "https://www.officebenmehdi.com",
        }
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#site`,
        url: SITE_URL,
        name: "OneBoarding AI",
        publisher: { "@id": `${SITE_URL}#org` }
      },
      {
        "@type": ["WebPage","Article"],
        "@id": `${url}#page`,
        url,
        isPartOf: { "@id": `${SITE_URL}#site` },
        headline: titleFor(lang),
        description: descFor(lang),
        inLanguage: lang,
        author: {
          "@type": "Person",
          name: "Benmehdi Mohamed Rida",
          url: "https://www.officebenmehdi.com"
        },
        mainEntityOfPage: url
      }
    ]
  };
}

/* ---------- SEO dynamique par langue ---------- */
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const lang = normalizeLang(searchParams?.lang);

  const alternates = {
    canonical: lang === "fr" ? "/protocol" : `/protocol?lang=${lang}`,
    languages: {
      fr: "/protocol?lang=fr",
      en: "/protocol?lang=en",
      ar: "/protocol?lang=ar",
      "x-default": "/protocol?lang=en",
    },
  } as const;

  return {
    metadataBase: new URL(SITE_URL),
    title: titleFor(lang),
    description: descFor(lang),
    alternates,
    openGraph: {
      type: "article",
      url: `${SITE_URL}${alternates.canonical}`,
      title: titleFor(lang),
      description: descFor(lang),
      siteName: "OneBoarding AI",
      images: [{ url: "/brand/oneboardingai-logo.png" }],
    },
    twitter: {
      card: "summary",
      title: titleFor(lang),
      description: descFor(lang),
      images: ["/brand/oneboardingai-logo.png"],
    },
    robots: { index: true, follow: true },
  };
}

/* ---------- Page SSR (un seul fichier) ---------- */
export default function ProtocolPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const lang = normalizeLang(searchParams?.lang);
  const copy = protocolCopy[lang];
  const isRTL = lang === "ar";

  return (
    <main
      className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex justify-center px-4 py-10"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <article className="w-full max-w-3xl text-base leading-relaxed text-neutral-200">
        {/* HEADER */}
        <header className="mb-10 border border-neutral-800/60 rounded-2xl bg-neutral-900/40 p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          {/* barre langue */}
          <div
            className={`mb-4 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <a
              href="/protocol?lang=fr"
              className={`px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-medium ${
                lang === "fr"
                  ? "bg-neutral-800 text-neutral-100 border-neutral-600 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                  : "bg-neutral-800/30 text-neutral-400 border-neutral-700 hover:bg-neutral-800/50 hover:text-neutral-200"
              }`}
            >
              FR
            </a>
            <a
              href="/protocol?lang=en"
              className={`px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-medium ${
                lang === "en"
                  ? "bg-neutral-800 text-neutral-100 border-neutral-600 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                  : "bg-neutral-800/30 text-neutral-400 border-neutral-700 hover:bg-neutral-800/50 hover:text-neutral-200"
              }`}
            >
              EN
            </a>
            <a
              href="/protocol?lang=ar"
              className={`px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-medium ${
                lang === "ar"
                  ? "bg-neutral-800 text-neutral-100 border-neutral-600 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                  : "bg-neutral-800/30 text-neutral-400 border-neutral-700 hover:bg-neutral-800/50 hover:text-neutral-200"
              }`}
            >
              AR
            </a>
          </div>

          {/* accroche */}
          <div className="text-xs sm:text-[13px] text-neutral-400 space-y-1 mb-4">
            {copy.intro.prefaceTop.map((line: string, idx: number) => (
              <div key={idx} className="flex flex-wrap gap-1">
                <span>{line}</span>
              </div>
            ))}
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-100 mb-2">
            {copy.intro.heading}
          </h1>
          <p className="text-sm text-neutral-400 mb-3">{copy.intro.subtitle}</p>
          <p className="text-xs text-neutral-500">{copy.intro.dateVersion}</p>
        </header>

        {/* SECTIONS */}
        <section className="space-y-10">
          {copy.sections.map((section: any, i: number) => (
            <div
              key={i}
              className="border-l-2 border-neutral-800 pl-4 rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-4"
            >
              <h2 className="text-lg font-semibold text-neutral-100 mb-4">
                {section.title}
              </h2>

              <div className="space-y-4 text-neutral-300">
                {section.paragraphs.map((p: string, idx: number) => (
                  <p key={idx} className="text-[15px] leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {section.list?.length > 0 && (
                <ul className="mt-4 space-y-2 text-[15px] text-neutral-300 leading-relaxed">
                  {section.list.map((item: string, idx2: number) => (
                    <li key={idx2} className="flex gap-2">
                      <span className="text-neutral-500 select-none">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.subSections?.length > 0 && (
                <div className="mt-6 space-y-6">
                  {section.subSections.map((sub: any, idx3: number) => (
                    <div
                      key={idx3}
                      className="rounded-xl bg-neutral-900/40 border border-neutral-800/60 p-4"
                    >
                      <h3 className="text-[15px] font-semibold text-neutral-100 mb-3">
                        {sub.subTitle}
                      </h3>

                      <div className="space-y-3 text-[15px] leading-relaxed text-neutral-300">
                        {sub.paragraphs.map((sp: string, idx4: number) => (
                          <p key={idx4}>{sp}</p>
                        ))}
                      </div>

                      {sub.list?.length > 0 && (
                        <ul className="mt-3 space-y-2 text-[15px] text-neutral-300 leading-relaxed">
                          {sub.list.map((li: string, idx5: number) => (
                            <li key={idx5} className="flex gap-2">
                              <span className="text-neutral-500 select-none">•</span>
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

        {/* RÉFÉRENCES */}
        <section className="mt-14 border border-neutral-800/60 rounded-2xl bg-neutral-900/30 p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <h2 className="text-base font-semibold text-neutral-100 mb-4">
            {copy.referencesBlockTitle}
          </h2>
          <ul className="space-y-2 text-[15px] leading-relaxed text-blue-400">
            {copy.referencesLinks.map((ref: any, idx: number) => (
              <li key={idx} className="break-all">
                <a href={ref.href} className="hover:underline focus:underline outline-none">
                  {ref.text}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* SIGNATURE */}
        <section className="mt-10 border border-neutral-800/60 rounded-2xl bg-neutral-900/40 p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <h2 className="text-base font-semibold text-neutral-100 mb-4 flex flex-wrap items-center gap-2">
            {copy.signatureBlock.heading}
          </h2>

          <div className="text-[15px] leading-relaxed text-neutral-300 space-y-1 mb-4">
            {copy.signatureBlock.authorLines.map((line: string, idx: number) => (
              <p key={idx}>{line}</p>
            ))}
          </div>

          <div className="text-[13px] leading-relaxed text-neutral-500 space-y-1">
            {copy.signatureBlock.footerLines.map((line: string, idx: number) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </section>

        {/* BOUTON RETOUR */}
        <div className="mt-12 flex justify-center">
          <a
            href="/"
            className="
              inline-block text-sm font-medium rounded-xl
              px-4 py-2
              border border-cyan-400/20
              bg-gradient-to-r from-blue-600/20 to-cyan-400/20
              text-cyan-300
              shadow-[0_0_30px_rgba(34,211,238,0.3)]
              hover:from-blue-600/30 hover:to-cyan-400/30
              hover:text-cyan-200
              focus:outline-none focus:ring-2 focus:ring-cyan-400/40
              transition-colors
            "
          >
            {copy.backButtonLabel}
          </a>
        </div>

        {/* FOOTER TECH */}
        <footer className="mt-8 text-[11px] text-neutral-600 text-center select-none">
          <div>OneBoarding AI · {lang.toUpperCase()} · {copy.intro.dateVersion}</div>
        </footer>

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFor(lang)) }}
        />
      </article>
    </main>
  );
        }
