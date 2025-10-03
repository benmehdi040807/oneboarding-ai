"use client";

import { useEffect } from "react";
import PhoneField from "./PhoneField";

type Props = { open: boolean; onClose: () => void };

export default function SubscribeModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center
                 bg-black/10 backdrop-blur-md"
    >
      <div
        className="w-full sm:max-w-lg rounded-3xl border border-white/40
                   bg-gradient-to-b from-white/20 to-sky-100/20
                   backdrop-blur-xl shadow-xl p-4 sm:p-6 m-0 sm:m-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black/90">Créer mon espace</h2>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-2xl bg-white/70 hover:bg-white/90 text-black/80
                       flex items-center justify-center text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          {/* Nom */}
          <input
            type="text"
            placeholder="Nom"
            autoComplete="family-name"
            className="w-full rounded-2xl border border-black/10 bg-white/60 backdrop-blur
                       px-4 py-3 text-black placeholder-white outline-none"
          />
          {/* Prénom */}
          <input
            type="text"
            placeholder="Prénom"
            autoComplete="given-name"
            className="w-full rounded-2xl border border-black/10 bg-white/60 backdrop-blur
                       px-4 py-3 text-black placeholder-white outline-none"
          />

          {/* Pays + Indicatif + Numéro */}
          <PhoneField value="" onChange={() => {}} inputPlaceholderClass="placeholder-white" />

          <p className="text-sm text-black/70">
            Format : <span className="font-semibold">+212</span> + numéro national (sans le 0 de tête).
          </p>

          <button
            className="w-full rounded-2xl bg-[#3777F6] text-white font-semibold py-4
                       shadow hover:opacity-95 active:scale-[.99] transition"
          >
            Continuer avec PayPal
          </button>
        </form>
      </div>
    </div>
  );
}
