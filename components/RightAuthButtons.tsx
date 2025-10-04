"use client";

import { useEffect, useState } from "react";
import SubscribeModal from "./SubscribeModal";
import CodeAccessDialog from "./CodeAccessDialog"; // fichier à créer à l'étape 2

export default function RightAuthButtons() {
  const [connected, setConnected] = useState(false);
  const [openSub, setOpenSub] = useState(false);
  const [openCode, setOpenCode] = useState(false);

  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  const circle =
    "h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] " +
    "hover:bg-[var(--chip-hover)] grid place-items-center transition select-none";

  function logout() {
    localStorage.removeItem("ob_connected");
    localStorage.removeItem("ob_token");
    window.dispatchEvent(new Event("ob:connected-changed"));
  }

  return (
    <>
      <div className="inline-flex items-center gap-3">
        {/* O bleu — Créer mon espace */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSub(true)}
          className={circle}
          title="Créer mon espace"
        >
          <span
            className="text-xl font-extrabold"
            style={{
              lineHeight: 1,
              background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            O
          </span>
        </button>

        {/* O doré — Se connecter / Se déconnecter */}
        {!connected ? (
          <button
            type="button"
            aria-label="Se connecter"
            className={circle}
            onClick={() => setOpenCode(true)}
            title="Se connecter"
          >
            <span
              className="text-xl font-extrabold"
              style={{
                lineHeight: 1,
                background: "linear-gradient(90deg,#FFD451,#EABE3F,#D9D1C0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              O
            </span>
          </button>
        ) : (
          <button
            type="button"
            aria-label="Se déconnecter"
            className={circle}
            onClick={logout}
            title="Se déconnecter"
          >
            <span
              className="text-xl font-extrabold"
              style={{
                lineHeight: 1,
                background: "linear-gradient(90deg,#FFD451,#EABE3F,#D9D1C0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              O
            </span>
          </button>
        )}
      </div>

      {/* Modals */}
      <SubscribeModal open={openSub} onClose={() => setOpenSub(false)} />
      <CodeAccessDialog open={openCode} onClose={() => setOpenCode(false)} />
    </>
  );
}
