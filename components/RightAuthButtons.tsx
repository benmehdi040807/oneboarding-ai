// components/RightAuthButtons.tsx
import React, { useState } from "react";
import SubscribeModal from "./SubscribeModal";
import LoginModal from "./LoginModal";

export default function RightAuthButtons() {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  /**
   * On copie EXACTEMENT le style des 2 boutons de gauche :
   * mêmes dimensions, mêmes arrondis, mêmes couleurs, même ombre.
   * Ici c’est “btnClass” – adapte-le si ton bouton gauche a d’autres classes.
   */
  const btnClass =
    "w-12 h-12 rounded-2xl flex items-center justify-center " +
    "bg-white/90 border border-white/30 backdrop-blur-md shadow-sm " +
    "hover:bg-white/95 active:scale-[0.98] transition";

  return (
    <>
      <div className="flex items-center gap-3 ml-auto">
        {/* Bouton + qui ouvre DIRECTEMENT la modale */}
        <button
          type="button"
          aria-label="Créer mon espace"
          className={btnClass}
          onClick={() => setSubscribeOpen(true)}
        >
          <span className="text-4xl leading-none">+</span>
        </button>

        {/* Bouton clé (même style) */}
        <button
          type="button"
          aria-label="Se connecter"
          className={btnClass}
          onClick={() => setLoginOpen(true)}
        >
          <span className="text-xl">🔑</span>
        </button>
      </div>

      {/* Modales */}
      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
