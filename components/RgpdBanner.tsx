"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "oneboarding.rgpdConsent";

export default function RgpdBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Ne pas afficher sur la page légale + si déjà accepté
    const onLegal = typeof window !== "undefined" && window.location.pathname.startsWith("/legal");
    if (onLegal) return setShow(false);

    try {
      const accepted = localStorage.getItem(CONSENT_KEY) === "1";
      setShow(!accepted);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Bandeau d'information RGPD"
      // Au-dessus du contenu, sous les modals lourds
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483200,
        pointerEvents: "none", // évite de bloquer les clics hors de la carte
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 16px 20px 16px",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            background: "white",
            color: "black",
            borderRadius: 16,
            padding: 12,
            boxShadow: "0 10px 24px rgba(0,0,0,.18)",
            border: "1px solid rgba(0,0,0,.08)",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            Vos données restent privées sur cet appareil.
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {/* Bouton unique vers /legal */}
            <a
              href="/legal"
              style={{
                display: "inline-block",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.12)",
                textDecoration: "none",
                color: "black",
                fontWeight: 500,
                background: "white",
              }}
            >
              CGU / Privacy
            </a>

            {/* Bouton “J’ai compris” qui enregistre le consentement */}
            <button
              onClick={() => {
                try {
                  localStorage.setItem(CONSENT_KEY, "1");
                } catch {}
                setShow(false);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "none",
                background: "black",
                color: "white",
                fontWeight: 600,
              }}
            >
              J’ai compris
            </button>
          </div>
        </div>
      </div>
    </div>
  );
            }
