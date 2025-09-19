"use client";

import { useEffect, useState } from "react";

const KEY = "oneboarding.rgpdConsent";

export default function RgpdBanner() {
  const [show, setShow] = useState(true); // on force l’affichage pour test

  // Si tu veux réactiver la mémoire, dé-commente ce useEffect :
  // useEffect(() => {
  //   try {
  //     setShow(localStorage.getItem(KEY) !== "1");
  //   } catch {}
  // }, []);

  const accept = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };

  if (!show) return null;

  return (
    <div
      className="
        fixed inset-x-0 bottom-0 z-[9999]
        bg-white text-black
        shadow-[0_-6px_24px_rgba(0,0,0,0.35)]
      "
      // padding bas pour encoche iOS/Android
      style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-xl px-4 pt-3">
        <p className="text-sm leading-snug">
          Vos données restent privées sur cet appareil.{" "}
          <a href="/legal" className="underline">
            En savoir plus
          </a>
        </p>

        <div className="mt-3 flex items-center justify-end gap-2">
          <a
            href="/legal"
            className="px-3 py-2 rounded-lg border border-black/20 text-sm"
          >
            Détails
          </a>
          <button
            onClick={accept}
            className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium"
          >
            D’accord
          </button>
        </div>
      </div>
    </div>
  );
}
