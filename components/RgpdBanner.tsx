"use client";

import { useState } from "react";

export default function RgpdBanner() {
  const [show, setShow] = useState(true); // toujours visible au départ

  const accept = () => {
    setShow(false);
    try {
      localStorage.setItem("oneboarding.rgpdConsent", "1");
    } catch {}
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-5xl px-4">
        <div className="m-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-3 text-sm text-white">
          <p className="mb-2">
            Vos données restent privées sur cet appareil.{" "}
            <a href="/legal" className="underline">
              En savoir plus
            </a>
          </p>
          <button
            onClick={accept}
            className="px-3 py-2 rounded-xl bg-white text-black font-medium"
          >
            D’accord
          </button>
        </div>
      </div>
    </div>
  );
}
