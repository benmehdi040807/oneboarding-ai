export const runtime = "nodejs";

export const metadata = {
  title: "Mentions légales & Données — OneBoarding AI",
};

export default function LegalPage() {
  return (
    <main
      style={{
        padding: "1.25rem",
        maxWidth: "700px",
        margin: "0 auto",
        color: "black",
        background: "white",
        borderRadius: "12px",
        lineHeight: 1.6,
        fontSize: "15px",
      }}
    >
      <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "1rem" }}>
        Informations légales et confidentialité
      </h1>

      <p style={{ marginBottom: "1rem" }}>
        Cette application conserve uniquement certaines données locales sur votre appareil :
      </p>

      <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.25rem" }}>
        <li>Votre historique d’interactions ;</li>
        <li>Vos préférences et consentements ;</li>
        <li>Votre profil local si vous l’avez créé.</li>
      </ul>

      <p style={{ marginBottom: "1rem" }}>
        Ces informations ne quittent pas votre appareil : aucune donnée n’est transmise à un
        serveur ni exploitée à des fins publicitaires. Les requêtes IA sont traitées par des
        prestataires techniques de confiance.
      </p>

      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "0.5rem" }}>
          Politique de confidentialité
        </h2>

        <ul style={{ paddingLeft: "1.25rem" }}>
          <li>Stockage local : vos données demeurent exclusivement sur votre appareil.</li>
          <li>
            Sous-traitance technique : aucun partage de données personnelles à des fins
            commerciales.
          </li>
          <li>
            Statistiques anonymisées : uniquement pour améliorer le service, sans identification
            individuelle.
          </li>
          <li>
            Droit à l’effacement : vous pouvez supprimer vos données locales à tout moment via le
            bouton prévu à cet effet.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "0.5rem" }}>
          Version & mise à jour
        </h2>
        <p>Version 1.0 — Septembre 2025</p>
      </section>

      <hr style={{ margin: "2rem 0", border: "none", borderTop: "1px solid #ccc" }} />

      <p style={{ fontSize: "13px", color: "#555" }}>
        En accédant au service, vous reconnaissez avoir pris connaissance de ces informations. Les
        règles d’ordre public du pays de l’utilisateur demeurent applicables de plein droit.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem",
          marginTop: "1.5rem",
        }}
      >
        <button
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "10px",
            border: "1px solid #ccc",
            background: "white",
          }}
          onClick={() => window.history.back()}
        >
          Plus tard
        </button>
        <button
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "10px",
            border: "none",
            background: "black",
            color: "white",
          }}
          onClick={() => {
            localStorage.setItem("oneboarding.rgpdConsent", "1");
            window.history.back();
          }}
        >
          J’accepte
        </button>
      </div>
    </main>
  );
}
