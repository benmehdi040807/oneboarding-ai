"use client";

import { useEffect, useState } from "react";
import PhoneField from "./PhoneField";

type Props = { open: boolean; onClose: () => void };

export default function SubscribeModal({ open, onClose }: Props) {
  // états simples
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [e164, setE164] = useState(""); // rempli par PhoneField
  const [submitting, setSubmitting] = useState(false);

  // verrouillage scroll page quand ouvert
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  // SUBMIT : on “crée l’espace” localement
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !e164) return;
    setSubmitting(true);

    // (ici tu brancheras l’OTP WhatsApp/SMS côté serveur)
    const profile = { firstName, lastName, phone: e164 };
    localStorage.setItem("ob_profile", JSON.stringify(profile));
    localStorage.setItem("ob_connected", "1");

    // notifier le reste de l’UI
    window.dispatchEvent(new Event("ob:connected-changed"));

    setSubmitting(false);
    onClose();
  };

  // styles : placeholders clairs (blanc/gris) avant saisie
  const baseInput =
    "w-full rounded-2xl border border-black/10 bg-white/60 backdrop-blur " +
    "px-4 py-3 text-black placeholder-white/90 outline-none";

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[2147483600] flex items-end sm:items-center justify-center
                 bg-black/25 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg rounded-3xl border border-white/50
                   bg-[rgba(255,255,255,0.28)] backdrop-blur-2xl shadow-xl
                   p-4 sm:p-6 m-0 sm:m-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black/90">Créer mon espace</h2>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-white/80 hover:bg-white/95 text-black/80
                       flex items-center justify-center text-xl"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Nom"
            autoComplete="family-name"
            className={baseInput}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Prénom"
            autoComplete="given-name"
            className={baseInput}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          {/* Pays + Indicatif + Numéro */}
          <PhoneField value={e164} onChange={setE164} />

          {/* Bouton principal agrandi (sans le paragraphe de format) */}
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
