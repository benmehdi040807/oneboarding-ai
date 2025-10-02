"use client";

import { useEffect } from "react";
import PhoneField from "./PhoneField";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SubscribeModal({ open, onClose }: Props) {
  // Empêche le scroll de fond quand le modal est ouvert
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
      onClick={onClose} // clic sur l’overlay -> ferme
    >
      <div
        onClick={stop}
        className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-8
                   w-full md:max-w-xl rounded-t-3xl md:rounded-3xl bg-white/90 shadow-xl
                   border border-white/60"
      >
        <div className="flex items-center justify-between p-4">
          <h3 className="text-xl font-semibold">Créer mon espace</h3>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-black/5 hover:bg-black/10 active:bg-black/15"
          >
            Fermer
          </button>
        </div>

        <div className="p-4 pt-0 space-y-3">
          <input
            type="text"
            placeholder="Nom"
            className="w-full h-12 rounded-2xl px-4 bg-white/80 border border-black/10"
          />
          <input
            type="text"
            placeholder="Prénom"
            className="w-full h-12 rounded-2xl px-4 bg-white/80 border border-black/10"
          />

          {/* Téléphone */}
          <PhoneField />

          <p className="text-xs text-black/60">
            Format : <b>+212</b> + numéro national (sans le 0 de tête).
          </p>

          <button
            type="button"
            className="w-full h-12 rounded-2xl bg-[#5b8df7] text-white font-medium
                       shadow hover:opacity-95 active:opacity-90"
          >
            Continuer avec PayPal
          </button>
        </div>
      </div>
    </div>
  );
}
