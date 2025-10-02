// components/RightAuthButtons.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import SubscribeModal from "./SubscribeModal";
import LoginModal from "./LoginModal";

export default function RightAuthButtons() {
  const [showCreateChip, setShowCreateChip] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // conteneur "zone droite" pour fermer le chip si on clique ailleurs
  const clusterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!clusterRef.current) return;
      const target = e.target as Node;
      if (!clusterRef.current.contains(target)) {
        setShowCreateChip(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Styles communs
  const iconBtn =
    "w-14 h-14 rounded-2xl flex items-center justify-center bg-white/8 border border-white/15 backdrop-blur text-xl active:scale-95 transition";
  const keyBtn =
    "w-14 h-14 rounded-2xl flex items-center justify-center bg-white/8 border border-white/15 backdrop-blur text-xl active:scale-95 transition";

  return (
    <>
      {/* Rangée d’actions droite */}
      <div className="ml-auto relative" ref={clusterRef}>
        <div className="flex items-center gap-3">
          {/* PLUS */}
          <button
            aria-label="Créer mon espace"
            className={iconBtn}
            onClick={(e) => {
              e.stopPropagation(); // évite fermeture immédiate
              setShowCreateChip((v) => !v);
            }}
            title="Créer mon espace"
          >
            +
          </button>

          {/* CLÉ */}
          <button
            aria-label="Accéder à mon espace"
            className={keyBtn}
            onClick={(e) => {
              e.stopPropagation();
              setShowLogin(true);
            }}
            title="Accéder à mon espace"
          >
            🔑
          </button>
        </div>

        {/* CHIP 'Créer mon espace' — absolu, cliquable, haut z-index */}
        {showCreateChip && (
          <button
            className="absolute top-16 right-0 z-[60] pointer-events-auto select-none
                       rounded-2xl border border-white/15 bg-white/20 backdrop-blur px-4 py-2
                       text-base text-white shadow-lg hover:bg-white/25 active:scale-[0.98] transition"
            onClick={(e) => {
              e.stopPropagation();
              setShowCreateChip(false);
              setShowSubscribe(true);
            }}
          >
            Créer mon espace
          </button>
        )}
      </div>

      {/* Modales */}
      <SubscribeModal
        open={showSubscribe}
        onClose={() => setShowSubscribe(false)}
        // après souscription on peut, si tu veux, afficher un toast de bienvenue ici
      />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
