// components/RightAuthButtons.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const SubscribeModal = dynamic(() => import("@/components/SubscribeModal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/LoginModal"), { ssr: false });

export default function RightAuthButtons() {
  const [showCreateChip, setShowCreateChip] = useState(false);
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

  const baseBtn =
    "h-12 w-12 rounded-xl border text-xl grid place-items-center transition";
  const iconBg = "bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] border-[var(--border)]";

  const plusBtn = `${baseBtn} ${iconBg}`;
  const keyBtn = session?.authenticated
    ? `${baseBtn} bg-blue-600/90 border-blue-600 text-white`
    : `${baseBtn} ${iconBg}`;

  return (
    <>
      {/* Rangée des icônes de droite */}
      <div className="relative flex items-center gap-3">
        {/* + */}
        <button
          ref={plusRef}
          aria-label={isActive ? "Espace actif" : "Créer mon espace"}
          title={isActive ? "Espace OneBoarding AI actif" : "Créer mon espace"}
          className={plusBtn}
          onClick={() => setShowCreateChip((v) => !v)}
        >
          {isActive ? "✅" : "➕"}
        </button>

        {/* clé */}
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

      {/* Chip « Créer mon espace » (persiste, ne disparaît pas en cliquant ailleurs) */}
      {showCreateChip && (
        <div className="mt-3 flex justify-end">
          <button
            className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] text-[var(--fg)] font-medium shadow-sm active:scale-[0.99] transition whitespace-nowrap"
            onClick={() => {
              setShowSubscribe(true);
              // si tu préfères qu’il reste visible après l’ouverture de la modale, commente la ligne suivante :
              setShowCreateChip(false);
            }}
          >
            Créer mon espace
          </button>
        </div>
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
