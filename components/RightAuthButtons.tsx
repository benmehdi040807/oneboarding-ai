// components/RightAuthButtons.tsx
import React, { useEffect, useRef, useState } from "react";
import SubscribeModal from "./SubscribeModal";
import LoginModal from "./LoginModal";

export default function RightAuthButtons() {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const plusRef = useRef<HTMLButtonElement | null>(null);

  // Fermer le mini-menu si on clique en dehors
  useEffect(() => {
    if (!actionsOpen) return;
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!wrapRef.current) return;
      // Si on clique en dehors de la zone (mini-menu + bouton +)
      if (!wrapRef.current.contains(target)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [actionsOpen]);

  const iconBtn =
    "w-14 h-14 rounded-2xl flex items-center justify-center border text-xl " +
    "bg-white/70 border-white/30 backdrop-blur-md shadow-sm " +
    "hover:bg-white/80 active:scale-[0.98] transition";

  const chip =
    "px-4 h-10 rounded-2xl flex items-center justify-center text-[16px] " +
    "bg-white/80 border border-white/30 backdrop-blur-md shadow-sm " +
    "whitespace-nowrap";

  return (
    <>
      {/* Conteneur droit : position relative pour le popover */}
      <div className="relative ml-auto flex items-center gap-3" ref={wrapRef}>
        {/* Bouton + */}
        <button
          ref={plusRef}
          aria-label="Plus d’options"
          className={iconBtn}
          onClick={() => setActionsOpen((v) => !v)}
        >
          +
        </button>

        {/* Bouton clé (login) */}
        <button
          aria-label="Accéder à mon espace"
          className={iconBtn}
          onClick={() => setLoginOpen(true)}
        >
          🔑
        </button>

        {/* Mini-menu : n'affecte pas la mise en page (absolute) */}
        {actionsOpen && (
          <div
            className="absolute right-0 top-full mt-3 z-50"
            // Empêche le clic de remonter jusqu’au document (sinon fermeture immédiate)
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button
              className={chip}
              onClick={() => {
                // ouvrir la modale et fermer le mini-menu
                setSubscribeOpen(true);
                setActionsOpen(false);
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
        onClose={() => setSubscribeOpen(false)}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
