// components/RightAuthButtons.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Modales (lazy, côté client)
const SubscribeModal = dynamic(() => import("@/components/SubscribeModal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/LoginModal"), { ssr: false });

// Un petit nom d’évènement global pour fermer les “mini-boutons” concurrents
const CLOSE_AUX_EVENT = "oneboarding:close-aux-buttons";

export default function RightAuthButtons() {
  const [showMini, setShowMini] = useState(false);          // petit chip “Créer mon espace”
  const [showSubscribe, setShowSubscribe] = useState(false); // modal d’abonnement
  const [showLogin, setShowLogin] = useState(false);         // modal d’accès
  const [isActive, setIsActive] = useState(false);           // ➕ → ✅ après création/abonnement
  const [session, setSession] = useState<{ authenticated: boolean } | null>(null);
  const miniRef = useRef<HTMLDivElement | null>(null);

  // Récupère l’état de session pour peindre la clé
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => setSession(j))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  // Fermer si clic à l’extérieur
  useEffect(() => {
    if (!showMini) return;
    const onClick = (e: MouseEvent) => {
      if (!miniRef.current) return;
      if (!miniRef.current.contains(e.target as Node)) setShowMini(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showMini]);

  // Fermer si un autre composant demande à fermer les auxiliaires
  useEffect(() => {
    const close = () => setShowMini(false);
    window.addEventListener(CLOSE_AUX_EVENT, close as EventListener);
    return () => window.removeEventListener(CLOSE_AUX_EVENT, close as EventListener);
  }, []);

  const baseBtn =
    "h-12 w-12 rounded-xl border text-xl grid place-items-center transition";
  const plusBtn =
    `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;
  const keyBtn = session?.authenticated
    ? `${baseBtn} bg-blue-600/90 border-blue-600 text-white`
    : `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;

  // Ouvre / ferme le mini-bouton. On ferme les auxiliaires concurrents d’abord.
  function toggleMini() {
    // informe les autres composants (ex : le chip “Charger 1 fichier”) de se fermer
    try {
      window.dispatchEvent(new CustomEvent(CLOSE_AUX_EVENT));
    } catch {}
    setShowMini((v) => !v);
  }

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-3">
          {/* ➕ (ouvre le petit chip clair “Créer mon espace”) */}
          <button
            aria-label={isActive ? "Espace actif" : "Créer mon espace"}
            title={isActive ? "Espace OneBoarding AI actif" : "Créer mon espace"}
            className={plusBtn}
            onClick={toggleMini}
          >
            {isActive ? "✅" : "➕"}
          </button>

          {/* 🔑 se connecter / se déconnecter */}
          <button
            aria-label={session?.authenticated ? "Se déconnecter" : "Accéder à mon espace"}
            title={session?.authenticated ? "Se déconnecter" : "Accéder à mon espace"}
            className={keyBtn}
            onClick={async () => {
              if (session?.authenticated) {
                await fetch("/api/auth/session", { method: "DELETE" });
                setSession({ authenticated: false });
              } else {
                // Fermer les auxiliaires concurrents avant d’ouvrir la modale
                try {
                  window.dispatchEvent(new CustomEvent(CLOSE_AUX_EVENT));
                } catch {}
                setShowLogin(true);
              }
            }}
          >
            🔑
          </button>
        </div>

        {/* Chip “Créer mon espace”
            - positionné sous le bouton ➕, aligné à droite
            - une seule ligne (nowrap), miroir visuel du chip “Charger 1 fichier”
        */}
        {showMini && (
          <div
            ref={miniRef}
            className="absolute right-0 top-[56px] z-[20] animate-[fadeUp_0.18s_ease-out_both]"
          >
            <button
              onClick={() => {
                // Ouvrir le modal puis fermer le chip (petit délai pour éviter un flicker sur mobile)
                setShowSubscribe(true);
                setTimeout(() => setShowMini(false), 0);
              }}
              className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] text-[var(--fg)] font-medium shadow-sm active:scale-[0.99] transition whitespace-nowrap"
            >
              Créer mon espace
            </button>
          </div>
        )}
      </div>

      {/* Modales */}
      <SubscribeModal
        open={showSubscribe}
        onClose={() => setShowSubscribe(false)}
      />
      <LoginModal
        open={showLogin}
        onClose={() => {
          setShowLogin(false);
          // rafraîchir l’état affiché de la clé
          fetch("/api/auth/session")
            .then((r) => r.json())
            .then((j) => setSession(j))
            .catch(() => {});
        }}
      />
    </>
  );
}
