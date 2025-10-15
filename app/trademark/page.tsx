// app/trademark/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import TrademarkClient from "./TrademarkClient";
import { TRADEMARK_META, JSON_LD } from "@/lib/trademark/copy";

export const metadata: Metadata = {
  title: TRADEMARK_META.title,
  description: TRADEMARK_META.description,
  alternates: { canonical: TRADEMARK_META.canonical },
  openGraph: {
    title: TRADEMARK_META.title,
    description: TRADEMARK_META.ogDescription,
    url: TRADEMARK_META.canonical,
    siteName: "OneBoarding AI",
    images: [{ url: TRADEMARK_META.ogImage, width: 1200, height: 630, alt: "OneBoarding AI®" }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TRADEMARK_META.title,
    description: TRADEMARK_META.ogDescription,
    images: [TRADEMARK_META.ogImage],
  },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">
        🏛️ OneBoarding AI® — Marque déposée (OMPIC #291822)
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Version : Octobre 2025 • Mainteneur : Maître Benmehdi Mohamed Rida —
        <a href="mailto:office.benmehdi@gmail.com" className="underline ml-1">office.benmehdi@gmail.com</a>
        <br />
        Domaine : Intelligence artificielle, droit, technologie, innovation. •{" "}
        <a href="https://oneboardingai.com" className="underline">oneboardingai.com</a>
      </p>

      {/* Contenu + sélecteur de langue (Client) */}
      <TrademarkClient />

      {/* JSON-LD inline côté server */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <div className="mt-10">
        <Link href="/" className="inline-block rounded-md border px-4 py-2 hover:bg-neutral-50">
          ← Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
