// components/RightAuthButtons.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Modales (lazy)
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

  // Session (peindre la clé)
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => setSession(j))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  // Fermer au clic extérieur — version mobile-safe
  useEffect(() => {
    if (!showMini) return;
    const onOutside = (e: PointerEvent) => {
      if (!miniRef.current) return;
      if (!miniRef.current.contains(e.target as Node)) setShowMini(false);
    };
    // pointerdown capte les interactions tactiles + souris
    document.addEventListener("pointerdown", onOutside, { passive: true });
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [showMini]);

  // Fermer si un autre composant demande la fermeture
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

  function toggleMini() {
    try {
      window.dispatchEvent(new CustomEvent(CLOSE_AUX_EVENT));
    } catch {}
    setShowMini((v) => !v);
  }

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-3">
          {/* ➕ */}
          <button
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
              // IMPORTANT: empêcher la fermeture extérieure avant onClick sur mobile
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                // 1) ouvrir la modale
                setShowSubscribe(true);
                // 2) fermer le chip un poil plus tard (évite les “ghost clicks”)
                setTimeout(() => setShowMini(false), 80);
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
        // Tu peux passer un onCreated si tu veux basculer ➕ → ✅ et peindre la clé :
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
