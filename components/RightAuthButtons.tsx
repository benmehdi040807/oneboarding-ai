"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";

// Dynamic (évite qu’une erreur dans le modal empêche d’afficher les boutons)
const SubscribeModal = dynamic(() => import("./SubscribeModal"), { ssr: false, loading: () => null });

/** ----------------- Bannière immersive type « mini barre » ----------------- */
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

  // Hauteur & gap validés
  const BANNER_H = 27;
  const GAP_Y = 6;

  const position = () => {
    try {
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
    } catch {}
  };

  useEffect(() => {
    try {
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
      mo.observe(document.body, { childList: true, subtree: true, attributes: true });

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
    } catch {}
  }, []);

  useEffect(() => {
    const a = setTimeout(position, 20);
    const b = setTimeout(position, 120);
    const c = setTimeout(position, 260);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
  }, [mounted, active, firstName]);

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

/** -------- Capsule flottante « erreur / créer un espace » -------- */
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
    try {
      const host = hostRef.current;
      if (!host) return;
      const margin = Math.max(8, window.innerHeight * 0.08);
      const top = window.innerHeight - margin - 140;
      const centerX = window.innerWidth / 2;
      host.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${top}px;
        transform: translateX(-50%);
        z-index: 2147483605;
        display: ${open ? "block" : "none"};
        pointer-events: auto;
        max-width: min(92vw, 540px);
      `;
    } catch {}
  };

  useEffect(() => {
    try {
      const host = document.createElement("div");
      host.style.display = "block";
      document.body.appendChild(host);
      hostRef.current = host;
      setMounted(true);

      window.addEventListener("resize", position, { passive: true });
      window.addEventListener("scroll", position, { passive: true });
      const t1 = setTimeout(position, 40);
      const t2 = setTimeout(position, 140);

      return () => {
        window.removeEventListener("resize", position);
        window.removeEventListener("scroll", position);
        clearTimeout(t1); clearTimeout(t2);
        host.remove();
      };
    } catch {}
  }, []);

  useEffect(() => { position(); }, [open]);

  if (!mounted || !hostRef.current || !open) return null;

  return createPortal(
    <div
      className="rounded-3xl px-4 py-3 backdrop-blur-2xl border shadow-xl relative"
      style={{
        background: "rgba(255,255,255,0.32)",
        borderColor: "rgba(255,255,255,0.6)",
        boxShadow: "0 12px 30px rgba(0,0,0,.18)",
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* fermeture via X (unique bouton de fermeture) */}
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-black/80 text-xl flex items-center justify-center shadow"
      >
        ×
      </button>

      <div className="text-[13px] sm:text-[14px] text-black/85 text-center">
        <div className="font-semibold mb-1">Aucun espace trouvé sur cet appareil</div>
        <div className="opacity-80 mb-3">
          Pour continuer, crée ton espace avec le <span className="font-semibold">O bleu</span>.
        </div>
        <div className="flex items-center justify-center">
          <button
            onClick={onCreate}
            className="px-4 py-2 rounded-xl text-white font-medium shadow hover:opacity-95 active:scale-[.99] transition
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

/** ------------------------- Boutons droits (INLINE) ------------------------ */
export default function RightAuthButtons() {
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [connected, setConnected] = useState(false);

  // Toujours afficher les boutons; on n’utilise pas d’overlay/portal pour eux
  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    window.addEventListener("ob:profile-changed", onChange);
    return () => {
      window.removeEventListener("ob:connected-changed", onChange);
      window.removeEventListener("ob:profile-changed", onChange);
    };
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
      {/* BOUTONS INLINE */}
      <div className="flex items-center gap-3">
        {/* Création d’espace */}
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

        {/* Connexion / Déconnexion */}
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

      {/* BANNIÈRE FLOTTANTE */}
      <WelcomeBannerOverBar />

      {/* CAPSULE ERREUR FLOTTANTE */}
      <ErrorCapsule
        open={openError}
        onClose={() => setOpenError(false)}
        onCreate={() => { setOpenError(false); setOpenSubscribe(true); }}
      />

      {/* MODAL CRÉATION ESPACE */}
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
}
