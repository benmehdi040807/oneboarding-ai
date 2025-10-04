"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "oneboarding.rgpdConsent";

export default function RgpdBanner() {
  const [show, setShow] = useState(false);

  // Afficher si pas encore accepté. Permet aussi ?rgpd=1 pour re-tester.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const force = url.searchParams.get("rgpd") === "1";
      const v = localStorage.getItem(CONSENT_KEY);
      setShow(force || v !== "1");
    } catch {
      setShow(true);
    }
  }, []);

  // Clic sur l’unique bouton : on enregistre le consentement PUIS on ouvre /legal
  const goLegalAndAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {}
    // Ouvre la page légale dans le même onglet (comportement simple)
    window.location.href = "/legal";
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9999] pointer-events-none"
      // remonte légèrement pour éviter la barre système + safe area iOS
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
      }}
    >
      <div className="mx-auto w-full max-w-xl px-4">
        <div
          className="m-3 rounded-2xl bg-white text-black p-3 shadow-lg border border-black/10 pointer-events-auto"
          role="region"
          aria-label="Information confidentialité"
        >
          <p className="text-sm">
            Vos données restent privées sur cet appareil. Consultez nos
            conditions et notre politique de confidentialité.
          </p>

          <div className="mt-3 flex justify-end">
            <button
              onClick={goLegalAndAccept}
              className="px-3 py-2 rounded-xl bg-black text-white"
            >
              CGU / Privacy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
