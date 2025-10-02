// components/RightAuthButtons.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// lazy import des modales
const SubscribeModal = dynamic(() => import("@/components/SubscribeModal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/LoginModal"), { ssr: false });

const CLOSE_AUX_EVENT = "oneboarding:close-aux-buttons";

export default function RightAuthButtons() {
  const [showMini, setShowMini] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [session, setSession] = useState<{ authenticated: boolean } | null>(null);

  const miniRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const guardUntilTsRef = useRef<number>(0); // ignore outside-clicks jusqu’à ce timestamp

  // peindre la clé si session active
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => setSession(j))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  // fermeture si un autre composant “aux” demande à se fermer
  useEffect(() => {
    const close = () => setShowMini(false);
    window.addEventListener(CLOSE_AUX_EVENT, close as EventListener);
    return () => window.removeEventListener(CLOSE_AUX_EVENT, close as EventListener);
  }, []);

  // outside click — activé 120ms après ouverture pour éviter le fantôme du premier tap
  useEffect(() => {
    if (!showMini) return;

    const onOutside = (e: MouseEvent | PointerEvent | TouchEvent) => {
      const now = Date.now();
      if (now < guardUntilTsRef.current) return;

      const target = e.target as Node | null;
      if (!target) return;

      // si on tape le déclencheur (le +), ne pas fermer
      if (triggerRef.current && triggerRef.current.contains(target)) return;

      // si on tape à l’intérieur du chip, ne pas fermer
      if (miniRef.current && miniRef.current.contains(target)) return;

      setShowMini(false);
    };

    // activer le parapluie 120ms
    guardUntilTsRef.current = Date.now() + 120;

    document.addEventListener("pointerdown", onOutside, { passive: true });
    document.addEventListener("click", onOutside, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("click", onOutside);
    };
  }, [showMini]);

  const baseBtn =
    "h-12 w-12 rounded-xl border text-xl grid place-items-center transition";
  const plusBtn =
    `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;
  const keyBtn = session?.authenticated
    ? `${baseBtn} bg-blue-600/90 border-blue-600 text-white`
    : `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;

  function toggleMini() {
    try {
      window.dispatchEvent(new CustomEvent(CLOSE_AUX_EVENT));
    } catch {}
    // on ouvre/ferme le chip
    setShowMini((v) => {
      const next = !v;
      if (next) {
        // remet un parapluie à l’ouverture (au cas où)
        guardUntilTsRef.current = Date.now() + 120;
      }
      return next;
    });
  }

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-3">
          {/* ➕ */}
          <button
            ref={triggerRef}
            aria-label={isActive ? "Espace actif" : "Créer mon espace"}
            title={isActive ? "Espace OneBoarding AI actif" : "Créer mon espace"}
            className={plusBtn}
            onClick={toggleMini}
          >
            {isActive ? "✅" : "➕"}
          </button>

          {/* 🔑 */}
          <button
            aria-label={session?.authenticated ? "Se déconnecter" : "Accéder à mon espace"}
            title={session?.authenticated ? "Se déconnecter" : "Accéder à mon espace"}
            className={keyBtn}
            onClick={async () => {
              if (session?.authenticated) {
                await fetch("/api/auth/session", { method: "DELETE" });
                setSession({ authenticated: false });
              } else {
                try { window.dispatchEvent(new CustomEvent(CLOSE_AUX_EVENT)); } catch {}
                setShowLogin(true);
              }
            }}
          >
            🔑
          </button>
        </div>

        {/* Chip “Créer mon espace” */}
        {showMini && (
          <div
            ref={miniRef}
            className="absolute right-0 top-[56px] z-[20] animate-[fadeUp_0.18s_ease-out_both]"
          >
            <button
              // BLOQUER toute propagation pour ne pas déclencher l’outside-click
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                // ouvrir la modale
                setShowSubscribe(true);
                // fermer le chip juste après (frame suivante)
                setTimeout(() => setShowMini(false), 60);
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
        // Dé-commente si tu veux basculer ➕ → ✅ automatiquement après succès :
        // onCreated={() => { setIsActive(true); setSession({ authenticated: true }); }}
      />

      <LoginModal
        open={showLogin}
        onClose={() => {
          setShowLogin(false);
          fetch("/api/auth/session")
            .then((r) => r.json())
            .then((j) => setSession(j))
            .catch(() => {});
        }}
      />
    </>
  );
}
