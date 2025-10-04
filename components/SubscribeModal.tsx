"use client";

import { useEffect, useRef, useState } from "react";
import PhoneField from "./PhoneField";

// --- Bandeau de bienvenue au-dessus de la barre principale ---
function WelcomeMessageAboveBar() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const load = () => {
      const p = typeof window !== "undefined" ? localStorage.getItem("ob_profile") : null;
      const prof = p ? JSON.parse(p) : null;
      setFirstName(prof?.firstName ?? null);
      setActive(localStorage.getItem("ob_connected") === "1");
    };
    load();
    window.addEventListener("ob:connected-changed", load);
    window.addEventListener("ob:profile-changed", load);
    return () => {
      window.removeEventListener("ob:connected-changed", load);
      window.removeEventListener("ob:profile-changed", load);
    };
  }, []);

  if (!active || !firstName) return null;

  return (
    <div className="w-full text-center mt-3 mb-2">
      <span className="text-lg font-semibold text-black/80">
        Bonjour {firstName} — Espace désormais :
        <span className="ml-1 font-bold text-green-500">Actif</span>
      </span>
    </div>
  );
}

type Props = { open: boolean; onClose: () => void };

export default function SubscribeModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // form state
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [e164, setE164] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Ouvre/ferme le <dialog> nativement
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal(); // bloque l’arrière-plan, pas d’interférences
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // Fermer si l’utilisateur clique en dehors du contenu
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    const inDialog = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    if (!inDialog) onClose();
  };

  // Soumission : enregistre le profil local + notifie
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
    "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black " +
    "placeholder-black/40 outline-none focus:ring-2 focus:ring-[#2E6CF5]/30";

  return (
    <>
      {/* Bandeau de bienvenue */}
      <WelcomeMessageAboveBar />

      {/* Styles natifs du backdrop du <dialog> */}
      <style jsx global>{`
        dialog::backdrop {
          background: rgba(0, 0, 0, 0.6);
        }
      `}</style>

      {/* Modal natif */}
      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        onClose={onClose}
        className="w-[92vw] max-w-lg rounded-3xl p-0 border-0"
      >
        {/* Contenu du modal (100% opaque pour éviter toute interférence) */}
        <div className="bg-white rounded-3xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-black/90">Créer mon espace</h2>

            {/* Bouton de fermeture natif (méthode="dialog" ferme sans JS) */}
            <form method="dialog">
              <button
                aria-label="Fermer"
                className="h-10 w-10 rounded-full bg-black/5 hover:bg-black/10 text-black/80
                           flex items-center justify-center text-xl"
              >
                ×
              </button>
            </form>
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

            {/* Sélecteur pays + téléphone : natif (déjà fiabilisé) */}
            <PhoneField value={e164} onChange={setE164} />

            <button
              disabled={submitting || !firstName || !lastName || !e164}
              className="w-full rounded-2xl py-4 text-lg font-semibold text-white
                         shadow hover:opacity-95 active:scale-[.99] transition
                         disabled:opacity-60 disabled:cursor-not-allowed
                         bg-[linear-gradient(135deg,#4F8AF9,#2E6CF5)]"
            >
              {submitting ? "Création..." : "Créer mon espace"}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
      }
