export const runtime = "nodejs"; // ✅ Force Node.js

import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://oneboardingai.com"), // ✅ URLs relatives -> absolues
  alternates: {
    canonical: "https://oneboardingai.com",
  },
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
      // 1) Priorité: JPG 1200×628 (idéal Facebook/WhatsApp/Twitter)
      {
        url: "/brand/og-oneboardingai-1200x628.jpg",
        width: 1200,
        height: 628,
        alt: "OneBoarding AI - Votre IA personnel",
        type: "image/jpeg",
      },
      // 2) Fallback: PNG 1200×628
      {
        url: "/brand/og-oneboardingai-1200x628.png",
        width: 1200,
        height: 628,
        alt: "OneBoarding AI - Votre IA personnel",
        type: "image/png",
      },
      // 3) Ultime fallback: carré 1024×1024 (WhatsApp aime parfois ce format)
      {
        url: "/brand/og-oneboardingai.png",
        width: 1024,
        height: 1024,
        alt: "OneBoarding AI - Votre IA personnel (carré)",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* Crucial pour le mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Harmonise la barre d'adresse mobile avec le haut du dégradé */}
        <meta name="theme-color" content="#B3E5FC" />
        {/* Optionnel: si tu crées une app Meta plus tard, ajoute ton app_id ici pour supprimer l’avertissement du debugger */}
        {/* <meta property="fb:app_id" content="TON_APP_ID_FACEBOOK" /> */}
      </head>
      {/* IMPORTANT : pas de fond sombre ici */}
      <body className="bg-transparent text-white overflow-x-hidden min-h-dvh antialiased">
        {/* Conteneur central (transparent) */}
        <div className="mx-auto w-full max-w-xl px-4 min-h-dvh bg-transparent">
          {children}
        </div>
      </body>
    </html>
  );
}
