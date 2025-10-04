"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SubscribeModal from "./SubscribeModal";

/* =================== Bannière au-dessus de la barre =================== */
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

  const BANNER_H = 27;
  const GAP_Y = 6;

  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    if (!host || !bar) { setTimeout(position, 120); return; }
    const barRect = bar.getBoundingClientRect();
    const ok = getOkEl();
    const rightEdge = ok ? ok.getBoundingClientRect().right : barRect.right;

    const width = Math.max(180, rightEdge - barRect.left);
    const top = Math.max(8, barRect.top - GAP_Y - BANNER_H);

    host.style.cssText = `
      position: fixed;
      left:${barRect.left}px; top:${top}px;
      width:${width}px; height:${BANNER_H}px;
      z-index:2147483646; display:block; pointer-events:none;
      border-radius:12px;
    `;
  };

  useEffect(() => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    hostRef.current = host;
    setMounted(true);

    const load = () => {
      const p = localStorage.getItem("ob_profile");
      const prof = p ? JSON.parse(p) : null;
      setFirstName(prof?.firstName ?? null);
      setActive(localStorage.getItem("ob_connected") === "1");
    };
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);

    const ro = new ResizeObserver(position);
    const bar = getBarEl(); const ok = getOkEl();
    if (bar) ro.observe(bar); if (ok) ro.observe(ok);
    window.addEventListener("resize", position, { passive:true });
    window.addEventListener("scroll", position, { passive:true });
    const t1 = setTimeout(position, 40), t2 = setTimeout(position, 140), t3 = setTimeout(position, 300);

    return () => {
      window.removeEventListener("ob:connected-changed", onChange);
      ro.disconnect();
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
      style={{ background:"rgba(17,24,39,0.12)", boxShadow:"0 10px 24px rgba(0,0,0,.14)", borderRadius:12 }}
    >
      <div className="truncate text-center text-[12px] sm:text-[13px] text-white font-medium">
        {"Bonjour\u00A0" + firstName}
        {"\u00A0\u25CB\u00A0"}<span className="font-semibold">Espace</span>{"\u00A0désormais:\u00A0"}
        <span
          className="font-extrabold"
          style={{ background:"linear-gradient(90deg,#3b82f6,#06b6d4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}
        >
          Actif
        </span>
      </div>
    </div>,
    hostRef.current
  );
}

/* =================== Capsule “aucun espace” — centre bas =================== */
function ErrorCapsule({
  open,
  onClose,
  onCreate,
}: { open: boolean; onClose: () => void; onCreate: () => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    hostRef.current = host;
    setMounted(true);
    return () => host.remove();
  }, []);

  if (!mounted || !hostRef.current || !open) return null;

  return createPortal(
    <div
      role="dialog" aria-modal="true" data-overlay
      className="fixed inset-0 z-[80] grid place-items-end sm:place-items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Fond (clic pour fermer) */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Boîte centre-bas */}
      <div
        className="relative mb-10 sm:mb-0 mx-4 max-w-md w-[min(92vw,480px)]
                   rounded-3xl border backdrop-blur-2xl shadow-xl
                   px-4 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-4"
        style={{ background:"rgba(255,255,255,0.32)", borderColor:"rgba(255,255,255,0.6)" }}
      >
        {/* X fermer (universel) */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/85 hover:bg-white
                     text-black/80 grid place-items-center"
        >
          ×
        </button>

        {/* Texte — 1 ligne par bloc */}
        <div className="text-center text-black/85 space-y-2 sm:space-y-3 mt-2 sm:mt-1">
          <div className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
            Aucun espace trouvé sur cet appareil
          </div>
          <div className="opacity-80 whitespace-nowrap overflow-hidden text-ellipsis">
            Pour continuer, crée ton espace avec le O bleu
          </div>

        </div>

        {/* Bouton unique */}
        <div className="mt-3 flex items-center justify-center">
          <button
            onClick={onCreate}
            className="px-4 py-2 rounded-xl text-white font-medium shadow hover:opacity-95 active:scale-[.99] transition
                       bg-[linear-gradient(135deg,#4F8AF9,#2E6CF5)] whitespace-nowrap"
          >
            Créer mon espace
          </button>
        </div>
      </div>
    </div>,
    hostRef.current
  );
}

/* =================== Boutons droits (inline, miroir) =================== */
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

  // mêmes classes que les boutons GAUCHE
  const capsule =
    "h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] " +
    "hover:bg-[var(--chip-hover)] grid place-items-center transition";

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
      {/* Boutons INLINE */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={capsule}
          title="Créer mon espace"
        >
          <span
            className="text-xl font-extrabold leading-none"
            style={{ background:"linear-gradient(90deg,#3b82f6,#06b6d4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}
          >
            O
          </span>
        </button>

        <button
          type="button"
          aria-label={connected ? "Se déconnecter" : "Se connecter"}
          className={capsule}
          onClick={onGoldClick}
          title={connected ? "Se déconnecter" : "Se connecter"}
        >
          <span
            className="text-xl font-extrabold leading-none"
            style={{ background:"linear-gradient(90deg,#FFD451,#EABE3F,#D9D1C0)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}
          >
            O
          </span>
        </button>
      </div>

      {/* Bannière bienvenue */}
      <WelcomeBannerOverBar />

      {/* Capsule “aucun espace” */}
      <ErrorCapsule
        open={openError}
        onClose={() => setOpenError(false)}
        onCreate={() => { setOpenError(false); setOpenSubscribe(true); }}
      />

      {/* Modal création d’espace */}
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
                      }
