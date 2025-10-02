"use client";

import { useState } from "react";
import { Plus, KeyRound } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

export default function RightAuthButtons() {
  const [openSubscribe, setOpenSubscribe] = useState(false);

  return (
    <>
      {/* Toujours visibles (desktop & mobile), au-dessus des autres layers */}
      <div className="relative z-40 flex items-center gap-3">
        {/* PLUS */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className="h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow
                     flex items-center justify-center"
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

        {/* CLÉ (future auth) */}
        <button
          type="button"
          aria-label="Accéder à mon espace"
          className="h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow
                     flex items-center justify-center"
        >
          <KeyRound className="h-6 w-6 text-amber-500" />
        </button>
      </div>

      {/* Modal contrôlé par le parent */}
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
}
