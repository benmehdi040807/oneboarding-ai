"use client";

import { useEffect, useState } from "react";
import PhoneField from "./PhoneField";

type Props = { open: boolean; onClose: () => void };

export default function SubscribeModal({ open, onClose }: Props) {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [e164, setE164] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Verrouille le scroll global sans bloquer les listes internes
  useEffect(() => {
    if (!open) return;
    const body = document.body, html = document.documentElement;
    const sBodyOverflow = body.style.overflow;
    const sBodyOBY = (body.style as any).overscrollBehaviorY;
    const sHtmlOBY = (html.style as any).overscrollBehaviorY;

    body.style.overflow = "hidden";
    (body.style as any).overscrollBehaviorY = "none";
    (html.style as any).overscrollBehaviorY = "none";

    return () => {
      body.style.overflow = sBodyOverflow;
      (body.style as any).overscrollBehaviorY = sBodyOBY ?? "";
      (html.style as any).overscrollBehaviorY = sHtmlOBY ?? "";
    };
  }, [open]);

  if (!open) return null;

  // Création de l’espace
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !e164) return;
    setSubmitting(true);

    const profile = { firstName, lastName, phone: e164 };
    localStorage.setItem("ob_profile", JSON.stringify(profile));
    localStorage.setItem("ob_connected", "1");

    window.dispatchEvent(new Event("ob:profile-changed"));
    window.dispatchEvent(new Event("ob:connected-changed"));

    setSubmitting(false);
    onClose();
  };

  const baseInput =
    "w-full rounded-2xl border border-black/10 bg-white/60 backdrop-blur " +
    "px-4 py-3 text-black placeholder-white/90 outline-none " +
    "focus:ring-2 focus:ring-[#2E6CF5]/40 focus:border-transparent";

  return (
    <>
      {/* Assure l’affichage complet de la dropdown pays */}
      <style jsx global>{`
        .ob-modal-panel { overflow: visible !important; }
        .react-international-phone-country-selector,
        .react-international-phone-country-selector-dropdown,
        [role="listbox"] {
          z-index: 2147483640 !important;
          max-height: min(65vh, 520px) !important;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 z-[2147483600] flex items-end sm:items-center justify-center
                   bg-black/25 backdrop-blur-md"
        style={{ overscrollBehavior: "contain" }}  // pas de preventDefault ici
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="ob-modal-panel relative w-full sm:max-w-lg max-h-[85vh] rounded-3xl border border-white/60
                     bg-[rgba(255,255,255,0.32)] backdrop-blur-2xl shadow-xl
                     p-4 sm:p-6 m-0 sm:m-6"
          style={{ touchAction: "pan-y" }}
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

            <div className="relative">
              <PhoneField value={e164} onChange={setE164} />
            </div>

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
    </>
  );
}
