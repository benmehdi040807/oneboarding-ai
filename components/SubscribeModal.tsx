"use client";

import React, { useEffect, useRef, useState } from "react";
import PhoneField from "./PhoneField";

type Props = { open: boolean; onClose: () => void };

export default function SubscribeModal({ open, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>(""); // string stricte
  const [loading, setLoading] = useState(false);

  const canSubmit =
    !loading &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    phone.trim().length >= 6;

  // esc pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      // TODO: appel /api/paypal/subscribe
      await new Promise((r) => setTimeout(r, 500));
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog">
      {/* Backdrop très léger pour garder la page visible */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1.5px]" onClick={onClose} />

      {/* Bottom sheet responsive */}
      <div
        ref={sheetRef}
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-2xl border border-white/15 bg-[var(--panel)]/85 text-white shadow-[0_-12px_30px_rgba(0,0,0,0.35)]"
      >
        {/* Drag handle + header */}
        <div className="pt-2 pb-3 px-5 border-b border-white/10">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/25" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Créer mon espace</h2>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <input
            type="text"
            placeholder="Prénom"
            className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus
            inputMode="text"
          />
          <input
            type="text"
            placeholder="Nom"
            className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            inputMode="text"
          />

          {/* Drapeau + indicatif + numéro */}
          <PhoneField value={phone} onChange={(v) => setPhone(v ?? "")} />

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full px-4 py-3 rounded-xl font-semibold transition ${
              canSubmit
                ? "bg-[var(--accent)] text-black hover:brightness-110 active:scale-[0.995]"
                : "bg-white/10 text-white/70 cursor-not-allowed"
            }`}
          >
            {loading ? "…" : "Continuer avec PayPal"}
          </button>

          <p className="text-xs opacity-80 pb-2">
            En continuant, vous acceptez le Manifeste, les CGU et la Politique de confidentialité.
          </p>
        </form>
      </div>
    </div>
  );
}
