// app/trademark/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { COPY, JSON_LD } from "@/lib/trademark/copy";

/** Dégradé réutilisable (identique au style "Menu") */
const GRAD = "from-sky-500 via-indigo-500 to-fuchsia-600";
/** Bouton dégradé (plein) */
const GRAD_BTN =
  `inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium text-white shadow-sm ` +
  `bg-gradient-to-r ${GRAD} hover:opacity-95`;

/** Pastille de langue (plein si active, contour si inactive) */
function LangChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-lg px-3.5 py-1.5 text-sm transition focus:outline-none",
        active
          ? `text-white shadow bg-gradient-to-r ${GRAD}`
          : "text-neutral-800 border border-neutral-300/80 bg-white/70 hover:bg-neutral-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function Page() {
  const [lang, setLang] = useState<"fr" | "en" | "ar">("fr");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Titre */}
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
        🏛️ OneBoarding AI® — Marque déposée (OMPIC #291822)
      </h1>

      {/* Méta / entête aéré */}
      <div className="mt-4 space-y-3 text-[15px] leading-6 text-neutral-700">
        <p><span className="font-medium">Version :</span> Octobre 2025</p>
        <p>
          <span className="font-medium">Mainteneur :</span> Maître Benmehdi Mohamed Rida —{" "}
          <a href="mailto:office.benmehdi@gmail.com" className="underline">
            office.benmehdi@gmail.com
          </a>
        </p>
        <p>
          <span className="font-medium">Domaine :</span>{" "}
          <em>Classes revendiquées — Nice 9 • 35 • 41 • 42 • 45</em>
        </p>
        <p>
          <span className="font-medium">Site :</span>{" "}
          <a href="https://oneboardingai.com" className="underline">
            https://oneboardingai.com
          </a>
        </p>
      </div>

      <hr className="my-6 border-neutral-200/70" />

      {/* Sélecteur de langue */}
      <div className="mb-8 flex flex-wrap gap-2">
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

      {/* Contenu de la langue sélectionnée */}
      <div className="space-y-6">{COPY[lang]}</div>

      {/* Footer : retour */}
      <div className="mt-10">
        <Link href="/" className={GRAD_BTN}>
          ← Retour
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
