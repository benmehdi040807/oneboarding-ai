// app/delete/page.tsx
import { deleteCopyFor, type Lang } from "@/lib/delete/copy";

export const runtime = "nodejs";

export const metadata = {
  title: "Suppression des données utilisateur — OneBoarding AI",
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
  if (raw === "en" || raw === "ar") return raw as Lang;
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
  const t = deleteCopyFor(lang);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DataDeletionPolicy",
    name: "User Data Deletion Policy — OneBoarding AI",
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
        email: "Support@oneboardingai.com",
      },
    },
    policyStatus: "Active",
    lastReviewed: "2025-10-01",
    mainEntityOfPage: "https://oneboardingai.com/delete",
  };

  const backLabel =
    lang === "ar" ? "العودة للرئيسية" : lang === "en" ? "Back home" : "Retour accueil";

  return (
    <main
      className={`px-4 py-8 mx-auto w-full max-w-2xl text-black leading-7 ${
        lang === "ar" ? "text-right pr-4" : ""
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* ✅ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sélecteur de langue */}
      <nav className="mb-5 text-sm" aria-label="Language selector">
        <span className="opacity-70 mr-2">
          {lang === "ar" ? "اللغة:" : lang === "en" ? "Language:" : "Langue:"}
        </span>
        <a
          href="?lang=fr"
          className={`px-2 py-1 rounded border mr-1 ${
            lang === "fr" ? "bg-black text-white border-black" : "border-black/20"
          }`}
        >
          FR
        </a>
        <a
          href="?lang=en"
          className={`px-2 py-1 rounded border mr-1 ${
            lang === "en" ? "bg-black text-white border-black" : "border-black/20"
          }`}
        >
          EN
        </a>
        <a
          href="?lang=ar"
          className={`px-2 py-1 rounded border ${
            lang === "ar" ? "bg-black text-white border-black" : "border-black/20"
          }`}
        >
          AR
        </a>
      </nav>

      <h1 className="text-2xl font-bold mb-6 text-center">{t.title}</h1>

      <article className="space-y-4">
        {t.sections.map(
          (
            s: { kind: string; text?: string; html?: string; items?: string[] },
            i: number
          ) => {
            if (s.kind === "hr") return <hr key={i} className="border-black/10 my-3" />;
            if (s.kind === "p")
              return s.html ? (
                <p key={i} className="opacity-90" dangerouslySetInnerHTML={{ __html: s.html }} />
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

        <p className="text-sm opacity-70 text-center">
          {t.footer.updated}
          <br />
          {t.footer.rights}
        </p>

        <p className="mt-6 text-center">
          <a
            href="/"
            className="
              inline-block px-5 py-2 rounded-xl border border-transparent
              bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400
              text-white shadow-sm hover:opacity-90 transition
            "
          >
            {backLabel}
          </a>
        </p>
      </article>
    </main>
  );
}
