// app/delete/page.tsx
import { COPY, type Lang } from "@/lib/delete/copy";

export const runtime = "nodejs";

export const metadata = {
  title: "Suppression des données — OneBoarding AI",
  description:
    "Instructions officielles pour la suppression des données utilisateur, conformément à la Politique de confidentialité de OneBoarding AI.",
  alternates: {
    canonical: "https://oneboardingai.com/delete",
    languages: {
      fr: "https://oneboardingai.com/delete?lang=fr",
      en: "https://oneboardingai.com/delete?lang=en",
      ar: "https://oneboardingai.com/delete?lang=ar",
    },
  },
};

function pickLang(sp?: URLSearchParams): Lang {
  const raw = sp?.get("lang")?.toLowerCase();
  if (raw === "en" || raw === "ar") return raw;
  return "fr";
}

export default function DeletePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const sp =
    typeof searchParams === "object"
      ? new URLSearchParams(
          Object.entries(searchParams)
            .filter(([_, v]) => typeof v === "string")
            .map(([k, v]) => [k, String(v)])
        )
      : undefined;

  const lang = pickLang(sp);
  const t = COPY[lang];

  // ✅ Balise JSON-LD structurée (DataDeletionPolicy)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DataDeletionPolicy",
    name: "Data Deletion Policy — OneBoarding AI",
    description:
      "Official instructions for user data deletion, in compliance with OneBoarding AI’s Privacy Policy.",
    inLanguage: lang,
    maintainer: {
      "@type": "Organization",
      name: "OneBoarding AI",
      url: "https://oneboardingai.com",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Data protection officer",
        name: "Benmehdi Mohamed Rida",
        email: "office.benmehdi@gmail.com",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Casablanca",
          addressCountry: "MA",
        },
      },
    },
    policyStatus: "Active",
    lastReviewed: "2025-10-01",
    mainEntityOfPage: "https://oneboardingai.com/delete",
  };

  return (
    <main
      className={`px-4 py-8 mx-auto w-full max-w-2xl text-black leading-7 ${
        lang === "ar" ? "text-right" : ""
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* ✅ JSON-LD pour SEO / Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="text-2xl font-bold mb-6 text-center">{t.title}</h1>

      <article className="space-y-4">
        {t.sections.map(
          (
            s: { kind: string; text?: string; html?: string; items?: string[] },
            i: number
          ) => {
            if (s.kind === "p")
              return s.html ? (
                <p
                  key={i}
                  className="opacity-90"
                  dangerouslySetInnerHTML={{ __html: s.html }}
                />
              ) : (
                <p key={i} className="opacity-90">
                  {s.text}
                </p>
              );
            if (s.kind === "ul")
              return (
                <ul key={i} className="list-disc pl-5 space-y-1.5 opacity-90">
                  {s.items?.map((li: string, j: number) => (
                    <li key={j}>{li}</li>
                  ))}
                </ul>
              );
            return null;
          }
        )}

        <hr className="border-black/10 my-3" />

        <p className="text-sm opacity-70 text-center">
          {lang === "fr"
            ? "Dernière mise à jour : Octobre 2025 — Version 1.0."
            : lang === "en"
            ? "Last updated: October 2025 — Version 1.0."
            : "آخر تحديث: أكتوبر 2025 — الإصدار 1.0."}
          <br />
          © OneBoarding AI.{" "}
          {lang === "ar"
            ? "جميع الحقوق محفوظة."
            : lang === "en"
            ? "All rights reserved."
            : "Tous droits réservés."}
        </p>

        <p className="mt-6 text-center">
          <a
            href="/"
            className="inline-block px-4 py-2 rounded-xl border border-black/20 bg-black text-white hover:bg-gray-800 transition"
          >
            {lang === "ar"
              ? "عودة"
              : lang === "en"
              ? "Back"
              : "Retour"}
          </a>
        </p>
      </article>
    </main>
  );
}
