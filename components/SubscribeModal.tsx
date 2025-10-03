// components/SubscribeModal.tsx
"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import PhoneField from "./PhoneField";

type Props = { open: boolean; onClose: () => void };

export default function SubscribeModal({ open, onClose }: Props) {
  // Fermer avec ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-xl"
      onClick={onClose} // clic extérieur -> fermeture
    >
      {/* Bottom-sheet ULTRA transparent */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-[env(safe-area-inset-bottom)] left-0 right-0
                   md:left-1/2 md:-translate-x-1/2 md:bottom-10
                   w-full md:max-w-xl rounded-t-3xl md:rounded-3xl
                   bg-white/40 backdrop-blur-2xl shadow-2xl border border-white/50"
      >
        <div className="flex items-center justify-between p-4">
          <h3 className="text-xl font-semibold">Créer mon espace</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-black/5 hover:bg-black/10 active:bg-black/15"
          >
            Fermer
          </button>
        </div>

        <div className="p-4 pt-0 space-y-3">
          {/* Ligne 1 : Nom */}
          <input
            type="text"
            placeholder="Nom"
            className="w-full h-12 rounded-2xl px-4 bg-white/75 border border-black/10"
          />
          {/* Ligne 2 : Prénom */}
          <input
            type="text"
            placeholder="Prénom"
            className="w-full h-12 rounded-2xl px-4 bg-white/75 border border-black/10"
          />

          {/* Lignes 3 & 4 : Pays (Club 33) puis Indicatif + Numéro */}
          <PhoneField />

          <p className="text-xs text-black/70">
            Format : <b>+212</b> + numéro national (sans le 0 de tête).
          </p>

          <button
            type="button"
            className="w-full h-12 rounded-2xl bg-[#5b8df7] text-white font-medium shadow
                       hover:opacity-95 active:opacity-90"
          >
            Continuer avec PayPal
          </button>

          {/* marge anti-recouvrement par le bandeau “Privacy” */}
          <div className="h-8 md:h-0" />
        </div>
      </div>
    </div>
  );

  // Portal pour garantir la bonne superposition et la capture des clics
  return createPortal(modal, document.body);
}
