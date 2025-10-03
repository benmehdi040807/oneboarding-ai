"use client";

import { useEffect, useRef } from "react";
import PhoneField from "./PhoneField";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SubscribeModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Back Android / navigateur : ferme d’abord la liste pays (géré par PhoneField),
  // puis le modal (nous poussons 1 état d’historique quand il s’ouvre).
  useEffect(() => {
    if (!open) return;
    const state = { oneboardingModal: true };
    try {
      window.history.pushState(state, "");
    } catch {}
    const onPop = () => {
      onClose();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, onClose]);

  if (!open) return null;

  const onClickBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClickBackdrop}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center
                 bg-black/35 backdrop-blur-md"
    >
      <div
        ref={dialogRef}
        className="w-full sm:max-w-lg rounded-3xl
                   border border-white/30 bg-white/35 backdrop-blur-xl
                   shadow-xl p-4 sm:p-6 m-0 sm:m-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black/90">Créer mon espace</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-white/60 hover:bg-white/80 text-black/80"
          >
            Fermer
          </button>
        </div>

        {/* Formulaire */}
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {/* Nom */}
          <input
            type="text"
            inputMode="text"
            autoComplete="family-name"
            placeholder="Nom"
            className="w-full rounded-2xl border border-black/10 bg-white/60 backdrop-blur
                       px-4 py-3 text-black placeholder-black/60 outline-none"
          />

          {/* Prénom */}
          <input
            type="text"
            inputMode="text"
            autoComplete="given-name"
            placeholder="Prénom"
            className="w-full rounded-2xl border border-black/10 bg-white/60 backdrop-blur
                       px-4 py-3 text-black placeholder-black/60 outline-none"
          />

          {/* Téléphone (pays séparé + indicatif + numéro) */}
          <PhoneField
            value=""
            onChange={() => {}}
          />

          <p className="text-sm text-black/70">
            Format : <span className="font-semibold">+212</span> + numéro national
            (sans le 0 de tête).
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
