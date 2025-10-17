// app/layout.tsx
export const runtime = "nodejs";

import "./globals.css";
import Footer from "@/components/Footer";

export const metadata = {
  metadataBase: new URL("https://oneboardingai.com"),
  alternates: { canonical: "https://oneboardingai.com" },
  title: "OneBoarding AI",
  description:
    "Votre IA personnel, à votre service. 3 interactions offertes — Activez votre futur dès aujourd’hui.",
  openGraph: {
    title: "OneBoarding AI",
    description:
      "Votre IA personnel, à votre service. 3 interactions offertes — Activez votre futur dès aujourd’hui.",
    url: "https://oneboardingai.com",
    siteName: "OneBoarding AI",
    images: [
      {
        url: "/brand/og-oneboardingai-1200x628.jpg",
        width: 1200,
        height: 628,
        alt: "OneBoarding AI - Votre IA personnel",
        type: "image/jpeg",
      },
      {
        url: "/brand/og-oneboardingai-1200x628.png",
        width: 1200,
        height: 628,
        alt: "OneBoarding AI - Votre IA personnel",
        type: "image/png",
      },
      {
        url: "/brand/og-oneboardingai.png",
        width: 1024,
        height: 1024,
        alt: "OneBoarding AI - carré",
        type: "image/png",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneBoarding AI",
    description:
      "Votre IA personnel, à votre service. 3 interactions offertes — Activez votre futur dès aujourd’hui.",
    images: [
      "/brand/og-oneboardingai-1200x628.jpg",
      "/brand/og-oneboardingai-1200x628.png",
    ],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Harmonise la barre d’adresse mobile */}
        <meta name="theme-color" content="#B3E5FC" />

        {/* JSON-LD schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "OneBoarding AI",
              url: "https://oneboardingai.com",
              founder: "Benmehdi Mohamed Rida",
            }),
          }}
        />
      </head>

      <body className="min-h-dvh bg-transparent text-black antialiased [color-scheme:light] selection:bg-black/10">
        {/* Layout en colonne pour un footer fixe et sans overlap */}
        <div className="min-h-dvh flex flex-col">
          <main className="flex-1">
            <div className="mx-auto w-full max-w-xl px-4 pb-6">
              {children}
            </div>
          </main>
          {/* Footer final – version 18px confirmée */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
