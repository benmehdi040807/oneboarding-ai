"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SubscribeModal from "./SubscribeModal";

/* ========= Mini-bannière “Actif” au-dessus de la barre ========= */
function WelcomeBannerOverBar() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false); // ← masque la bannière si un modal est ouvert

  const BANNER_H = 27;
  const GAP_Y = 6;

  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;

  const getOkEl = () => {
    const btns = Array.from(document.querySelectorAll("button"));
    return (
      (btns.find((b) => (b.textContent || "").trim() === "OK") as HTMLElement) ||
      (btns.find((b) => (b.getAttribute("aria-label") || "").toLowerCase() === "ok") as HTMLElement) ||
      null
    );
  };

  const recompute = () => {
    const bar = getBarEl();
    if (!bar) return setPos(null);
    const rect = bar.getBoundingClientRect();
    const ok = getOkEl();
    const rightEdge = ok ? ok.getBoundingClientRect().right : rect.right;
    const width = Math.max(180, rightEdge - rect.left);
    const top = Math.max(8, rect.top - GAP_Y - BANNER_H);
    const left = rect.left;
    setPos({ left, top, width });
  };

  const checkModalOpen = () => {
    // Détecte tous les types de modals/overlays “natifs” ou maison
    const any =
      document.querySelector(
        '[aria-modal="true"],[role="dialog"],dialog[open],.modal,.sheet,.legal-modal,.legal-sheet'
      ) !== null;
    setModalOpen(any);
  };

  const loadProfileState = () => {
    try {
      const p = localStorage.getItem("ob_profile");
      const prof = p ? JSON.parse(p) : null;
      setFirstName(prof?.firstName ?? null);
      setActive(localStorage.getItem("ob_connected") === "1");
    } catch {}
  };

  useEffect(() => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    hostRef.current = host;
    setMounted(true);

    loadProfileState();
    recompute();
    checkModalOpen();
    setTimeout(recompute, 60);
    setTimeout(recompute, 240);

    const onChange = () => { loadProfileState(); recompute(); };
    window.addEventListener("ob:connected-changed", onChange);
    window.addEventListener("ob:profile-changed", onChange);

    const ro = new ResizeObserver(recompute);
    const bar = getBarEl();
    if (bar) ro.observe(bar);

    window.addEventListener("resize", recompute, { passive: true });
    window.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("load", () => { recompute(); checkModalOpen(); }, { once: true });

    // Observe le DOM pour savoir si un modal s’ouvre/se ferme
    const mo = new MutationObserver(() => {
      recompute();
      checkModalOpen();
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "style", "class", "aria-modal", "role"] });

    return () => {
      window.removeEventListener("ob:connected-changed", onChange);
      window.removeEventListener("ob:profile-changed", onChange);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute);
      host.remove();
    };
  }, []);

  // Ne rien afficher si : pas monté / pas de profil actif / pas de position / un modal est ouvert
  if (!mounted || !hostRef.current || !active || !firstName || !pos || modalOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        width: pos.width,
        height: BANNER_H,
        // ↓↓↓ Z-INDEX ABAISSÉ pour passer SOUS les modals légaux/subscribe
        zIndex: 900, // (les modals sont > 1000)
        pointerEvents: "none",
        borderRadius: 12,
        background: "rgba(17,24,39,0.12)",
        boxShadow: "0 10px 24px rgba(0,0,0,.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 12,
        paddingRight: 12,
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

  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  // même skin que les boutons gauche — conteneur inline-flex
  const circle =
    "h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] " +
    "hover:bg-[var(--chip-hover)] grid place-items-center transition select-none";

  const onBlueClick = () => setOpenSubscribe(true);

  // Doré => (dé)connexion uniquement
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

      <WelcomeBannerOverBar />
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
}
