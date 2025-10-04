"use client";

import { useEffect, useState } from "react";
import SubscribeModal from "./SubscribeModal";

/** ----------------- Bannière immersive type « mini barre » ----------------- */
/* On garde la bannière telle quelle (portalisée dans l’implémentation d’origine).
   Si jamais elle passait derrière chez toi, on la revisitera, mais les BOUTONS,
   eux, ne sont plus portalisés -> ils suivent la mise en page. */
function WelcomeBannerOverBar() {
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    const load = () => {
      const p = typeof window !== "undefined" ? localStorage.getItem("ob_profile") : null;
      const prof = p ? JSON.parse(p) : null;
      setFirstName(prof?.firstName ?? null);
      setActive(localStorage.getItem("ob_connected") === "1");
    };
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  if (!mounted || !active || !firstName) return null;

  return (
    <div
      /* On laisse la bannière en flux normal (plus de positionnement complexe).
         Elle se place juste au-dessus via ta structure de page. */
      className="w-full max-w-md mx-auto -mb-1.5"
    >
      <div
        className="h-[27px] flex items-center justify-center px-3 rounded-[12px]"
        style={{
          background: "rgba(17,24,39,0.12)",
          boxShadow: "0 10px 24px rgba(0,0,0,.14)",
        }}
      >
        <div className="truncate text-center text-[12px] sm:text-[13px] text-white font-medium">
          {"Bonjour\u00A0" + firstName}
          {"\u00A0\u25CB\u00A0"}
          <span className="font-semibold">Espace</span>
          {"\u00A0désormais :\u00A0"}
          <span
            className="font-extrabold"
            style={{
              background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Actif
          </span>
        </div>
      </div>
    </div>
  );
}

/** -------- Capsule flottante « erreur / créer un espace » --------
 * Version hyper simple : un mini-modal centré bas, avec un X (via bouton close)
 * et UN SEUL bouton d’action « Créer mon espace ». Pas de z-index custom.
 */
function ErrorCapsule({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      /* Overlay simple, pas de z-index custom */
      className="fixed inset-0 bg-black/25 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full sm:max-w-md rounded-3xl border border-white/60 bg-[rgba(255,255,255,0.32)] backdrop-blur-2xl shadow-xl p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* X en haut droite (universel) */}
        <button
          aria-label="Fermer"
          onClick={onClose}
          className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/85 hover:bg-white text-black/80 flex items-center justify-center text-lg"
        >
          ×
        </button>

        <div className="text-center text-black/85">
          {/* 2 lignes max, propres */}
          <div className="font-semibold mb-1">Aucun espace trouvé sur cet appareil</div>
          <div className="opacity-80 mb-4">
            Pour continuer, crée ton espace avec le <span className="font-semibold">O bleu</span>.
          </div>

          {/* Un seul bouton d’action */}
          <button
            onClick={onCreate}
            className="px-4 py-2.5 rounded-xl text-white font-medium shadow hover:opacity-95 active:scale-[.99] transition
                       bg-[linear-gradient(135deg,#4F8AF9,#2E6CF5)]"
          >
            Créer mon espace
          </button>
        </div>
      </div>
    </div>
  );
}

/** ------------------------- Boutons droits (INLINE) ------------------------ */
export default function RightAuthButtons() {
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [connected, setConnected] = useState(false);

  // état connecté (pour la couleur du “O”)
  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  const circle =
    "h-12 w-12 rounded-xl border grid place-items-center transition " +
    "border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] " +
    "select-none shadow";

  const onGoldClick = () => {
    if (connected) {
      localStorage.setItem("ob_connected", "0");
      window.dispatchEvent(new Event("ob:connected-changed"));
    } else {
      const p = localStorage.getItem("ob_profile");
      if (p) {
        localStorage.setItem("ob_connected", "1");
        window.dispatchEvent(new Event("ob:connected-changed"));
      } else {
        setOpenError(true);
      }
    }
  };

  return (
    <>
      {/* bannière (version en flux) au-dessus de la barre */}
      <WelcomeBannerOverBar />

      {/* BOUTONS INLINE : même look & classes que les deux à gauche */}
      <div className="flex items-center gap-3">
        {/* Création d’espace (O dégradé bleu→turquoise) */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
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

        {/* Connexion / Déconnexion (O doré dégradé doux) */}
        <button
          type="button"
          aria-label={connected ? "Se déconnecter" : "Se connecter"}
          onClick={onGoldClick}
          className={circle}
          title={connected ? "Se déconnecter" : "Se connecter"}
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
      </div>

      {/* Capsule d’erreur (X + 1 seul bouton) */}
      <ErrorCapsule
        open={openError}
        onClose={() => setOpenError(false)}
        onCreate={() => {
          setOpenError(false);
          setOpenSubscribe(true);
        }}
      />

      {/* Modal de création d’espace */}
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
}
