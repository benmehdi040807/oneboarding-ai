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
        {/* Indispensable sur mobile pour éviter le zoom/débordement */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-black text-white">
        {/* Conteneur central responsive */}
        <div className="mx-auto w-full max-w-xl px-4">{children}</div>
      </body>
    </html>
  );
}
