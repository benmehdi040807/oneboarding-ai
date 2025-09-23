export const runtime = "nodejs"; // ✅ Force Node.js

import "./globals.css";

export const metadata = {
  title: "OneBoarding AI",
  description: "3 étapes — simple, pro, équipe",
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
