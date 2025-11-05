// app/legal/page.tsx
export const runtime = "nodejs";

export const metadata = {
  title: "Informations légales — OneBoarding AI",
  description:
    "Manifeste / Conditions d’utilisation / Confidentialité — OneBoarding AI.",
};

import { COPY, type Lang } from "@/lib/legal/copy";

/* ===== Helpers ===== */
function pickLang(sp?: URLSearchParams): Lang {
  const raw = sp?.get("lang")?.toLowerCase();
  if (raw === "en" || raw === "ar") return raw as Lang;
  return "fr";
}
function isEmbed(sp?: URLSearchParams): boolean {
  return sp?.get("embed") === "1";
}

/* ===== Meta description dynamique (client) ===== */
function descFor(lang: Lang) {
  if (lang === "ar")
    return "OneBoarding AI — المعلومات القانونية: البيان، شروط الاستخدام، والخصوصية.";
  if (lang === "en")
    return "OneBoarding AI — Legal information: manifesto, terms of use, and privacy.";
  return "OneBoarding AI — Informations légales : manifeste, conditions d’utilisation et confidentialité.";
}

export default function LegalPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // lecture naïve des query params (sans client JS)
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

  const approveLabel =
    lang === "ar" ? "تمّ الاطلاع والموافقة" : lang === "en" ? "Read & approved" : "Lu et approuvé";

  const consentText =
    lang === "ar"
      ? "بدخولك إلى الخدمة، فإنك تُقِرّ بأنك اطلعت على هذه المعلومات. تبقى قواعد النظام العام المعمول بها في بلد المستخدم سارية المفعول بالكامل."
      : lang === "en"
      ? "By accessing the service, you acknowledge having taken note of this information. Public-order rules applicable in the user’s country remain fully enforceable."
      : "En accédant au service, vous reconnaissez avoir pris connaissance de ces informations. Les règles d’ordre public applicables dans le pays de l’utilisateur demeurent de plein droit.";

  const langLabel = lang === "ar" ? "اللغة:" : lang === "en" ? "Language:" : "Langue:";

  const linksTitle =
    lang === "ar"
      ? "للمزيد من المعلومات، يُرجى زيارة:"
      : lang === "en"
      ? "For additional information, please consult:"
      : "Pour toute information complémentaire, vous pouvez consulter:";

  // Liens localisés (comme /terms)
  const qs = lang === "fr" ? "" : `?lang=${lang}`;
  const links = {
    deleteHref: `/delete${qs}`,
    termsHref: `/terms${qs}`,
    protocolHref: `/protocol${qs}`,
    trademarkHref: `/trademark${qs}`,
  };

  return (
    <main className={`px-4 py-8 mx-auto w-full max-w-2xl text-black ${embed ? "pt-4" : ""}`}>
      {/* Meta description dynamique, injectée côté client sans transformer la page en client component */}
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  try {
    var desc = ${JSON.stringify(descFor(lang))};
    var m = document.querySelector('meta[name="description"]');
    if (m) { m.setAttribute('content', desc); }
    else {
      m = document.createElement('meta');
      m.name = 'description';
      m.content = desc;
      document.head.appendChild(m);
    }
  } catch(e) {}
})();`,
        }}
      />

      {!embed && (
        <nav className="mb-5 text-sm" aria-label="Sélecteur de langue">
          <span className="opacity-70 mr-2">{langLabel}</span>
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

      <h1 className="text-xl font-bold mb-4">{t.title}</h1>

      <article dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-4 leading-6">
        {t.sections.map((s, i) => {
          if (s.kind === "hr") return <hr key={i} className="border-black/10 my-2" />;
          if (s.kind === "h2")
            return (
              <h2 key={i} className="text-lg font-semibold mt-4">
                {s.text}
              </h2>
            );
          if (s.kind === "p")
            return (s as any).html ? (
              <p
                key={i}
                className="opacity-90"
                dangerouslySetInnerHTML={{ __html: (s as any).html }}
              />
            ) : (
              <p key={i} className="opacity-90">
                {s.text}
              </p>
            );
          if (s.kind === "ul")
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5 opacity-90">
                {"items" in s &&
                  (s as any).items.map((li: string, j: number) => <li key={j}>{li}</li>)}
              </ul>
            );
          return null;
        })}

        {/* ===== Section liens complémentaires (avant la section Version) ===== */}
        <hr className="border-black/10 my-3" />
        <div className="opacity-90">
          <p className="mb-2">{linksTitle}</p>
          <ul className="list-none pl-0 space-y-1">
            <li>
              <a href={links.deleteHref} className="underline text-blue-700 hover:text-blue-900">
                oneboardingai.com/delete
              </a>
            </li>
            <li>
              <a href={links.termsHref} className="underline text-blue-700 hover:text-blue-900">
                oneboardingai.com/terms
              </a>
            </li>
            <li>
              <a href={links.protocolHref} className="underline text-blue-700 hover:text-blue-900">
                oneboardingai.com/protocol
              </a>
            </li>
            <li>
              <a href={links.trademarkHref} className="underline text-blue-700 hover:text-blue-900">
                oneboardingai.com/trademark
              </a>
            </li>
          </ul>
        </div>

        {/* ===== Section Version (harmonisée : petite taille + espacement serré) ===== */}
        <hr className="border-black/10 my-3" />
        <div className="text-sm leading-tight space-y-0.5">
          <h3 className="font-semibold">{t.version.h}</h3>
          <p className="font-semibold">{t.version.v}</p>
          <p className="opacity-90">{t.version.note}</p>
        </div>

        {!embed && (
          <>
            {/* Texte de consentement (petit & atténué) */}
            <p className="mt-6 text-sm opacity-70">{consentText}</p>

            {/* Bouton – même classes que /terms & /trademark */}
            <p className="mt-3 text-center">
              <a
                href="/"
                className="
                  inline-block px-5 py-2 rounded-xl border border-transparent
                  bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400
                  text-white shadow-sm hover:opacity-90 transition
                "
              >
                {approveLabel}
              </a>
            </p>
          </>
        )}
      </article>

      <style>{`.nowrap-ar{white-space:nowrap;font-weight:700;}`}</style>
    </main>
  );
        }
