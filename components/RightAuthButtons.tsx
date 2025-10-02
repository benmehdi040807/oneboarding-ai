// components/RightAuthButtons.tsx
import React, { useState } from "react";
import SubscribeModal from "./SubscribeModal";
import LoginModal from "./LoginModal";

export default function RightAuthButtons() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  /**
   * ⚙️ Styles harmonisés :
   * - iconBtn : EXACTEMENT la même taille que les 2 boutons de gauche (w-14 h-14),
   *   fond clair, bord, blur, ombre — avec un PLUS bien visible (text-3xl).
   * - chipClass : même puce que "Charger 1 fichier" (h-10, arrondi, fond clair).
   * Si jamais la puce de gauche a d'autres classes dans ton projet,
   * tu peux copier/coller ces mêmes classes ici: chipClass = "…".
   */
  const iconBtn =
    "w-14 h-14 rounded-2xl flex items-center justify-center border " +
    "bg-white/90 border-white/30 backdrop-blur-md shadow-sm " +
    "hover:bg-white/95 active:scale-[0.98] transition text-3xl leading-none";

  const chipClass =
    "px-4 h-10 rounded-2xl flex items-center justify-center " +
    "text-[15px] font-medium bg-white/90 border border-white/30 " +
    "backdrop-blur-md shadow-sm whitespace-nowrap select-none";

  return (
    <>
      <div className="relative ml-auto flex items-center gap-3">
        {/* Bouton + (même taille que les icônes de gauche, + bien visible) */}
        <button
          type="button"
          aria-label="Ouvrir le menu création"
          className={iconBtn}
          onClick={() => setMenuOpen((v) => !v)}
        >
          +
        </button>

        {/* Bouton clé (même taille/visuel) */}
        <button
          type="button"
          aria-label="Accéder à mon espace"
          className={iconBtn}
          onClick={() => setLoginOpen(true)}
        >
          <span className="text-xl">🔑</span>
        </button>

        {/* Puce "Créer mon espace" — alignée visuellement à la puce gauche */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-3 z-50">
            <button
              type="button"
              className={chipClass}
              onClick={() => {
                setSubscribeOpen(true); // ouvre immédiatement la modale
                setMenuOpen(false);     // et referme le mini-menu
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
          setMenuOpen(false);
        }}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
