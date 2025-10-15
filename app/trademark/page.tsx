// app/trademark/page.tsx
"use client";

import { useState } from "react";
import { COPY, JSON_LD } from "@/lib/trademark/copy";
import Link from "next/link";

export default function Page() {
  const [lang, setLang] = useState<"fr" | "en" | "ar">("fr");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold mb-3">
        🏛️ OneBoarding AI® — Marque déposée (OMPIC #291822)
      </h1>

      <p className="text-sm text-neutral-500 mb-6">
        Version : Octobre 2025 • Mainteneur : Maître Benmehdi Mohamed Rida —{" "}
        <a href="mailto:office.benmehdi@gmail.com" className="underline">
          office.benmehdi@gmail.com
        </a>
      </p>

      <div className="mb-6 flex gap-2">
        {(["fr", "en", "ar"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setLang(k)}
            className={`rounded-md border px-3 py-1 ${
              lang === k ? "bg-black text-white" : "hover:bg-neutral-100"
            }`}
          >
            {k === "fr" ? "🇫🇷 Français" : k === "en" ? "🇬🇧 English" : "🇲🇦 العربية"}
          </button>
        ))}
      </div>

      {COPY[lang]}

      <div className="mt-10">
        <Link
          href="/"
          className="inline-block rounded-md border px-4 py-2 hover:bg-neutral-50"
        >
          ← Retour à l’accueil
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
    </main>
  );
}
