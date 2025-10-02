"use client";

import React, { useEffect, useRef, useState } from "react";
import PhoneField from "./PhoneField";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SubscribeModal({ open, onClose }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  // IMPORTANT : toujours une string pour éviter "string | undefined"
  const [phone, setPhone] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const canSubmit =
    !loading &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    phone.trim().length >= 6;

  useEffect(() => {
    if (!open) return;
    const el = boxRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      // Ici, on appelle (plus tard) l’API d’abonnement PayPal -> placeholder
      // await fetch("/api/paypal/subscribe", { ... })
      await new Promise((r) => setTimeout(r, 600)); // petite latence simulée
      // on ferme pour l’instant
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={boxRef}
        className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-white shadow-xl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Créer mon espace</h2>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15"
            aria-label="Fermer"
            title="Fermer"
          >
            Fermer
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <input
            type="text"
            placeholder="Prénom"
            className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus
          />

          <input
            type="text"
            placeholder="Nom"
            className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          {/* PhoneField attend une string : on force v ?? "" */}
          <PhoneField value={phone} onChange={(v) => setPhone(v ?? "")} />

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full px-4 py-3 rounded-xl font-semibold transition ${
              canSubmit
                ? "bg-[var(--accent)] text-black hover:brightness-110"
                : "bg-white/10 text-white/70 cursor-not-allowed"
            }`}
          >
            {loading ? "…" : "Continuer avec PayPal"}
          </button>

          <p className="text-xs opacity-75">
            En continuant, vous acceptez le Manifeste, les CGU et la Politique de confidentialité.
          </p>
        </form>
      </div>
    </div>
  );
}
