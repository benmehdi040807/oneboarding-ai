"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SubscribeModal from "./SubscribeModal";

/* ----------------- Bannière de bienvenue (au-dessus de la barre) ----------------- */
function WelcomeBannerOverBar() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);

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

  const BANNER_H = 27; // hauteur validée
  const GAP_Y = 6;     // gap validé

  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    if (!host || !bar) { setTimeout(position, 120); return; }

    const barRect = bar.getBoundingClientRect();
    const ok = getOkEl();
    const rightEdge = ok ? ok.getBoundingClientRect().right : barRect.right;

    const width = Math.max(180, rightEdge - barRect.left);
    const height = BANNER_H;
    const top = Math.max(8, barRect.top - GAP_Y - height);
    const left = barRect.left;

    host.style.cssText = `
      position: fixed;
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      height: ${height}px;
      z-index: 2147483646;
      display: block;
      pointer-events: none;
      border-radius: 12px;
    `;
  };

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "block";
    document.body.appendChild(host);
    hostRef.current = host;
    setMounted(true);

    const load = () => {
      const p = typeof window !== "undefined" ? localStorage.getItem("ob_profile") : null;
      const prof = p ? JSON.parse(p) : null;
      setFirstName(prof?.firstName ?? null);
      setActive(localStorage.getItem("ob_connected") === "1");
    };
    load();

    const onChange = () => load();
    // ← écoute les deux événements
    window.addEventListener("ob:connected-changed", onChange);
    window.addEventListener("ob:profile-changed", onChange);

    const ro = new ResizeObserver(position);
    const bar = getBarEl();
    const ok = getOkEl();
    if (bar) ro.observe(bar);
    if (ok) ro.observe(ok);

    window.addEventListener("resize", position, { passive: true });
    window.addEventListener("scroll", position, { passive: true });
    window.addEventListener("load", position, { once: true });

    const mo = new MutationObserver(() => position());
    mo.observe(document.body, { childList: true, subtree: true });

    const t1 = setTimeout(position, 40);
    const t2 = setTimeout(position, 140);
    const t3 = setTimeout(position, 300);

    return () => {
      window.removeEventListener("ob:connected-changed", onChange);
      window.removeEventListener("ob:profile-changed", onChange);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      host.remove();
    };
  }, []);

  if (!mounted || !hostRef.current || !active || !firstName) return null;

  return createPortal(
    <div
      className="w-full h-full flex items-center justify-center px-3"
      style={{
        background: "rgba(17,24,39,0.12)",
        boxShadow: "0 10px 24px rgba(0,0,0,.14)",
        borderRadius: 12,
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

/* ----------------- Capsule d’erreur mi-bas ----------------- */
function ErrorCapsule({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const position = () => {
    const host = hostRef.current;
    if (!host) return;
    const baseBottom = window.innerWidth < 640 ? 110 : 56; // évite le bandeau légal
    host.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: ${baseBottom}px;
      transform: translateX(-50%);
      z-index: 2147483605;
      display: ${open ? "block" : "none"};
      pointer-events: auto;
      max-width: min(92vw, 560px);
    `;
  };

  useEffect(() => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    hostRef.current = host;
    setMounted(true);
    window.addEventListener("resize", position, { passive: true });
    window.addEventListener("scroll", position, { passive: true });
    const t1 = setTimeout(position, 20);
    const t2 = setTimeout(position, 120);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position);
      clearTimeout(t1); clearTimeout(t2);
      host.remove();
    };
  }, []);

  useEffect(() => { position(); }, [open]);

  if (!mounted || !hostRef.current || !open) return null;

  return createPortal(
    <div
      className="relative rounded-3xl px-4 py-4 sm:px-5 sm:py-5 backdrop-blur-2xl border shadow-xl"
      style={{
        background: "rgba(255,255,255,0.32)",
        borderColor: "rgba(255,255,255,0.6)",
        boxShadow: "0 12px 30px rgba(0,0,0,.18)",
      }}
      role="dialog" aria-modal="true"
    >
      {/* X pour fermer */}
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute -right-3 -top-3 h-11 w-11 rounded-full bg-white/90 hover:bg-white text-black/80 border border-black/10 grid place-items-center text-xl z-20"
      >
        ×
      </button>

      <div className="text-[14px] text-black/85 text-center">
        <div className="font-semibold mb-1">Aucun espace trouvé sur cet appareil</div>
        <div className="opacity-80 mb-4">
          Pour continuer, crée ton espace avec le <span className="font-semibold">O bleu</span>.
        </div>
        <button
          onClick={onCreate}
          className="px-4 py-3 rounded-2xl text-white font-medium shadow hover:opacity-95 active:scale-[.99] transition
                     bg-[linear-gradient(135deg,#4F8AF9,#2E6CF5)]"
        >
          Créer mon espace
        </button>
      </div>
    </div>,
    hostRef.current
  );
}

/* ------------------------- Boutons droits ------------------------- */
export default function RightAuthButtons() {
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  const circle =
    "h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] " +
    "grid place-items-center transition select-none";

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
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={circle}
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

      {/* Bannière bienvenue */}
      <WelcomeBannerOverBar />

      {/* Capsule erreur */}
      <ErrorCapsule
        open={openError}
        onClose={() => setOpenError(false)}
        onCreate={() => { setOpenError(false); setOpenSubscribe(true); }}
      />

      {/* Modal création */}
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
            }
