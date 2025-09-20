export const runtime = 'nodejs';  // ✅ Force Node.js, enlève le warning Edge

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
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="bg-black text-white overflow-x-hidden">
        {/* Conteneur central : largeur max smartphone */}
        <div className="mx-auto w-full max-w-xl px-4">
          {children}
        </div>
      </body>
    </html>
  );
}
