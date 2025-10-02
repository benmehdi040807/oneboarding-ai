"use client";
import React, { useEffect, useState } from "react";
import LoginModal from "@/components/LoginModal";
import SubscribeModal from "@/components/SubscribeModal";

export default function RightAuthButtons() {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [session, setSession] = useState<{ authenticated: boolean } | null>(null);

  // Récupère l’état d’auth pour styler la clé/plus
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => setSession(j))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  const baseBtn =
    "h-12 w-12 rounded-xl border text-xl grid place-items-center transition";
  const plusBtn = `${baseBtn} border-white/10 bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;
  const keyBtn =
    session?.authenticated
      ? `${baseBtn} bg-blue-600/90 border-blue-600 text-white`
      : `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;

  const isActive = !!session?.authenticated;

  return (
    <>
      <div className="flex items-center gap-3">
        {/* ➕ (devient ✅ si espace actif) */}
        <button
          aria-label={isActive ? "Espace actif" : "Créer/activer mon espace"}
          title={isActive ? "Espace OneBoarding AI actif" : "Créer/activer mon espace"}
          className={plusBtn}
          onClick={() => setShowSubscribe(true)}
        >
          {isActive ? "✅" : "➕"}
        </button>

        {/* 🔑 accès / déconnexion */}
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

      {/* Modale d’activation/abonnement (PayPal côté serveur) */}
      <SubscribeModal
        open={showSubscribe}
        onClose={() => {
          setShowSubscribe(false);
          // Au cas où l’utilisateur revient déjà authentifié (après paiement),
          // on rafraîchit l’état pour colorer la clé en bleu.
          fetch("/api/auth/session")
            .then((r) => r.json())
            .then((j) => setSession(j))
            .catch(() => {});
        }}
      />

      {/* Modale de login OTP */}
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
