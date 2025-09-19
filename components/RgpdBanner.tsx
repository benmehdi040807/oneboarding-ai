"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "oneboarding.rgpdConsent";

export default function RgpdBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // Mode "force" : ?rgpd=1 dans l’URL pour ré-afficher le bandeau
      const sp = new URLSearchParams(window.location.search);
      const force = sp.get("rgpd") === "1";
      if (force) localStorage.removeItem(CONSENT_KEY);

      const v = localStorage.getItem(CONSENT_KEY);
      setShow(force || v !== "1");
    } catch {
      setShow(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-xl px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="m-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-3 sm:p-4">
          <p className="text-sm text-white/90 leading-relaxed">
            Vos données restent privées sur cet appareil. Vous pouvez{" "}
            <a href="/legal" className="underline">
              exporter ou supprimer
            </a>{" "}
            vos informations à tout moment.
          </p>

          <div className="mt-3 flex gap-2">
            <a
              href="/legal"
              className="px-3 py-2 rounded-xl border border-white/20 text-white/90 text-sm"
            >
              En savoir plus
            </a>
            <button
              onClick={accept}
              className="px-3 py-2 rounded-xl bg-white text-black text-sm font-medium"
            >
              D’accord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
