// components/AuthButtons.tsx
import React, { useState } from "react";
import CreateSpaceModal from "./CreateSpaceModal";
import LoginModal from "./LoginModal";

export default function AuthButtons() {
  const [showCreate, setShowCreate] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isActive, setIsActive] = useState(false); // passe à true après création réussie

  const iconBtn =
    "w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-xl";

  return (
    <>
      <div className="flex items-center gap-3 mt-3">
        {/* Gauche : pièces jointes + micro (inchangés) */}
        <button aria-label="Joindre un fichier" className={iconBtn}>📎</button>
        <button aria-label="Micro" className={iconBtn}>🎤</button>

        {/* Droite : aligné à droite */}
        <div className="ml-auto flex items-center gap-3">
          {/* ➕ (devient ✅ quand espace actif) */}
          <button
            aria-label="Créer mon espace"
            className={iconBtn}
            onClick={() => setShowCreate(true)}
            title={isActive ? "Espace actif" : "Créer mon espace"}
          >
            {isActive ? "✅" : "➕"}
          </button>

          {/* 🔑 Accéder à mon espace (le plus utilisé) */}
          <button
            aria-label="Accéder à mon espace"
            className={iconBtn}
            onClick={() => setShowLogin(true)}
            title="Accéder à mon espace"
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
        }}
      />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
