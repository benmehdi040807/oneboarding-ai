"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SubscribeModal from "./SubscribeModal";

/* ================= Bannière « mini barre » au-dessus de la barre ================= */
function WelcomeBannerOverBar() {
  const portalHost = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const BANNER_H = 27; // px validé
  const GAP_Y = 6;     // px validé

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

    const barRect = bar.getBoundingClientRect();
    const ok = getOkEl();
    const rightEdge = ok ? ok.getBoundingClientRect().right : barRect.right;

    const width = Math.max(180, rightEdge - barRect.left);
    const top = Math.max(8, barRect.top - GAP_Y - BANNER_H);
    const left = barRect.left;
    setPos({ left, top, width });
  };

  useEffect(() => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    portalHost.current = host;
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
    window.addEventListener("ob:profile-changed", onChange);

    const ro = new ResizeObserver(recompute);
    const bar = getBarEl();
    if (bar) ro.observe(bar);

    window.addEventListener("resize", recompute, { passive: true });
    window.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("load", recompute, { once: true });

    const t1 = setTimeout(recompute, 40);
    const t2 = setTimeout(recompute, 140);
    const t3 = setTimeout(recompute, 300);

    return () => {
      window.removeEventListener("ob:connected-changed", onChange);
      window.removeEventListener("ob:profile-changed", onChange);
      ro.disconnect();
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      host.remove();
    };
  }, []);

  // Conditions d’affichage
  if (!mounted || !portalHost.current || !active || !firstName || !pos) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        width: pos.width,
        height: BANNER_H,
        zIndex: 60,
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
    portalHost.current
  );
}

/* =========================== Boutons droits (inline) =========================== */
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

  // Mêmes classes que les boutons gauches (miroir)
  const circle =
    "h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] " +
    "hover:bg-[var(--chip-hover)] grid place-items-center transition select-none";

  const onGoldClick = () => {
    const profile = localStorage.getItem("ob_profile");
    if (connected) {
      localStorage.setItem("ob_connected", "0");
      window.dispatchEvent(new Event("ob:connected-changed"));
    } else {
      if (profile) {
        localStorage.setItem("ob_connected", "1");
        window.dispatchEvent(new Event("ob:connected-changed"));
      } else {
        setOpenSubscribe(true);
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Création d’espace (O bleu→turquoise) */}
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

        {/* Connexion / Déconnexion (doré) */}
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

      {/* Bannière au-dessus de la barre */}
      <WelcomeBannerOverBar />

      {/* Modal création d’espace */}
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
}
