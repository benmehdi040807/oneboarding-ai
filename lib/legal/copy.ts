// app/legal/page.tsx
export const runtime = "nodejs";

export const metadata = {
  title: "Informations légales — OneBoarding AI",
  description:
    "Manifeste de confiance, Conditions d’utilisation, Politique de confidentialité, et informations éditeur — OneBoarding AI.",
  alternates: {
    canonical: "https://oneboardingai.com/legal",
    languages: {
      fr: "https://oneboardingai.com/legal?lang=fr",
      en: "https://oneboardingai.com/legal?lang=en",
      ar: "https://oneboardingai.com/legal?lang=ar",
    },
  },
};

import { COPY, type Lang, type Section } from "@/lib/legal/copy";

function pickLang(sp?: URLSearchParams): Lang {
  const raw = sp?.get("lang")?.toLowerCase();
  if (raw === "en" || raw === "ar") return raw as Lang;
  return "fr";
}
function isEmbed(sp?: URLSearchParams): boolean {
  return sp?.get("embed") === "1";
}

export default function LegalPage({
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

  // Libellé harmonisé (2 mots) comme /terms et /trademark
  const backLabel =
    lang === "ar" ? "العودة للرئيسية" : lang === "en" ? "Back home" : "Retour accueil";

  // Liens complémentaires — conservent la langue courante
  const qs = lang === "fr" ? "" : `?lang=${lang}`;
  const links = {
    termsHref: `/terms${qs}`,
    deleteHref: `/delete${qs}`,
    protocolHref: `/protocol${qs}`,
    trademarkHref: `/trademark${qs}`,
  };
  const moreLabel =
    lang === "ar"
      ? "للمزيد من المعلومات، يُرجى زيارة:"
      : lang === "en"
      ? "For additional information, please consult:"
      : "Pour toute information complémentaire, vous pouvez consulter :";

  return (
    <main
      className={`px-4 py-8 mx-auto w-full max-w-3xl text-black leading-7 ${
        embed ? "pt-4" : ""
      } ${lang === "ar" ? "pr-4" : ""}`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Sélecteur de langue — absent en mode embed */}
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
            return (s as any).html ? (
              <p key={i} className="opacity-90" dangerouslySetInnerHTML={{ __html: (s as any).text }} />
            ) : (
              <p key={i} className="opacity-90">
                {s.text}
              </p>
            );
          if (s.kind === "ul")
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5 opacity-90">
                {(s as any).items.map((li: string, j: number) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            );
          return null;
        })}

        {/* Bloc “informations complémentaires” */}
        <div className="mt-2">
          <p className="opacity-90">
            {moreLabel}
            <br />
            <a href={links.termsHref} className="underline text-blue-700 hover:text-blue-900">
              oneboardingai.com/terms
            </a>
            <br />
            <a href={links.deleteHref} className="underline text-blue-700 hover:text-blue-900">
              oneboardingai.com/delete
            </a>
            <br />
            <a href={links.protocolHref} className="underline text-blue-700 hover:text-blue-900">
              oneboardingai.com/protocol
            </a>
            <br />
            <a href={links.trademarkHref} className="underline text-blue-700 hover:text-blue-900">
              oneboardingai.com/trademark
            </a>
          </p>
        </div>

        <hr className="border-black/10 my-3" />

        {/* Bloc version : petit, compact */}
        <div className="text-sm leading-6">
          <h3 className="font-semibold m-0">{t.version.h}</h3>
          <p className="font-semibold m-0">{t.version.v}</p>
          <p className="opacity-90 m-0">{t.version.note}</p>
        </div>

        {/* Espace & bouton retour (hors embed) */}
        {!embed && <div className="mt-6" />}
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
