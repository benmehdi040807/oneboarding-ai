"use client";

import { useState } from "react";
import { Plus, KeyRound } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

export default function RightAuthButtons() {
  const [openSubscribe, setOpenSubscribe] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Bouton PLUS */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className="h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow flex items-center justify-center z-20"
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

        {/* Bouton Clé (placeholder) */}
        <button
          type="button"
          aria-label="Accéder à mon espace"
          className="h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow flex items-center justify-center z-20"
        >
          <KeyRound className="h-6 w-6 text-amber-500" />
        </button>
      </div>

      {/* Modal d’abonnement (ouverture/fermeture contrôlées ici) */}
      <SubscribeModal
        open={openSubscribe}
        onClose={() => setOpenSubscribe(false)}
      />
    </>
  );
}
