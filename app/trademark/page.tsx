// app/trademark/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { COPY, JSON_LD } from "@/lib/trademark/copy";

/** Dégradé “chip” (sélecteur de langue) — inchangé */
const GRAD_CHIP = "from-sky-500 via-indigo-500 to-fuchsia-600";

/** Pastille de langue */
function LangChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-current={active ? "true" : undefined}
      className={[
        "rounded-lg px-3.5 py-1.5 text-sm transition focus:outline-none",
        active
          ? `text-white shadow bg-gradient-to-r ${GRAD_CHIP}`
          : "text-neutral-800 border border-neutral-300/80 bg-white/70 hover:bg-neutral-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/** Titres localisés */
const TITLES: Record<"fr" | "en" | "ar", string> = {
  fr: "🏛️ OneBoarding AI® — Marque déposée (OMPIC-291822)",
  en: "🏛️ OneBoarding AI® — Registered trademark (OMPIC-291822)",
  ar: "🏛️ ®OneBoarding AI — علامة مسجلة (OMPIC-291822)",
};

export default function Page() {
  const [lang, setLang] = useState<"fr" | "en" | "ar">("fr");

  // Libellé du bouton Retour — harmonisé (2 mots) comme /legal et /terms
  const backLabel =
    lang === "ar" ? "العودة للرئيسية" : lang === "en" ? "Back home" : "Retour accueil";

  // Libellé du bloc “infos complémentaires”
  const moreInfoLabel =
    lang === "ar"
      ? "للمزيد من المعلومات، يُرجى زيارة:"
      : lang === "en"
      ? "For additional information, please consult:"
      : "Pour toute information complémentaire, vous pouvez consulter :";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Titre traduit */}
      <h1
        className="text-2xl md:text-3xl font-semibold tracking-tight"
        dir={lang === "ar" ? "rtl" : undefined}
      >
        {TITLES[lang]}
      </h1>

      {/* Espace */}
      <div className="h-4" />

      {/* Sélecteur de langue */}
      <div className="mb-8 flex flex-wrap gap-3">
        <LangChip active={lang === "fr"} onClick={() => setLang("fr")}>
          🇫🇷 Français
        </LangChip>
        <LangChip active={lang === "en"} onClick={() => setLang("en")}>
          🇬🇧 English
        </LangChip>
        <LangChip active={lang === "ar"} onClick={() => setLang("ar")}>
          🇲🇦 العربية
        </LangChip>
      </div>

      {/* Contenu principal avec langue & direction */}
      <div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-8">
        {COPY[lang]}

        {/* Bloc “informations complémentaires” */}
        <div className="mt-6 border-t border-black/10 pt-4">
          <p className="opacity-90">{moreInfoLabel}</p>
          <div className="mt-2 space-y-1.5">
            <p>
              <Link
                href={`/legal?lang=${lang}`}
                className="underline text-blue-700 hover:text-blue-900 break-all"
              >
                oneboardingai.com/legal
              </Link>
            </p>
            <p>
              <Link
                href={`/terms?lang=${lang}`}
                className="underline text-blue-700 hover:text-blue-900 break-all"
              >
                oneboardingai.com/terms
              </Link>
            </p>
            <p>
              <Link
                href={`/delete?lang=${lang}`}
                className="underline text-blue-700 hover:text-blue-900 break-all"
              >
                oneboardingai.com/delete
              </Link>
            </p>
            <p>
              <Link
                href={`/protocol?lang=${lang}`}
                className="underline text-blue-700 hover:text-blue-900 break-all"
              >
                oneboardingai.com/protocol
              </Link>
            </p>
            <p>
              <Link
                href={`/trademark?lang=${lang}`}
                className="underline text-blue-700 hover:text-blue-900 break-all"
              >
                oneboardingai.com/trademark
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Bouton Retour — identique à /legal et /terms */}
      <div className="mt-10 text-center">
        <Link
          href="/"
          className="
            inline-block px-5 py-2 rounded-xl border border-transparent
            bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400
            text-white shadow-sm hover:opacity-90 transition
          "
        >
          {backLabel}
        </Link>
      </div>

      {/* JSON-LD SEO */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
    </main>
  );
}
