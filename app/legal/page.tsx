// app/legal/page.tsx
"use client";

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
  if (raw === "en" || raw === "ar") return raw;
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
  // lecture naïve des query params (sans client JS côté routeur)
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

  return (
    <main className={`px-4 py-8 mx-auto w-full max-w-2xl text-black ${embed ? "pt-4" : ""}`}>
      {/* Sélecteur de langue seulement hors embed */}
      {!embed && (
        <nav className="mb-5 text-sm" aria-label="Sélecteur de langue">
          <span className="opacity-70 mr-2">Langue:</span>
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
                {"items" in s &&
                  s.items.map((li, j) => (
                    <li key={j}>{li}</li>
                  ))}
              </ul>
            );
          return null;
        })}

        <hr className="border-black/10 my-3" />
        <h3 className="font-semibold">{t.version.h}</h3>
        <p className="font-semibold">{t.version.v}</p>
        <p className="opacity-90">{t.version.note}</p>

        <div className="mt-6 text-sm opacity-70 space-y-3">
          <p>
            En accédant au service, vous reconnaissez avoir pris connaissance de ces
            informations. Les règles d’ordre public applicables dans le pays de l’utilisateur
            demeurent de plein droit.
          </p>
          <p className="text-center font-medium">
            <button
              onClick={() => typeof window !== "undefined" && window.history.back()}
              className="px-4 py-2 rounded-xl border border-black/20 bg-black text-white hover:bg-gray-800 transition"
            >
              Lu et approuvé
            </button>
          </p>
        </div>
      </article>

      {/* utilitaire pour garder un nom arabe sur une seule ligne */}
      <style>{`.nowrap-ar{white-space:nowrap;font-weight:700;}`}</style>
    </main>
  );
}
