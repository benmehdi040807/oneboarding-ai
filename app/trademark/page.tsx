// app/trademark/page.tsx
"use client";

import { useState } from "react";
import { COPY, JSON_LD } from "@/lib/trademark/copy";
import Link from "next/link";

/** Dégradé réutilisable (cohérent avec le bouton "Menu") */
const GRAD_BTN =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium text-white shadow-sm " +
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-600 hover:opacity-95";

/** Style des boutons langue (actif/inactif) */
const LANG_BTN_BASE =
  "rounded-md border px-3 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1";
const LANG_BTN_ACTIVE =
  "border-transparent text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-600";
const LANG_BTN_INACTIVE =
  "border-neutral-300 text-neutral-800 hover:bg-neutral-50";

export default function Page() {
  const [lang, setLang] = useState<"fr" | "en" | "ar">("fr");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold leading-tight mb-3">
        🏛️ OneBoarding AI® — Marque déposée (OMPIC #291822)
      </h1>

      <div className="text-[0.95rem] text-neutral-700 space-y-1.5 mb-7">
        <p>Version : Octobre 2025</p>
        <p>
          Mainteneur : Maître Benmehdi Mohamed Rida —{" "}
          <a href="mailto:office.benmehdi@gmail.com" className="underline">
            office.benmehdi@gmail.com
          </a>
        </p>
        <p>
          Domaine : <span className="italic">Classes revendiquées — Nice</span>{" "}
          9 • 35 • 41 • 42 • 45
        </p>
        <p>
          Site :{" "}
          <a href="https://oneboardingai.com" className="underline">
            https://oneboardingai.com
          </a>
        </p>
      </div>

      {/* Sélecteur de langue */}
      <nav aria-label="Sélecteur de langue" className="mb-6 flex flex-wrap gap-2">
        {(["fr", "en", "ar"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setLang(k)}
            className={[
              LANG_BTN_BASE,
              lang === k ? LANG_BTN_ACTIVE : LANG_BTN_INACTIVE,
            ].join(" ")}
            aria-pressed={lang === k}
          >
            {k === "fr" ? "🇫🇷 Français" : k === "en" ? "🇬🇧 English" : "🇲🇦 العربية"}
          </button>
        ))}
      </nav>

      {/* Contenu legal trilingue */}
      <section className="mb-10">{COPY[lang]}</section>

      {/* Bouton retour (même dégradé que “Menu”) */}
      <div className="mt-2">
        <Link href="/" className={GRAD_BTN} prefetch>
          ← Retour
        </Link>
      </div>

      {/* JSON-LD SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
    </main>
  );
}
