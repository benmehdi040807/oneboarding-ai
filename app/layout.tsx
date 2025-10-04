export const runtime = "nodejs";

import "./globals.css";

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
      { url: "/brand/og-oneboardingai-1200x628.jpg", width: 1200, height: 628, alt: "OneBoarding AI - Votre IA personnel", type: "image/jpeg" },
      { url: "/brand/og-oneboardingai-1200x628.png",  width: 1200, height: 628, alt: "OneBoarding AI - Votre IA personnel", type: "image/png"   },
      { url: "/brand/og-oneboardingai.png",           width: 1024, height: 1024, alt: "OneBoarding AI - carré",          type: "image/png"   },
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Harmonise la barre d’adresse mobile */}
        <meta name="theme-color" content="#B3E5FC" />
      </head>

      {/* 
        Natif :
        - Texte noir par défaut (les selects/inputs système restent lisibles)
        - Couleurs système (color-scheme: light) pour éviter les styles "dark" auto
        - Pas d’overflow global ni de fond sombre ici
      */}
      <body className="min-h-dvh bg-transparent text-black antialiased [color-scheme:light] selection:bg-black/10">
        {/* Conteneur central neutre (la page se charge de son propre fond si besoin) */}
        <div className="mx-auto w-full max-w-xl px-4 min-h-dvh">
          {children}
        </div>
      </body>
    </html>
  );
}
