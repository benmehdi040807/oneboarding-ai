"use client";

import { useEffect, useState } from "react";
import PhoneField from "./PhoneField";

type Props = { open: boolean; onClose: () => void };

export default function SubscribeModal({ open, onClose }: Props) {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [e164, setE164] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !e164) return;
    setSubmitting(true);

    const profile = { firstName, lastName, phone: e164 };
    localStorage.setItem("ob_profile", JSON.stringify(profile));
    localStorage.setItem("ob_connected", "1");
    window.dispatchEvent(new Event("ob:connected-changed"));

    setSubmitting(false);
    onClose();
  };

  const baseInput =
    "w-full rounded-2xl border border-black/10 bg-white/60 backdrop-blur " +
    "px-4 py-3 text-black placeholder-white/90 outline-none " +
    "focus:ring-2 focus:ring-[#2E6CF5]/40 focus:border-transparent";

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[2147483600] flex items-end sm:items-center justify-center bg-black/25 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg rounded-3xl border border-white/60
                   bg-[rgba(255,255,255,0.32)] backdrop-blur-2xl shadow-xl
                   p-4 sm:p-6 m-0 sm:m-6"
      >
        {/* X — large hit-area (44x44) */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 h-11 w-11 rounded-full bg-white/90 hover:bg-white text-black/80 grid place-items-center text-2xl"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-black/90 mb-4">Créer mon espace</h2>

        <form className="space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Nom"
            autoComplete="family-name"
            className={baseInput}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoFocus
          />
          <input
            type="text"
            placeholder="Prénom"
            autoComplete="given-name"
            className={baseInput}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <PhoneField value={e164} onChange={setE164} />

          <button
            disabled={submitting || !firstName || !lastName || !e164}
            className="w-full rounded-2xl py-5 text-lg font-semibold text-white
                       shadow hover:opacity-95 active:scale-[.99] transition
                       disabled:opacity-60 disabled:cursor-not-allowed
                       bg-[linear-gradient(135deg,#4F8AF9,#2E6CF5)]"
          >
            {submitting ? "Création..." : "Créer mon espace"}
          </button>
        </form>
      </div>
    </div>
  );
}
