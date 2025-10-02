// components/RightAuthButtons.tsx
import React, { useState } from "react";
import SubscribeModal from "./SubscribeModal";
import LoginModal from "./LoginModal";

export default function RightAuthButtons() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const iconBtn =
    "w-14 h-14 rounded-2xl flex items-center justify-center border text-xl " +
    "bg-white/70 border-white/30 backdrop-blur-md shadow-sm " +
    "hover:bg-white/80 active:scale-[0.98] transition";

  const chip =
    "px-4 h-10 rounded-2xl flex items-center justify-center text-[16px] " +
    "bg-white/90 border border-white/30 backdrop-blur-md shadow-sm whitespace-nowrap";

  return (
    <>
      <div className="relative ml-auto flex items-center gap-3">
        {/* Bouton + : ouvre/ferme UNIQUEMENT le mini-menu */}
        <button
          aria-label="Créer mon espace"
          className={iconBtn}
          onClick={() => setMenuOpen((v) => !v)}
        >
          +
        </button>

        {/* Bouton clé */}
        <button
          aria-label="Accéder à mon espace"
          className={iconBtn}
          onClick={() => setLoginOpen(true)}
        >
          🔑
        </button>

        {/* Mini-bouton sous le + (pas de click-outside) */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-3 z-50">
            <button
              className={chip}
              // onPointerDown capte avant le click/touch et évite toute fermeture parasite
              onPointerDown={(e) => {
                e.preventDefault();
                // Ouvrir la modale et fermer le mini-menu
                setSubscribeOpen(true);
                setMenuOpen(false);
              }}
            >
              Créer mon espace
            </button>
          </div>
        )}
      </div>

      {/* Modales */}
      <SubscribeModal
        open={subscribeOpen}
        onClose={() => {
          setSubscribeOpen(false);
          // à la fermeture de la modale, on laisse le menu fermé
          setMenuOpen(false);
        }}
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
