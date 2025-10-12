// app/delete/page.tsx
export const runtime = "nodejs";

export const metadata = {
  title: "Suppression des données — OneBoarding AI",
  description:
    "Instructions officielles pour la suppression des données utilisateur, conformément à la Politique de confidentialité de OneBoarding AI.",
  alternates: {
    canonical: "https://oneboardingai.com/delete",
    languages: {
      fr: "https://oneboardingai.com/delete?lang=fr",
      en: "https://oneboardingai.com/delete?lang=en",
      ar: "https://oneboardingai.com/delete?lang=ar",
    },
  },
};

export default function DeletePage() {
  return (
    <main className="px-4 py-8 mx-auto w-full max-w-2xl text-black">
      <h1 className="text-xl font-bold mb-4 text-center">
        Suppression des données — OneBoarding AI
      </h1>

      <article className="space-y-4 leading-6 opacity-90">
        <p>
          OneBoarding AI ne collecte ni ne conserve de données personnelles.
          L’historique et les consentements sont stockés localement sur
          l’appareil de l’utilisateur, sous son seul contrôle.
        </p>

        <p>
          Pour supprimer vos données locales, cliquez sur le bouton{" "}
          <strong>« Effacer l’historique »</strong> disponible dans
          l’interface de l’application.
        </p>

        <p>
          Si vous avez partagé des informations dans le cadre d’un échange
          technique ou administratif, vous pouvez également demander leur
          suppression en contactant notre responsable de traitement :
        </p>

        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Nom :</strong> Benmehdi Mohamed Rida
          </li>
          <li>
            <strong>Email :</strong>{" "}
            <a
              href="mailto:benmehdi.mr@gmail.com"
              className="text-blue-700 underline hover:text-blue-900"
            >
              benmehdi.mr@gmail.com
            </a>
          </li>
          <li>
            <strong>Adresse :</strong> Casablanca, Maroc
          </li>
        </ul>

        <p>
          Pour plus d’informations, veuillez consulter notre{" "}
          <a
            href="/legal"
            className="underline text-blue-700 hover:text-blue-900"
          >
            Politique de confidentialité complète
          </a>
          .
        </p>

        <hr className="border-black/10 my-3" />

        <p className="text-sm opacity-70 text-center">
          Dernière mise à jour : Octobre 2025 — Version 1.0.  
          <br />
          © OneBoarding AI. Tous droits réservés.
        </p>
      </article>
    </main>
  );
}
