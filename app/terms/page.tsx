// app/terms/page.tsx
export const runtime = "nodejs";

export const metadata = {
  title: "Conditions générales — OneBoarding AI",
  description:
    "Manifeste, Conditions d’utilisation, Confidentialité et FAQ universelle — OneBoarding AI.",
};

import React from "react";

export default function TermsPage() {
  return (
    <main className="px-6 py-10 mx-auto w-full max-w-3xl text-black leading-7">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Conditions Générales — OneBoarding AI
      </h1>

      {/* ===== Manifeste ===== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">🌍 Manifeste de Confiance</h2>
        <p>
          OneBoarding AI est une plateforme d’intelligence artificielle interactive conçue pour offrir
          à chaque utilisateur une expérience pédagogique et enrichissante.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>
            🛡️ <strong>Clarté & sécurité :</strong> l’utilisateur reste toujours maître de son usage et
            responsable de ses choix.
          </li>
          <li>
            🌐 <strong>Universalité :</strong> les principes qui gouvernent cette plateforme respectent
            les règles d’ordre public de chaque pays.
          </li>
          <li>
            ⚖️ <strong>Équilibre & responsabilité partagée :</strong> l’éditeur met en œuvre tous les moyens
            raisonnables pour assurer un service fiable, tandis que l’utilisateur conserve l’entière
            responsabilité de son usage.
          </li>
          <li>
            🤝 <strong>Confiance & transparence :</strong> l’interaction entre l’intelligence artificielle et
            l’humain repose sur le respect mutuel, la confidentialité et la bonne foi.
          </li>
        </ul>
        <p className="mt-3 opacity-80">
          👉 Ce manifeste n’est pas un simple détail juridique : il est l’esprit fondateur de nos
          Conditions Générales d’Utilisation et de notre Politique de Confidentialité.
        </p>
      </section>

      {/* ===== CGU ===== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">⚖️ Conditions Générales d’Utilisation (CGU)</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            <strong>Objet :</strong> OneBoarding AI fournit un service d’assistance basé sur l’intelligence
            artificielle permettant de formuler des requêtes et d’obtenir des réponses générées
            automatiquement.
          </li>
          <li>
            <strong>Responsabilité de l’utilisateur :</strong> les contenus générés ne constituent pas
            des conseils professionnels personnalisés. L’utilisateur doit vérifier avant toute décision
            engageante.
          </li>
          <li>
            <strong>Indemnisation :</strong> l’utilisateur indemnise OneBoarding AI en cas d’usage non
            conforme ou violation de droits.
          </li>
          <li>
            <strong>Limitation de responsabilité :</strong> OneBoarding AI ne pourra être tenue responsable
            des dommages indirects, pertes de profit ou de données.
          </li>
          <li>
            <strong>Exceptions :</strong> les droits impératifs des consommateurs demeurent applicables.
          </li>
          <li>
            <strong>Obligations :</strong> ne pas soumettre de contenus illicites, prendre des mesures
            raisonnables de sécurité et signaler toute faille constatée.
          </li>
          <li>
            <strong>Conservation et preuve :</strong> certaines données techniques peuvent être conservées
            à des fins de sécurité et de preuve, conformément à la Politique de Confidentialité.
          </li>
        </ol>
      </section>

      {/* ===== Politique de Confidentialité ===== */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">🔒 Politique de Confidentialité</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Stockage local :</strong> historique et consentements conservés uniquement sur votre
            appareil.
          </li>
          <li>
            <strong>Sous-traitants techniques :</strong> les requêtes IA transitent sans cession de données
            personnelles à des tiers.
          </li>
          <li>
            <strong>Monétisation :</strong> aucune vente de données. La monétisation concerne uniquement
            les abonnements et services.
          </li>
          <li>
            <strong>Statistiques :</strong> mesures agrégées et anonymisées pour améliorer le service.
          </li>
          <li>
            <strong>Effacement :</strong> vous pouvez supprimer vos données locales à tout moment.
          </li>
        </ul>
      </section>

      {/* ===== FAQ ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-3">💬 FAQ universelle</h2>
        <ul className="list-decimal pl-6 space-y-2">
          <li>
            <strong>L’IA donne-t-elle des conseils professionnels ?</strong> Non. Les réponses sont
            informatives. Pour tout besoin juridique, médical, financier ou autre, consultez un
            professionnel qualifié.
          </li>
          <li>
            <strong>Mes données sont-elles vendues ?</strong> Non. Aucune exploitation publicitaire ni
            partage avec des tiers.
          </li>
          <li>
            <strong>Où sont stockés mes historiques ?</strong> Localement sur votre appareil.
          </li>
          <li>
            <strong>Puis-je les supprimer ?</strong> Oui, via « Effacer l’historique ».
          </li>
          <li>
            <strong>L’IA peut-elle se tromper ?</strong> Oui. Vérifiez toujours les informations
            importantes avant d’agir.
          </li>
          <li>
            <strong>Qui édite OneBoarding AI ?</strong> Conception et développement :{" "}
            <strong>Benmehdi Mohamed Rida</strong>. Mission : rendre l’IA accessible, claire et
            respectueuse de la vie privée.
          </li>
        </ul>
      </section>

      {/* ===== Version ===== */}
      <section className="mt-10 border-t border-black/10 pt-4 text-sm opacity-80 text-center">
        <p>
          Version 1.0 — Octobre 2025. <br />
          Un changelog discret indiquera les futures évolutions.
        </p>
      </section>
    </main>
  );
}
