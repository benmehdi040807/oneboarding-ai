"use client";
import React, { useEffect, useState } from "react";
import LoginModal from "@/components/LoginModal";
import CreateSpaceModal from "@/components/CreateSpaceModal";

export default function RightAuthButtons() {
  const [showCreate, setShowCreate] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isActive, setIsActive] = useState(false); // ➕ → ✅ après création
  const [session, setSession] = useState<{ authenticated: boolean } | null>(null);

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

  return (
    <>
      <div className="flex items-center gap-3">
        {/* ➕ (devient ✅ après création) */}
        <button
          aria-label={isActive ? "Espace actif" : "Créer mon espace"}
          title={isActive ? "Espace OneBoarding AI actif" : "Créer mon espace"}
          className={plusBtn}
          onClick={() => setShowCreate(true)}
        >
          {isActive ? "✅" : "➕"}
        </button>

        {/* 🔑 se connecte / se déconnecte */}
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
      <CreateSpaceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          setIsActive(true);
          setSession({ authenticated: true });
        }}
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
