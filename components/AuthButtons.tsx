// components/AuthButtons.tsx
import React, { useEffect, useState } from "react";
import CreateSpaceModal from "./CreateSpaceModal";
import LoginModal from "./LoginModal";

export default function AuthButtons() {
  const [showCreate, setShowCreate] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isActive, setIsActive] = useState(false); // ➕ -> ✅ après création
  const [session, setSession] = useState<{ authenticated: boolean; user?: any } | null>(null);

  useEffect(() => {
    // récupère l’état de session pour colorer la clé en bleu
    fetch("/api/auth/session")
      .then(r => r.json())
      .then((j) => setSession(j))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  const iconBtn =
    "w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-xl";

  const keyBtn =
    "w-14 h-14 rounded-2xl flex items-center justify-center border text-xl " +
    (session?.authenticated ? "bg-blue-600/90 border-blue-600 text-white" : "bg-white/5 border-white/10");

  return (
    <>
      {/* Rangée miroir : gauche (📎🎤) — droite (➕/✅ 🔑) */}
      <div className="flex items-center gap-3 mt-3 w-full">
        <div className="flex items-center gap-3">
          <button aria-label="Joindre un fichier" className={iconBtn}>📎</button>
          <button aria-label="Micro" className={iconBtn}>🎤</button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            aria-label={isActive ? "Espace actif" : "Créer mon espace"}
            className={iconBtn}
            onClick={() => setShowCreate(true)}
            title={isActive ? "Espace OneBoarding AI actif" : "Créer mon espace"}
          >
            {isActive ? "✅" : "➕"}
          </button>

          <button
            aria-label="Accéder à mon espace"
            className={keyBtn}
            onClick={async () => {
              if (session?.authenticated) {
                // déconnexion sur le même bouton
                await fetch("/api/auth/session", { method: "DELETE" });
                setSession({ authenticated: false });
                return;
              }
              setShowLogin(true);
            }}
            title={session?.authenticated ? "Se déconnecter" : "Accéder à mon espace"}
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
          setIsActive(true);          // ➕ -> ✅
          setSession({ authenticated: true }); // clé bleue
        }}
      />
      <LoginModal
        open={showLogin}
        onClose={() => {
          setShowLogin(false);
          // on tente un refresh de session pour peindre la clé en bleu si login OK
          fetch("/api/auth/session").then(r => r.json()).then(j => setSession(j)).catch(() => {});
        }}
      />
    </>
  );
}
