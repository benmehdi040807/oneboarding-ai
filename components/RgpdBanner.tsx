"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "oneboarding.rgpdConsent";

export default function RgpdBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const force = url.searchParams.get("rgpd") === "1";   // /?rgpd=1 pour forcer
      const via = url.searchParams.get("consent") === "1";  // /legal peut renvoyer ?consent=1
      if (via) localStorage.setItem(CONSENT_KEY, "1");

      const v = localStorage.getItem(CONSENT_KEY);
      setShow(force || v !== "1");
    } catch {
      setShow(true);
    }

    const onAccepted = () => {
      try { localStorage.setItem(CONSENT_KEY, "1"); } catch {}
      setShow(false);
    };
    window.addEventListener("oneboarding:legalAccepted", onAccepted as EventListener);
    return () => window.removeEventListener("oneboarding:legalAccepted", onAccepted as EventListener);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto w-full max-w-xl px-4 pb-5">
        <div className="m-3 rounded-2xl bg-white text-black p-3 shadow-lg border border-black/10">
          <p className="text-sm">Vos données restent privées sur cet appareil.</p>
          <div className="mt-3">
            <a href="/legal" className="inline-block px-3 py-2 rounded-xl bg-black text-white">
              CGU / Privacy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
