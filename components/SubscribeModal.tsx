"use client";

import { useEffect, useRef } from "react";
import PhoneField from "./PhoneField";

type Props = { open: boolean; onClose: () => void };

export default function SubscribeModal({ open, onClose }: Props) {
  const pushedRef = useRef(false);

  // Empêche le scroll du body et les overscroll (pull-to-refresh)
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevOb = (body.style as any).overscrollBehavior;
    body.style.overflow = "hidden";
    (body.style as any).overscrollBehavior = "contain"; // bloque P2R Chrome Android
    return () => {
      body.style.overflow = prevOverflow;
      (body.style as any).overscrollBehavior = prevOb || "";
    };
  }, [open]);

  // Back = ferme le modal (pushState protégé)
  useEffect(() => {
    if (!open) return;
    const onPop = () => onClose();
    if (!pushedRef.current) {
      try { window.history.pushState({ obModal: true }, ""); pushedRef.current = true; } catch {}
    }
    window.addEventListener("popstate", onPop);
    return () => { window.removeEventListener("popstate", onPop); pushedRef.current = false; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      // clic en dehors = fermer
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center
                 bg-black/20 backdrop-blur-md"
    >
      <div
        // +50% de transparence vs avant : 30% -> 15%
        className="w-full sm:max-w-lg rounded-3xl border border-white/40
                   bg-white/15 backdrop-blur-xl shadow-xl p-4 sm:p-6 m-0 sm:m-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black/90">Créer mon espace</h2>

          {/* “Plus tard” : hitbox large + aria + facile à toucher */}
          <button
            type="button"
            aria-label="Plus tard"
            onClick={onClose}
            className="min-w-[106px] h-10 px-4 rounded-xl bg-white/70 hover:bg-white/90
                       text-black/80 text-base flex items-center justify-center
                       active:scale-[.98] transition"
          >
            Plus tard
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
