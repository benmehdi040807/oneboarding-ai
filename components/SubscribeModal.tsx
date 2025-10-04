"use client";

import { useEffect, useRef, useState } from "react";
import PhoneField from "./PhoneField";

type Props = { open: boolean; onClose: () => void };

// ———————————————————————————————————————————
//  Modal natif <dialog> (aucun overlay custom, pas de hacks CSS)
// ———————————————————————————————————————————
export default function SubscribeModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // états simples
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [e164, setE164] = useState(""); // rempli par PhoneField
  const [submitting, setSubmitting] = useState(false);

  // Ouvrir/fermer en réaction à la prop `open`
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;

    if (open && !d.open) {
      d.showModal(); // bloque l’arrière-plan, affiche backdrop natif
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // Fermer avec ESC / Cancel
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;

    const onCancel = (e: Event) => {
      e.preventDefault(); // évite la fermeture implicite par défaut
      onClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);

  // Fermer quand on clique sur le backdrop (zone hors carte)
  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const d = dialogRef.current;
    if (!d) return;
    const rect = d.getBoundingClientRect();
    const clickInDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!clickInDialog) onClose();
  };

  // SUBMIT : on “crée l’espace” localement
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !e164) return;
    setSubmitting(true);

    const profile = { firstName, lastName, phone: e164 };
    try {
      localStorage.setItem("ob_profile", JSON.stringify(profile));
      localStorage.setItem("ob_connected", "1");
      // notifier le reste de l’UI
      window.dispatchEvent(new Event("ob:profile-changed"));
      window.dispatchEvent(new Event("ob:connected-changed"));
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  // Inputs sobres (look système)
  const baseInput =
    "w-full rounded-2xl border border-black/10 bg-white " +
    "px-4 py-3 text-black placeholder-black/40 outline-none";

  return (
    <>
      {/* Style du backdrop natif (léger) */}
      <style>{`
        dialog::backdrop {
          background: rgba(0,0,0,.45);
          -webkit-backdrop-filter: saturate(120%) blur(2px);
          backdrop-filter: saturate(120%) blur(2px);
        }
      `}</style>

      <dialog
        ref={dialogRef}
        onMouseDown={onBackdropClick}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg"
      >
        {/* Carte du formulaire */}
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Créer mon espace</h2>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1]
                         text-black/80 grid place-items-center text-xl"
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

            {/* Pays + Indicatif + Numéro (sélecteur natif) */}
            <PhoneField value={e164} onChange={setE164} />

            {/* Boutons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={submitting || !firstName || !lastName || !e164}
                className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold
                           shadow disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg,#4F8AF9,#2E6CF5)",
                }}
              >
                {submitting ? "Création..." : "Créer mon espace"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
    }
