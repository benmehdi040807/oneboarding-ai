"use client";
import React, { useEffect, useState } from "react";
import LoginModal from "@/components/LoginModal";
import CreateSpaceModal from "@/components/CreateSpaceModal";
import PaywallModal from "@/components/PaywallModal";

export default function RightAuthButtons() {
  const [showCreate, setShowCreate] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPaywall, setShowPaywall] = useState<{
    open: boolean; firstName?: string;
  }>({ open: false });

  const [session, setSession] = useState<{ authenticated: boolean } | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => {
        setSession(j);
        setIsActive(Boolean(j?.authenticated));
      })
      .catch(() => setSession({ authenticated: false }));
  }, []);

  const baseBtn =
    "h-12 w-12 rounded-xl border text-xl grid place-items-center transition";
  const createBtn = `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;
  const keyBtn =
    session?.authenticated
      ? `${baseBtn} bg-blue-600/90 border-blue-600 text-white`
      : `${baseBtn} border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]`;

  return (
    <>
      <div className="flex items-center gap-3">
        {/* ➕ = créer mon espace (direct) */}
        <button
          aria-label={isActive ? "Espace actif" : "Créer mon espace"}
          title={isActive ? "Espace OneBoarding AI actif" : "Créer mon espace"}
          className={createBtn}
          onClick={() => setShowCreate(true)}
        >
          {isActive ? "✅" : "➕"}
        </button>

        {/* 🔑 = accéder (ou se déconnecter si déjà connecté) */}
        <button
          aria-label={session?.authenticated ? "Se déconnecter" : "Accéder à mon espace"}
          title={session?.authenticated ? "Se déconnecter" : "Accéder à mon espace"}
          className={keyBtn}
          onClick={async () => {
            if (session?.authenticated) {
              await fetch("/api/auth/session", { method: "DELETE" });
              setSession({ authenticated: false });
              setIsActive(false);
              return;
            }
            setShowLogin(true);
          }}
        >
          🔑
        </button>
      </div>

      {/* Modale création */}
      <CreateSpaceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(firstName?: string) => {
          // L’OTP part → on bascule sur “Bienvenue + abonnement”
          setShowCreate(false);
          setIsActive(true);
          setSession({ authenticated: true }); // optimistic
          setShowPaywall({ open: true, firstName });
        }}
      />

      {/* Modale accès */}
      <LoginModal
        open={showLogin}
        onClose={() => {
          setShowLogin(false);
          // On tente de rafraîchir l’état
          fetch("/api/auth/session")
            .then((r) => r.json())
            .then((j) => {
              setSession(j);
              setIsActive(Boolean(j?.authenticated));
            })
            .catch(() => {});
        }}
      />

      {/* Paywall doux */}
      <PaywallModal
        open={showPaywall.open}
        firstName={showPaywall.firstName}
        onClose={() => setShowPaywall({ open: false })}
        onSubscribe={() => {
          // TODO: ouvre ton flux de paiement
          alert("Démarrage du parcours de paiement…");
        }}
      />
    </>
  );
}
