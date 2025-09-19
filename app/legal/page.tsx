export default function LegalPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold">Confidentialité & RGPD</h1>
        <p className="mt-4 text-white/80">
          Cette démo stocke vos informations localement dans votre navigateur
          (localStorage) afin de personnaliser l’expérience. Aucune donnée
          n’est envoyée à un serveur tant que vous n’activez pas une
          fonctionnalité de synchronisation.
        </p>

        <h2 className="mt-8 text-xl font-medium">Vos droits</h2>
        <ul className="mt-3 list-disc pl-6 text-white/80 space-y-2">
          <li>Accès : consulter les données visibles dans l’application.</li>
          <li>Export : copier les données (boutons copier / export à venir).</li>
          <li>Suppression : réinitialiser l’app et effacer le stockage local.</li>
        </ul>

        <h2 className="mt-8 text-xl font-medium">Effacer les données locales</h2>
        <p className="mt-3 text-white/80">
          Pour supprimer les données de cette application sur cet appareil,
          utilisez le bouton ci-dessous.
        </p>
        <button
          onClick={() => {
            try {
              localStorage.removeItem("oneboarding.profile");
              localStorage.removeItem("oneboarding.plan");
              localStorage.removeItem("oneboarding.onboarded");
              localStorage.removeItem("oneboarding.locale");
              localStorage.removeItem("oneboarding.rgpdConsent");
              alert("Données locales supprimées pour OneBoarding AI.");
            } catch {
              alert("Impossible de supprimer le stockage local sur ce navigateur.");
            }
          }}
          className="mt-4 px-4 py-2 rounded-xl bg-white text-black font-medium"
        >
          Supprimer les données locales
        </button>

        <p className="mt-8 text-sm text-white/50">
          Version démo — aucune donnée personnelle n’est transmise à des tiers.
        </p>
      </div>
    </main>
  );
}
