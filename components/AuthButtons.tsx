// components/AuthButtons.tsx
import React, { useState, useEffect } from "react";
import CreateSpaceModal from "./CreateSpaceModal";
import LoginModal from "./LoginModal";

export default function AuthButtons() {
  const [showCreate, setShowCreate] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isActive, setIsActive] = useState(false); // passe à true après création réussie
  const [isLoggedIn, setIsLoggedIn] = useState(false); // état session backend

  const iconBtn =
    "w-14 h-14 rounded-2xl flex items-center justify-center border text-xl transition";

  // Vérifie session au montage
  useEffect(() => {
    async function checkSession() {
      try {
        const r = await fetch("/api/auth/session");
        const data = await r.json();
        setIsLoggedIn(data.authenticated);
      } catch (e) {
        console.error("Session check failed", e);
      }
    }
    checkSession();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    setIsLoggedIn(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 mt-3">
        {/* Gauche : pièces jointes + micro */}
        <button
          aria-label="Joindre un fichier"
          className={`${iconBtn} bg-white/5 border-white/10`}
        >
          📎
        </button>
        <button
          aria-label="Micro"
          className={`${iconBtn} bg-white/5 border-white/10`}
        >
          🎤
        </button>

        {/* Droite : aligné à droite */}
        <div className="ml-auto flex items-center gap-3">
          {/* ➕ (devient ✅ quand espace actif) */}
          <button
            aria-label="Créer mon espace"
            className={`${iconBtn} bg-white/5 border-white/10`}
            onClick={() => setShowCreate(true)}
            title={isActive ? "Espace actif" : "Créer mon espace"}
          >
            {isActive ? "✅" : "➕"}
          </button>

          {/* 🔑 Accéder / Déconnecter */}
          <button
            aria-label="Accéder à mon espace"
            className={`${iconBtn} ${
              isLoggedIn
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/40"
                : "bg-white/5 border-white/10"
            }`}
            onClick={async () => {
              if (isLoggedIn) {
                await handleLogout();
              } else {
                setShowLogin(true);
              }
            }}
            title={isLoggedIn ? "Déconnexion" : "Accéder à mon espace"}
          >
            🔑
          </button>
        </div>
      </div>

      {/* Modales */}
      <CreateSpaceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          setIsActive(true); // bascule ➕ -> ✅
          setIsLoggedIn(true); // active session
        }}
      />
      <LoginModal
        open={showLogin}
        onClose={() => {
          setShowLogin(false);
          setIsLoggedIn(true); // après login OTP réussi
        }}
      />
    </>
  );
}
