"use client";

import { useEffect, useCallback } from "react";
import PhoneField from "./PhoneField";
import { X } from "lucide-react";

type Props = { open: boolean; onClose: () => void };

export default function SubscribeModal({ open, onClose }: Props) {
  // Fermer via ESC
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  // Lock scroll de la page et éviter le pull-to-refresh derrière
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevOb = (body.style as any).overscrollBehavior;
    body.style.overflow = "hidden";
    (body.style as any).overscrollBehavior = "contain";
    window.addEventListener("keydown", onKey);
    return () => {
      body.style.overflow = prevOverflow;
      (body.style as any).overscrollBehavior = prevOb || "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onKey]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Créer mon espace"
      // clic overlay -> close
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                 bg-black/30 backdrop-blur-md"
    >
      {/* Carte : très transparente + blur */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg rounded-3xl border border-white/40
                   bg-white/20 backdrop-blur-xl shadow-2xl p-4 sm:p-6 m-0 sm:m-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black/90">Créer mon espace</h2>

          {/* CROIX – large zone cliquable */}
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="h-10 min-w-[44px] px-3 rounded-xl bg-white/70 hover:bg-white/90
                       text-black/80 flex items-center justify-center active:scale-[.98] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text" placeholder="Nom" autoComplete="family-name"
            className="w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3
                       text-black placeholder-black/60 outline-none"
          />
          <input
            type="text" placeholder="Prénom" autoComplete="given-name"
            className="w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3
                       text-black placeholder-black/60 outline-none"
          />

          {/* Pays + téléphone */}
          <PhoneField value="" onChange={() => {}} />

          <p className="text-sm text-black/70">
            Format : <span className="font-semibold">+212</span> + numéro national (sans le 0 de tête).
          </p>

          <button
            type="submit"
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
