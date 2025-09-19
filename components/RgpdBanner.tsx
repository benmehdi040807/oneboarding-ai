"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "oneboarding.rgpdConsent";

export default function RgpdBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const force = url.searchParams.get("rgpd") === "1"; // /?rgpd=1 pour forcer l’affichage
      const v = localStorage.getItem(CONSENT_KEY);
      setShow(force || v !== "1");
    } catch {
      // Si localStorage indisponible (edge case), on affiche
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
    <div className="fixed inset-x-0 bottom-0 z-[9999]">
      <div className="mx-auto w-full max-w-xl px-4 pb-5">
        <div className="m-3 rounded-2xl bg-white text-black p-3 shadow-lg border border-black/10">
          <p className="text-sm">
            Vos données restent privées sur cet appareil.{" "}
            <a href="/legal" className="underline">
              En savoir plus
            </a>
            .
          </p>

          <div className="mt-3 flex gap-2">
            <a
              href="/legal"
              className="px-3 py-2 rounded-xl border border-black/15"
            >
              Détails
            </a>
            <button
              onClick={accept}
              className="px-3 py-2 rounded-xl bg-black text-white"
            >
              D’accord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
