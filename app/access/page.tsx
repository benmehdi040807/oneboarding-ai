// app/access/page.tsx
export const runtime = "edge";

/**
 * Page informative expliquant la politique d’accès OneBoarding AI :
 * - 3 interactions offertes chaque jour
 * - possibilité d’activer l’espace personnel (accès illimité)
 */
export default function AccessPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12 bg-black text-white">
      <h1 className="text-2xl font-semibold mb-4">
        Politique d’accès — OneBoarding AI
      </h1>
      <p className="text-white/80 max-w-md mb-6 leading-relaxed">
        Vous disposez de <strong>3 interactions gratuites par jour</strong>.
        <br />
        Pour continuer votre expérience OneBoarding AI,
        <br />
        <strong>activez votre espace personnel en 30&nbsp;secondes</strong> (paiement inclus).
      </p>
      <a
        href="/"
        className="bg-white text-black px-5 py-2 rounded-xl font-medium hover:bg-gray-200 transition"
      >
        Retourner à l’accueil
      </a>
    </main>
  );
}
