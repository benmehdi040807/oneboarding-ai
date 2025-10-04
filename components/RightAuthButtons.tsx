"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SubscribeModal from "./SubscribeModal";

/* ========= Mini-bannière “Actif” au-dessus de la barre =========
   Objectif “natif” :
   - Moins d’observateurs : un ResizeObserver sur la barre + resize/scroll.
   - Pas de MutationObserver (bruit inutile / perf).
   - ARIA propre (role="status") et pointer-events: none (aucune interférence).
*/
function WelcomeBannerOverBar() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  // Spécs validées
  const BANNER_H = 27;
  const GAP_Y = 6;

  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;

  // pour info : on évite de dépendre d’un bouton “OK” fragile
  const recompute = () => {
    const bar = getBarEl();
    if (!bar) return setPos(null);

    const rect = bar.getBoundingClientRect();
    const width = Math.max(180, rect.width);
    const top = Math.max(8, rect.top - GAP_Y - BANNER_H);
    const left = rect.left;

    setPos({ left, top, width });
  };

  const loadProfileState = () => {
    try {
      const p = localStorage.getItem("ob_profile");
      const prof = p ? JSON.parse(p) : null;
      setFirstName(prof?.firstName ?? null);
      setActive(localStorage.getItem("ob_connected") === "1");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    // hôte du portail
    const host = document.createElement("div");
    document.body.appendChild(host);
    hostRef.current = host;
    setMounted(true);

    // état initial
    loadProfileState();
    // position initiale (après paint)
    requestAnimationFrame(recompute);

    // écoute changements “connexions / profil”
    const onChange = () => {
      loadProfileState();
      recompute();
    };
    window.addEventListener("ob:connected-changed", onChange);
    window.addEventListener("ob:profile-changed", onChange);

    // observer la barre uniquement (plus simple et plus natif)
    const bar = getBarEl();
    const ro = new ResizeObserver(recompute);
    if (bar) ro.observe(bar);

    // resize/scroll de la fenêtre
    window.addEventListener("resize", recompute, { passive: true });
    window.addEventListener("scroll", recompute, { passive: true });

    return () => {
      window.removeEventListener("ob:connected-changed", onChange);
      window.removeEventListener("ob:profile-changed", onChange);
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute);
      ro.disconnect();
      host.remove();
    };
  }, []);

  if (!mounted || !hostRef.current || !active || !firstName || !pos) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        width: pos.width,
        height: BANNER_H,
        zIndex: 2147483390, // au-dessus de la barre, sous les “vrais” modals
        pointerEvents: "none",
        borderRadius: 12,
        background: "rgba(17,24,39,0.12)",
        boxShadow: "0 10px 24px rgba(0,0,0,.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 12,
        paddingRight: 12,
        backdropFilter: "blur(2px)",
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
    </div>,
    hostRef.current
  );
}

/* ======================== Boutons de droite ======================== */
export default function RightAuthButtons() {
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [connected, setConnected] = useState(false);

  // État connexion (natif = simple localStorage + custom event)
  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  // Skin identique aux boutons gauche
  const circle =
    "h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] " +
    "hover:bg-[var(--chip-hover)] grid place-items-center transition select-none";

  // Bleu = ouverture fiche d’inscription (le <dialog> natif est géré dans SubscribeModal)
  const onBlueClick = () => setOpenSubscribe(true);

  // Doré = (dé)connexion uniquement (comportement clair, sans incitation)
  const onGoldClick = () => {
    const hasProfile = !!localStorage.getItem("ob_profile");
    if (connected) {
      localStorage.setItem("ob_connected", "0");
      window.dispatchEvent(new Event("ob:connected-changed"));
    } else if (hasProfile) {
      localStorage.setItem("ob_connected", "1");
      window.dispatchEvent(new Event("ob:connected-changed"));
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-3">
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={onBlueClick}
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

        <button
          type="button"
          aria-label={connected ? "Se déconnecter" : "Se connecter"}
          className={circle}
          onClick={onGoldClick}
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

      {/* Bannière légère, sans interférence */}
      <WelcomeBannerOverBar />

      {/* Modal d’inscription (utilise <dialog> natif dans SubscribeModal) */}
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
}
