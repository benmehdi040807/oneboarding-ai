"use client";

export const runtime = "nodejs"; // OK ici

const CONSENT_KEY = "oneboarding.rgpdConsent";

export default function LegalPage() {
  const back = () => {
    if (typeof window !== "undefined") window.history.back();
  };
  const accept = () => {
    try { localStorage.setItem(CONSENT_KEY, "1"); } catch {}
    back();
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "16px", color: "#fff" }}>
      {/* Barre d’entête simple */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 5,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 0", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)",
          borderRadius: 12
        }}
      >
        <div style={{ display: "flex", gap: 8, paddingLeft: 8 }}>
          <button onClick={back} style={chipBtn}>FR</button>
          <button onClick={back} style={chipBtn}>EN</button>
          <button onClick={back} style={chipBtn}>AR</button>
        </div>
        <button onClick={back} style={{ ...chipBtn, marginRight: 8 }}>Fermer</button>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "12px 0 10px" }}>Informations légales</h1>

      <section style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
        <h2 style={h2}>Politique de Confidentialité</h2>
        <ul>
          <li>Stockage local : l’historique et les consentements sont conservés sur votre appareil.</li>
          <li>
            Sous-traitants techniques : les requêtes IA transitent par des prestataires techniques agissant comme
            sous-traitants ; vos données personnelles ne sont ni vendues ni partagées à des fins publicitaires.
          </li>
          <li>
            Monétisation : toute monétisation éventuelle concernera l’accès au service (abonnements, crédits, offres)
            et non la cession de vos données personnelles.
          </li>
          <li>
            Statistiques anonymisées : nous pouvons utiliser des mesures agrégées et anonymisées afin d’améliorer le
            service, sans identifier les utilisateurs.
          </li>
          <li>
            Efficacement : vous pouvez supprimer vos données locales à tout moment via le bouton prévu à cet effet.
          </li>
        </ul>

        <h2 style={h2}>Version & Mise à jour</h2>
        <p>Version 1.0 — Septembre 2025</p>
      </section>

      {/* Actions collées en bas de page (natifs) */}
      <div
        style={{
          position: "sticky", bottom: 0, zIndex: 6, marginTop: 24,
          background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", borderRadius: 14, padding: 12
        }}
      >
        <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
          En acceptant, vous reconnaissez avoir pris connaissance de ces informations. Les règles d’ordre public du
          pays de l’utilisateur demeurent applicables de plein droit.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button onClick={back} style={{ ...pillBtn, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>
            Plus tard
          </button>
          <button onClick={accept} style={{ ...pillBtn, background: "#fff", color: "#000" }}>
            J’accepte
          </button>
        </div>
      </div>
    </main>
  );
}

const chipBtn: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  borderRadius: 12,
  padding: "8px 10px",
  fontWeight: 600,
};

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 800, marginTop: 16 };

const pillBtn: React.CSSProperties = {
  flex: 1,
  padding: "12px 14px",
  border: "none",
  borderRadius: 12,
  fontWeight: 800,
};
