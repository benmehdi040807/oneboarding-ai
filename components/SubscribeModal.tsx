// components/SubscribeModal.tsx
import React, { useEffect } from "react";
import PhoneField from "./PhoneField";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SubscribeModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay cliquable */}
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* bottom-sheet mobile first */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute bottom-0 left-0 right-0 mx-auto max-w-xl
                   rounded-t-3xl bg-white/95 backdrop-blur-md shadow-2xl
                   border border-white/40 p-4 pb-6"
        style={{ transform: "translateZ(0)" }}
      >
        {/* poignée */}
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-black/10" />

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Créer mon espace</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-black/5 border border-black/10"
          >
            Fermer
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            // Ici : tu déclenches PayPal après validation (à raccorder à ton flow)
            // … puis, si ok :
            onClose();
          }}
        >
          {/* Nom puis Prénom (dans cet ordre) */}
          <input
            required
            name="lastName"
            placeholder="Nom"
            className="w-full h-11 px-3 rounded-2xl bg-white/80 border border-black/10"
          />
          <input
            required
            name="firstName"
            placeholder="Prénom"
            className="w-full h-11 px-3 rounded-2xl bg-white/80 border border-black/10"
          />

          {/* Téléphone : drapeau+indicatif dans la 1re case, numéro dans la 2e */}
          <PhoneField />

          <p className="text-xs text-black/60">
            En continuant, vous acceptez le Manifeste, les CGU et la Politique
            de confidentialité.
          </p>

          <button
            type="submit"
            className="w-full h-11 rounded-2xl bg-[#253BFF] text-white font-semibold"
          >
            Continuer avec PayPal
          </button>
        </form>
      </div>
    </div>
  );
}
