"use client";

import { useEffect } from "react";
import PhoneField from "./PhoneField";

type Props = { open: boolean; onClose: () => void };

export default function SubscribeModal({ open, onClose }: Props) {
  // Empêche le scroll du body
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Gestion du bouton retour (back)
  useEffect(() => {
    if (!open) return;
    const onPop = () => onClose();
    window.history.pushState({ obModal: true }, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/25 backdrop-blur-md"
    >
      <div
        className="w-full sm:max-w-lg rounded-3xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-xl p-4 sm:p-6 m-0 sm:m-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black/90">Créer mon espace</h2>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/70 hover:bg-white/90 text-black/80 px-4 py-2 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Nom"
            autoComplete="family-name"
            className="w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-black placeholder-black/60 outline-none"
          />
          <input
            type="text"
            placeholder="Prénom"
            autoComplete="given-name"
            className="w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-black placeholder-black/60 outline-none"
          />
          <PhoneField value="" onChange={() => {}} />

          <p className="text-sm text-black/70">
            Format : <span className="font-semibold">+212</span> + numéro national (sans le 0 de tête).
          </p>

          <button
            className="w-full rounded-2xl bg-[#3777F6] text-white font-semibold py-4 shadow hover:opacity-95 active:scale-[.99] transition"
          >
            Continuer avec PayPal
          </button>
        </form>
      </div>
    </div>
  );
}
