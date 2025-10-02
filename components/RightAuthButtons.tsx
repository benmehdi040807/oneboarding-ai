"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const SubscribeModal = dynamic(() => import("@/components/SubscribeModal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/LoginModal"), { ssr: false });

export default function RightAuthButtons() {
  const [chipOpen, setChipOpen] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [session, setSession] = useState<{ authenticated: boolean } | null>(null);

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
      {/* conteneur à droite */}
      <div className="relative flex items-center gap-3">
        {/* bouton + */}
        <div className="relative">
          <button
            aria-label={isActive ? "Espace actif" : "Créer mon espace"}
            title={isActive ? "Espace OneBoarding AI actif" : "Créer mon espace"}
            className={plusBtn}
            onClick={() => setChipOpen((v) => !v)}
          >
            {isActive ? "✅" : "➕"}
          </button>

          {/* chip ABSOLU : ne pousse plus rien dans la mise en page */}
          {chipOpen && (
            <button
              className="absolute right-0 mt-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] text-[var(--fg)] font-medium shadow-sm active:scale-[0.99] transition whitespace-nowrap"
              onClick={() => {
                setShowSubscribe(true);
                // garder le chip visible après l’ouverture ? commente la ligne suivante
                setChipOpen(false);
              }}
            >
              Créer mon espace
            </button>
          )}
        </div>

        {/* bouton clé */}
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

      {/* Modales */}
      <SubscribeModal
        open={showSubscribe}
        onClose={() => setShowSubscribe(false)}
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
