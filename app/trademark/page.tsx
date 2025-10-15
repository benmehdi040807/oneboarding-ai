// app/trademark/page.tsx
"use client";

import { useState } from "react";
import { COPY, JSON_LD } from "@/lib/trademark/copy";
import Link from "next/link";

/** Dégradé réutilisable (proche d'un bouton "Menu" moderne) */
const GRAD_BTN =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium text-white shadow-sm " +
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-600 hover:opacity-95";

export default function Page() {
  const [lang, setLang] = useState<"fr" | "en" | "ar">("fr");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">
        🏛️ OneBoarding AI® — Marque déposée (OMPIC #291822)
      </h1>

      <div className="text-sm text-neutral-600 space-y-1 mb-6">
        <p>Version : Octobre 2025</p>
        <p>
          Mainteneur : Maître Benmehdi Mohamed Rida —{" "}
          <a href="mailto:office.benmehdi@gmail.com" className="underline">
            office.benmehdi@gmail.com
          </a>
        </p>
        <p>Domaine : Intelligence artificielle, droit, technologie, innovation.</p>
        <p>
          Site :{" "}
          <a href="https://oneboardingai.com" className="underline">
            https://oneboardingai.com
          </a>
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(["fr", "en", "ar"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setLang(k)}
            className={`rounded-md border px-3 py-1 transition ${
              lang === k
                ? "bg-black text-white"
                : "hover:bg-neutral-100 text-neutral-800"
            }`}
            aria-pressed={lang === k}
          >
            {k === "fr" ? "🇫🇷 Français" : k === "en" ? "🇬🇧 English" : "🇲🇦 العربية"}
          </button>
        ))}
      </div>

      {COPY[lang]}

      <div className="mt-10">
        <Link href="/" className={GRAD_BTN}>
          ← Retour à l’accueil
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
