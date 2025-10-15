// app/trademark/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { COPY, JSON_LD } from "@/lib/trademark/copy";

/** Dégradé identique au bouton "Menu" */
const GRAD = "from-sky-500 via-indigo-500 to-fuchsia-600";
const GRAD_BTN =
  `inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium text-white shadow-sm ` +
  `bg-gradient-to-r ${GRAD} hover:opacity-95`;

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

/** Meta de pied de page, traduite par langue */
function MetaFooter({ lang }: { lang: "fr" | "en" | "ar" }) {
  const blocks = {
    fr: [
      ["Version", "Octobre 2025"],
      [
        "Mainteneur",
        <>
          Maître Benmehdi Mohamed Rida —{" "}
          <a className="underline" href="mailto:office.benmehdi@gmail.com">
            office.benmehdi@gmail.com
          </a>
        </>,
      ],
      ["Domaine", <em key="d">Classes revendiquées — Nice 9 • 35 • 41 • 42 • 45</em>],
      [
        "Site",
        <a className="underline" href="https://oneboardingai.com" key="s">
          https://oneboardingai.com
        </a>,
      ],
    ],
    en: [
      ["Version", "October 2025"],
      [
        "Maintainer",
        <>
          Maître Benmehdi Mohamed Rida —{" "}
          <a className="underline" href="mailto:office.benmehdi@gmail.com">
            office.benmehdi@gmail.com
          </a>
        </>,
      ],
      ["Scope", <em key="d">Nice Classes — 9 • 35 • 41 • 42 • 45</em>],
      [
        "Website",
        <a className="underline" href="https://oneboardingai.com" key="s">
          https://oneboardingai.com
        </a>,
      ],
    ],
    ar: [
      ["الإصدار", "أكتوبر 2025"],
      [
        "المشرف",
        <>
          الأستاذ بنمهدي محمد رضى —{" "}
          <a className="underline" href="mailto:office.benmehdi@gmail.com">
            office.benmehdi@gmail.com
          </a>
        </>,
      ],
      ["النطاق", <em key="d">تصنيف نيس — 9 • 35 • 41 • 42 • 45</em>],
      [
        "الموقع",
        <a className="underline" href="https://oneboardingai.com" key="s">
          https://oneboardingai.com
        </a>,
      ],
    ],
  } as const;

  return (
    <div className="text-[15px] leading-6 text-neutral-700 space-y-3">
      {blocks[lang].map(([k, v], i) => (
        <p key={i}>
          <span className="font-medium">{k}:</span> {v as React.ReactNode}
        </p>
      ))}
    </div>
  );
}

export default function Page() {
  const [lang, setLang] = useState<"fr" | "en" | "ar">("fr");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Titre principal */}
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
        🏛️ OneBoarding AI® — Marque déposée (OMPIC #291822)
      </h1>

      {/* Gros espace avant le sélecteur */}
      <div className="h-4" />

      {/* Sélecteur de langue avec air */}
      <div className="mb-10 flex flex-wrap gap-3">
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

      {/* Contenu */}
      <div className="space-y-8">{COPY[lang]}</div>

      {/* Séparateur + Meta en pied (traduit) */}
      <hr className="my-10 border-neutral-200/70" />
      <MetaFooter lang={lang} />

      {/* Footer actions */}
      <div className="mt-8">
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
