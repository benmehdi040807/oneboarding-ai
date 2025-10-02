"use client";

import React, { useMemo, useState } from "react";
import PhoneField from "./PhoneField";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function SubscribeModal({ open, onClose, onCreated }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [phone, setPhone]         = useState(""); // E.164 (+212...)
  const [loading, setLoading]     = useState(false);

  const canSubmit = useMemo(
    () => !!lastName && !!firstName && phone.startsWith("+"),
    [lastName, firstName, phone]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* background flou/translucide */}
      <div className="absolute inset-0 backdrop-blur-md bg-black/40" />

      {/* feuille en bas (mobile) / carte (desktop) */}
      <div className="relative w-full sm:w-[540px] rounded-t-3xl sm:rounded-3xl bg-white/10 border border-white/15 text-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10">
          <div className="mx-auto sm:mx-0 h-1.5 w-16 sm:hidden rounded-full bg-white/25" />
          <h3 className="text-lg font-semibold">Créer mon espace</h3>
          <button
            className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>

        {/* contenu */}
        <div className="px-5 sm:px-6 py-5 space-y-4">
          {/* Nom puis Prénom */}
          <input
            placeholder="Nom"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            placeholder="Prénom"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          {/* Drapeau + indicatif | Numéro */}
          <PhoneField value={phone} onChange={setPhone} defaultCountry="MA" />

          <p className="text-xs text-white/50">
            En continuant, vous acceptez le Manifeste, les CGU et la Politique de confidentialité.
          </p>

          <button
            className="w-full rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-4 py-3 font-semibold disabled:opacity-50"
            disabled={loading || !canSubmit}
            onClick={async () => {
              try {
                setLoading(true);
                // 1) créer l’espace + démarrer le flux PayPal (serveur)
                const r = await fetch("/api/subscribe/start", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ firstName, lastName, phone }),
                });
                const j = await r.json();
                if (j?.approveUrl) {
                  // redirection PayPal
                  window.location.href = j.approveUrl;
                } else {
                  // fallback : fermer + callback succès
                  onCreated?.();
                  onClose();
                }
              } finally {
                setLoading(false);
              }
            }}
          >
            Continuer avec PayPal
          </button>
        </div>
      </div>
    </div>
  );
}
