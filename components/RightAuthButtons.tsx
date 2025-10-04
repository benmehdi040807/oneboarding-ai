"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SubscribeModal from "./SubscribeModal";

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

  // ---- Hauteur figée + gap resserré ----
  const BANNER_H = 27; // px
  const GAP_Y = 6;     // px

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

  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;

  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    if (!host || !bar) { setTimeout(position, 120); return; }

    const r = bar.getBoundingClientRect();
    const centerX = r.left + r.width / 2;
    const top = Math.max(8, r.top - 16 - 54);

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
  };

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "block";
    document.body.appendChild(host);
    hostRef.current = host;
    setMounted(true);

    const ro = new ResizeObserver(position);
    const bar = getBarEl();
    if (bar) ro.observe(bar);

    window.addEventListener("resize", position);
    window.addEventListener("scroll", position);
    const t1 = setTimeout(position, 40);
    const t2 = setTimeout(position, 140);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position);
      clearTimeout(t1);
      clearTimeout(t2);
      host.remove();
    };
  }, []);

  useEffect(() => { position(); }, [open]);

  if (!mounted || !hostRef.current || !open) return null;

  return createPortal(
    <div
      className="rounded-3xl px-4 py-3 backdrop-blur-2xl border shadow-xl"
      style={{
        background: "rgba(255,255,255,0.32)",
        borderColor: "rgba(255,255,255,0.6)",
        boxShadow: "0 12px 30px rgba(0,0,0,.18)",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="text-[13px] sm:text-[14px] text-black/85 text-center">
        <div className="font-semibold mb-1">Aucun espace trouvé sur cet appareil</div>
        <div className="opacity-80 mb-3">
          Pour continuer, crée ton espace avec le <span className="font-semibold">O bleu</span>.
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-white/85 hover:bg-white text-black/80 border border-black/10"
          >
            Fermer
          </button>
          <button
            onClick={onCreate}
            className="px-3 py-2 rounded-xl text-white font-medium shadow hover:opacity-95 active:scale-[.99] transition
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

/** ---------------------- Boutons droits (INLINE) ---------------------- */
export default function RightAuthButtons() {
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [connected, setConnected] = useState(false);

  // état connecté
  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  // classes identiques aux boutons de GAUCHE (capsules)
  const capsule =
    "h-12 w-12 rounded-xl border border-[var(--border)] " +
    "bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] " +
    "grid place-items-center transition";

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
      {/* --- Boutons RENDUS INLINE (pas de portal) --- */}
      <div className="flex items-center gap-3">
        {/* Création d’espace (O dégradé bleu→turquoise) */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={capsule}
          title="Créer mon espace"
        >
          <span
            className="text-xl font-extrabold leading-none"
            style={{
              background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            O
          </span>
        </button>

        {/* Connexion / Déconnexion (O doré dégradé) */}
        <button
          type="button"
          aria-label={connected ? "Se déconnecter" : "Se connecter"}
          className={capsule}
          onClick={onGoldClick}
          title={connected ? "Se déconnecter" : "Se connecter"}
        >
          <span
            className="text-xl font-extrabold leading-none"
            style={{
              background: "linear-gradient(90deg,#FFD451,#EABE3F,#D9D1C0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            O
          </span>
        </button>
      </div>

      {/* Bannière immersive (au-dessus de la barre) */}
      <WelcomeBannerOverBar />

      {/* Capsule “pas d’espace” */}
      <ErrorCapsule
        open={openError}
        onClose={() => setOpenError(false)}
        onCreate={() => { setOpenError(false); setOpenSubscribe(true); }}
      />

      {/* Modal de création d’espace */}
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
                          }
