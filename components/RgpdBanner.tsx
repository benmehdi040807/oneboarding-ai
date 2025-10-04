"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "oneboarding.rgpdConsent";

export default function RgpdBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Ne pas afficher le bandeau sur /legal
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/legal")) {
      setShow(false);
      return;
    }
    try {
      const ok = localStorage.getItem(CONSENT_KEY) === "1";
      setShow(!ok);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 2147483200, pointerEvents: "none" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 20px 16px" }}>
        <div
          style={{
            pointerEvents: "auto",
            background: "#fff",
            color: "#000",
            borderRadius: 16,
            padding: 12,
            border: "1px solid rgba(0,0,0,.1)",
            boxShadow: "0 10px 24px rgba(0,0,0,.18)",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            Vos données restent privées sur cet appareil.
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <a
              href="/legal"
              style={{
                flex: 1, textAlign: "center", padding: "10px 14px",
                borderRadius: 12, border: "1px solid rgba(0,0,0,.12)",
                textDecoration: "none", color: "#000", fontWeight: 500,
              }}
            >
              CGU / Privacy
            </a>

            <button
              onClick={() => {
                try { localStorage.setItem(CONSENT_KEY, "1"); } catch {}
                setShow(false);
              }}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 12,
                border: "none", background: "#000", color: "#fff", fontWeight: 600,
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
