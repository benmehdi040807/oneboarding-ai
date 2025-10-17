// app/terms/page.tsx
export const runtime = "nodejs";

export const metadata = {
  title: "Conditions générales — OneBoarding AI",
  description:
    "Conditions d’utilisation, politique de confidentialité, manifeste de confiance et vision universelle — OneBoarding AI.",
  alternates: {
    canonical: "https://oneboardingai.com/terms",
    languages: {
      fr: "https://oneboardingai.com/terms?lang=fr",
      en: "https://oneboardingai.com/terms?lang=en",
      ar: "https://oneboardingai.com/terms?lang=ar",
    },
  },
};

import { COPY, type Lang, type Section } from "@/lib/terms/copy";

function pickLang(sp?: URLSearchParams): Lang {
  const raw = sp?.get("lang")?.toLowerCase();
  if (raw === "en" || raw === "ar") return raw as Lang;
  return "fr";
}
function isEmbed(sp?: URLSearchParams): boolean {
  return sp?.get("embed") === "1";
}

export default function TermsPage({
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
  const embed = isEmbed(sp);
  const t = COPY[lang];

  // Libellé harmonisé en 2 mots pour uniformité avec /legal
  const backLabel =
    lang === "ar" ? "العودة للرئيسية" : lang === "en" ? "Back home" : "Retour accueil";

  return (
    <main
      className={`px-4 py-8 mx-auto w-full max-w-3xl text-black leading-7 ${
        embed ? "pt-4" : ""
      } ${lang === "ar" ? "pr-4" : ""}`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Sélecteur de langue seulement hors embed */}
      {!embed && (
        <nav className="mb-5 text-sm" aria-label="Sélecteur de langue">
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
      )}

      <h1 className="text-2xl font-bold mb-6 text-center">{t.title}</h1>

      <article className="space-y-4">
        {t.sections.map((s: Section, i: number) => {
          if (s.kind === "hr") return <hr key={i} className="border-black/10 my-3" />;
          if (s.kind === "h2")
            return (
              <h2 key={i} className="text-xl font-semibold mt-4">
                {s.text}
              </h2>
            );
          if (s.kind === "p")
            return s.html ? (
              <p key={i} className="opacity-90" dangerouslySetInnerHTML={{ __html: s.text }} />
            ) : (
              <p key={i} className="opacity-90">
                {s.text}
              </p>
            );
          if (s.kind === "ul")
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5 opacity-90">
                {s.items.map((li, j) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            );
          if (s.kind === "ol")
            return (
              <ol key={i} className="list-decimal pl-5 space-y-1.5 opacity-90">
                {s.items.map((li, j) => (
                  <li key={j}>{li}</li>
                ))}
              </ol>
            );
          return null;
        })}

        <hr className="border-black/10 my-3" />

        {/* Bloc version : texte plus petit et SANS espaces entre les lignes */}
        <div className="text-sm leading-6">
          <h3 className="font-semibold m-0">{t.version.h}</h3>
          <p className="font-semibold m-0">{t.version.v}</p>
          <p className="opacity-90 m-0">{t.version.note}</p>
        </div>

        {/* Espace distinct au-dessus du bouton (même rythme que /legal) */}
        {!embed && <div className="mt-6" />}

        {/* Bouton – exactement les mêmes classes que /legal */}
        {!embed && (
          <p className="mt-3 text-center">
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
        )}
      </article>
    </main>
  );
}
