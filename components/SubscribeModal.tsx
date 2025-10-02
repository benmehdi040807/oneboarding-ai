// components/SubscribeModal.tsx
"use client";

import { useEffect, useState } from "react";
import PhoneField from "./PhoneField";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SubscribeModal({ open, onClose }: Props) {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>(""); // Nom en premier (demande client)
  const [phone, setPhone] = useState<string>("");       // E.164, fourni par <PhoneField/>
  const [loading, setLoading] = useState(false);

  // Fermer sur ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canSubmit = lastName.trim() !== "" && firstName.trim() !== "" && phone.startsWith("+") && phone.length > 4;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      // Ici vous lancerez votre création de compte + création de session PayPal
      // Ex. POST /api/subscribe avec { firstName, lastName, phone }
      // await fetch("/api/subscribe", { method:"POST", body: JSON.stringify({ firstName, lastName, phone }) });

      // Pour le moment, on ferme simplement le modal après un “succès” simulé.
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full sm:max-w-lg bg-white/70 text-black rounded-2xl shadow-xl mx-2 sm:mx-0 overflow-hidden">
        {/* Barre de tête */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/60">
          <h3 className="font-semibold text-black">Créer mon espace</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-black"
          >
            Fermer
          </button>
        </div>

        {/* Contenu */}
        <div className="p-4 space-y-3">
          {/* Nom puis Prénom */}
          <input
            type="text"
            placeholder="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl bg-white/60 border border-black/10 px-3 py-3 outline-none"
          />
          <input
            type="text"
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl bg-white/60 border border-black/10 px-3 py-3 outline-none"
          />

          {/* Téléphone : drapeau+indicatif + numéro — renvoie E.164 via setPhone */}
          <PhoneField value={phone} onChange={setPhone} />

          <p className="text-xs text-black/70">
            En continuant, vous acceptez le Manifeste, les CGU et la Politique de confidentialité.
          </p>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full mt-1 rounded-xl px-4 py-3 font-semibold
                       bg-[#0070E0] disabled:bg-[#0070E0]/40 text-white
                       hover:bg-[#0a64c2] transition"
          >
            {loading ? "Veuillez patienter…" : "Continuer avec PayPal"}
          </button>
        </div>
      </div>
    </div>
  );
}
