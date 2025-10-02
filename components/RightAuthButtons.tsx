// components/RightAuthButtons.tsx
import React, { useState } from "react";
import SubscribeModal from "./SubscribeModal";
import LoginModal from "./LoginModal";

export default function RightAuthButtons() {
  const [showChip, setShowChip] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // même style que les boutons à gauche (taille homogène)
  const btn =
    "w-12 h-12 rounded-2xl flex items-center justify-center " +
    "bg-white/90 border border-white/30 backdrop-blur-md shadow-sm " +
    "hover:bg-white/95 active:scale-[0.98] transition";

  const chip =
    "px-4 h-10 rounded-2xl bg-white/90 border border-white/30 " +
    "backdrop-blur-md shadow-sm text-[16px] font-medium " +
    "flex items-center justify-center whitespace-nowrap";

  return (
    <>
      <div className="ml-auto flex items-center gap-3 relative">
        <button
          type="button"
          aria-label="Créer mon espace"
          className={btn}
          onClick={() => setShowChip((v) => !v)}
        >
          <span className="text-3xl leading-none">+</span>
        </button>

        <button
          type="button"
          aria-label="Accéder à mon espace"
          className={btn}
          onClick={() => setLoginOpen(true)}
        >
          <span className="text-xl">🔑</span>
        </button>

        {/* Chip “Créer mon espace” (unibouton) */}
        {showChip && (
          <button
            type="button"
            className={chip + " absolute left-0 translate-y-[60px]"}
            onClick={() => setSubscribeOpen(true)}
          >
            Créer mon espace
          </button>
        )}
      </div>

      {/* Modales */}
      <SubscribeModal
        open={subscribeOpen}
        onClose={() => {
          setSubscribeOpen(false);
          // on laisse le chip visible ; si tu veux qu’il disparaisse : setShowChip(false)
        }}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
