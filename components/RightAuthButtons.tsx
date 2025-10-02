"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// on garde SubscribeModal (abonnement via PayPal)
const SubscribeModal = dynamic(() => import("@/components/SubscribeModal"), {
  ssr: false,
});
const LoginModal = dynamic(() => import("@/components/LoginModal"), {
  ssr: false,
});

export default function RightAuthButtons() {
  const [showMini, setShowMini] = useState(false);      // petit bouton “Créer mon espace”
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isActive, setIsActive] = useState(false);      // ➕ → ✅ après création
  const [session, setSession] = useState<{ authenticated: boolean } | null>(null);
  const miniRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => setSession(j))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  // fermer le mini-menu au clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!miniRef.current) return;
      if (!miniRef.current.contains(e.target as Node)) setShowMini(false);
    };
    if (showMini) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showMini]);

  const baseBtn =
    "h-12 w-12 rounded-xl border text-xl grid place-items-center transition";
  const plusBtn = `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;
  const keyBtn =
    session?.authenticated
      ? `${baseBtn} bg-blue-600/90 border-blue-600 text-white`
      : `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-3">
          {/* ➕ (ouvre un mini-bouton clair) */}
          <button
            aria-label={isActive ? "Espace actif" : "Créer mon espace"}
            title={isActive ? "Espace OneBoarding AI actif" : "Créer mon espace"}
            className={plusBtn}
            onClick={() => setShowMini((v) => !v)}
          >
            {isActive ? "✅" : "➕"}
          </button>

          {/* 🔑 login / logout */}
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

        {/* Mini-bouton “Créer mon espace” (style clair, identique au chip “Charger 1 fichier”) */}
        {showMini && (
          <div ref={miniRef} className="absolute left-0 top-[56px] z-[20]">
            <button
              onClick={() => {
                setShowMini(false);
                setShowSubscribe(true);
              }}
              className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] text-[var(--fg)] font-medium shadow-sm active:scale-[0.99] transition"
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
        // quand abonnement validé → état actif + session “auth”
        // (on pourra affiner après intégration PayPal)
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
