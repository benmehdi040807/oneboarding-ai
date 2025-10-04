"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SubscribeModal from "./SubscribeModal";

/* ------------------------------------------------------------------ */
/*  Bannière de bienvenue (au-dessus de la barre) – version validée   */
/*  H = 27px, GAP = 6px, « Actif » dégradé bleu                       */
/* ------------------------------------------------------------------ */
function WelcomeBannerOverBar() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const getBarEl = () =>
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
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
    if (!host || !bar) {
      setTimeout(position, 120);
      return;
    }

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
      z-index: 2147483646; /* sous les vrais modaux, au-dessus du fond */
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
    window.addEventListener("ob:connected-changed", onChange);

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
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
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

/* ------------------------------------------------------------------ */
/*  Capsule d’erreur (bas-centre) – 1 seul bouton + croix fiable      */
/* ------------------------------------------------------------------ */
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

    const bottom = 24; // au-dessus du bord inférieur
    host.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: ${bottom}px;
      transform: translateX(-50%);
      z-index: 2147483647; /* au-dessus de la bannière */
      display: ${open ? "block" : "none"};
      pointer-events: auto;
      max-width: min(92vw, 560px);
    `;
  };

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "block";
    document.body.appendChild(host);
    hostRef.current = host;
    setMounted(true);

    const onPos = () => position();
    window.addEventListener("resize", onPos);
    window.addEventListener("scroll", onPos);

    const t1 = setTimeout(onPos, 40);
    const t2 = setTimeout(onPos, 140);

    return () => {
      window.removeEventListener("resize", onPos);
      window.removeEventListener("scroll", onPos);
      clearTimeout(t1);
      clearTimeout(t2);
      host.remove();
    };
  }, []);

  useEffect(() => {
    position();
  }, [open]);

  if (!mounted || !hostRef.current || !open) return null;

  return createPortal(
    <div
      className="relative rounded-3xl px-5 py-4 backdrop-blur-2xl border shadow-xl"
      style={{
        background: "rgba(255,255,255,0.32)",
        borderColor: "rgba(255,255,255,0.6)",
        boxShadow: "0 12px 30px rgba(0,0,0,.18)",
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* X large et fiable */}
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute -right-3 -top-3 h-11 w-11 rounded-full bg-white/90 hover:bg-white text-black/80 text-2xl leading-none
                   flex items-center justify-center select-none cursor-pointer"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        ×
      </button>

      <div className="text-[14px] text-black/85 text-center">
        <div className="font-semibold mb-1">Aucun espace trouvé sur cet appareil</div>
        <div className="opacity-80 mb-4">
          Pour continuer, crée ton espace avec le <span className="font-semibold">O bleu</span>.
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={onCreate}
            className="px-5 py-3 rounded-2xl text-white font-semibold shadow hover:opacity-95 active:scale-[.99] transition
                       bg-[linear-gradient(135deg,#4F8AF9,#2E6CF5)]"
          >
            Créer mon espace
          </button>
        </div>
      </div>
    </div>,
    hostRef.current
  );
}

/* ------------------------------------------------------------------ */
/*  Boutons droits (miroir)                                           */
/* ------------------------------------------------------------------ */
export default function RightAuthButtons() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [connected, setConnected] = useState(false);
  const [hiddenByOverlay, setHiddenByOverlay] = useState(false);

  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  const getBarEl = () =>
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    null;

  const getOkEl = () => {
    const btns = Array.from(document.querySelectorAll("button"));
    return (
      (btns.find((b) => (b.textContent || "").trim() === "OK") as HTMLElement) ||
      (btns.find((b) => (b.getAttribute("aria-label") || "").toLowerCase() === "ok") as HTMLElement) ||
      null
    );
  };

  // Masquer si un overlay/modale visible
  const overlayIsVisible = (el: Element) => {
    const s = window.getComputedStyle(el as HTMLElement);
    if (s.display === "none" || s.visibility === "hidden" || parseFloat(s.opacity || "1") === 0) return false;
    const rect = (el as HTMLElement).getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const checkOverlay = () => {
    const candidates = [
      ...document.querySelectorAll('[role="dialog"]'),
      ...document.querySelectorAll(".modal"),
      ...document.querySelectorAll("[data-overlay]"),
    ];
    setHiddenByOverlay(candidates.some(overlayIsVisible));
  };

  // Position miroir des boutons de gauche – sans z-index forcé
  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    if (!host || !bar) {
      setTimeout(position, 120);
      return;
    }

    const barRect = bar.getBoundingClientRect();
    const ok = getOkEl();
    let rightEdge = ok ? ok.getBoundingClientRect().right : barRect.right;

    const BTN = 48;
    const BETWEEN = 10;
    const GAP_Y = 10;
    const totalWidth = 2 * BTN + BETWEEN;

    if (!Number.isFinite(rightEdge) || rightEdge < barRect.left + totalWidth) {
      rightEdge = barRect.right;
    }

    const minLeft = 8;
    const maxLeft = Math.max(minLeft, window.innerWidth - totalWidth - 8);

    let left = rightEdge - totalWidth;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    const top = barRect.bottom + GAP_Y;

    host.style.cssText = `
      position: fixed;
      left: ${left}px;
      top: ${top}px;
      display: ${hiddenByOverlay ? "none" : "block"};
      pointer-events: auto;
    `;
  };

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "block";
    hostRef.current = host;
    document.body.appendChild(host);
    setMounted(true);

    const ro = new ResizeObserver(position);
    const bar = getBarEl();
    const ok = getOkEl();
    if (bar) ro.observe(bar);
    if (ok) ro.observe(ok);

    window.addEventListener("resize", position, { passive: true });
    window.addEventListener("scroll", position, { passive: true });
    window.addEventListener("load", position, { once: true });

    const mo = new MutationObserver(() => {
      checkOverlay();
      position();
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });

    const t1 = setTimeout(() => {
      checkOverlay();
      position();
    }, 40);
    const t2 = setTimeout(() => {
      checkOverlay();
      position();
    }, 140);
    const t3 = setTimeout(() => {
      checkOverlay();
      position();
    }, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position);
      host.remove();
    };
  }, []);

  useEffect(() => {
    position();
  }, [hiddenByOverlay]);

  if (!mounted || !hostRef.current) return null;

  const circle =
    "h-12 w-12 rounded-full bg-white/85 hover:bg-white/95 shadow flex items-center justify-center backdrop-blur select-none";

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
        setOpenError(true); // capsule en bas
      }
    }
  };

  return createPortal(
    <>
      <div className="flex items-center gap-[10px]">
        {/* Création d’espace (O dégradé bleu→turquoise) */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => {
            setOpenError(false);
            setOpenSubscribe(true);
          }}
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

      {/* Bannière de bienvenue */}
      <WelcomeBannerOverBar />

      {/* Capsule d’erreur (bas) */}
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
    </>,
    hostRef.current
  );
                            }
