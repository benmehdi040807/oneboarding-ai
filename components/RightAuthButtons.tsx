// components/RightAuthButtons.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const SubscribeModal = dynamic(() => import("@/components/SubscribeModal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/LoginModal"), { ssr: false });

export default function RightAuthButtons() {
  const [chipOpen, setChipOpen] = useState(false);
  const [chipPos, setChipPos] = useState<{ top: number; left: number } | null>(null);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [session, setSession] = useState<{ authenticated: boolean } | null>(null);

  const plusRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => setSession(j))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  // ouvre/ferme le chip et calcule la position (ancré au bouton +)
  function toggleChip() {
    if (chipOpen) {
      setChipOpen(false);
      return;
    }
    // calcule la position écran du bouton +
    const el = plusRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      // on place le chip à droite/juste sous le +
      setChipPos({ top: r.bottom + 8, left: r.right });
    }
    setChipOpen(true);
  }

  const baseBtn =
    "h-12 w-12 rounded-xl border text-xl grid place-items-center transition";
  const plusBtn =
    `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;
  const keyBtn = session?.authenticated
    ? `${baseBtn} bg-blue-600/90 border-blue-600 text-white`
    : `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-3">
          <button
            ref={plusRef}
            aria-label={isActive ? "Espace actif" : "Créer mon espace"}
            title={isActive ? "Espace OneBoarding AI actif" : "Créer mon espace"}
            className={plusBtn}
            onClick={toggleChip}
          >
            {isActive ? "✅" : "➕"}
          </button>

          <button
            aria-label={session?.authenticated ? "Se déconnecter" : "Accéder à mon espace"}
            title={session?.authenticated ? "Se déconnecter" : "Accéder à mon espace"}
            className={keyBtn}
            onClick={async () => {
              if (session?.authenticated) {
                await fetch("/api/auth/session", { method: "DELETE" });
                setSession({ authenticated: false });
                return;
              }
              setShowLogin(true);
            }}
          >
            🔑
          </button>
        </div>
      </div>

      {/* Overlay plein écran TRANSPARENT pour capter les clics extérieurs */}
      {chipOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-transparent"
            onClick={() => setChipOpen(false)}
          />
          {/* Chip positionné en fixed près du + (ne ferme pas quand on clique dessus) */}
          <div
            className="fixed z-[61]"
            style={{
              top: (chipPos?.top ?? 80),
              left: (chipPos?.left ?? 80),
              transform: "translateX(-100%)" // aligne le bord droit du chip avec le bord droit du +
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSubscribe(true);
                setChipOpen(false);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] text-[var(--fg)] font-medium shadow-sm active:scale-[0.99] transition whitespace-nowrap"
            >
              Créer mon espace
            </button>
          </div>
        </>
      )}

      {/* Modales */}
      <SubscribeModal
        open={showSubscribe}
        onClose={() => setShowSubscribe(false)}
        // Si tu veux peindre ✅ + clé bleue après succès :
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
