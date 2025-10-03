"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SubscribeModal from "./SubscribeModal";

/** ----------------- Bandeau immersif au-dessus de la barre ----------------- */
function WelcomeBannerOverBar() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;

  // positionne le host centré sur la barre, juste au-dessus
  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    if (!host || !bar) return;
    const r = bar.getBoundingClientRect();
    const centerX = r.left + r.width / 2;
    const gapY = 12;
    const top = Math.max(8, r.top - gapY - 36); // 36 ≈ hauteur du badge

    host.style.cssText = `
      position: fixed;
      left: ${centerX}px;
      top: ${top}px;
      transform: translateX(-50%);
      z-index: 2147483646;
      display: block;
      pointer-events: none;
    `;
  };

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "none";
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
    if (bar) ro.observe(bar);
    window.addEventListener("resize", position, { passive: true });
    window.addEventListener("scroll", position, { passive: true });
    const t1 = setTimeout(position, 60);
    const t2 = setTimeout(position, 160);

    return () => {
      window.removeEventListener("ob:connected-changed", onChange);
      ro.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position);
      clearTimeout(t1);
      clearTimeout(t2);
      host.remove();
    };
  }, []);

  // si pas connecté ou pas de prénom, pas de bannière
  if (!mounted || !hostRef.current || !active || !firstName) return null;

  // badge: pas de coupure de mots + largeur max pour éviter de dépasser l’écran
  const badge =
    "rounded-2xl bg-white/85 backdrop-blur-md shadow px-4 py-2 " +
    "text-[14px] sm:text-[15px] text-black/80 pointer-events-auto " +
    "max-w-[calc(100vw-32px)] flex items-center gap-2";

  return createPortal(
    <div className={badge}>
      <span className="font-semibold whitespace-nowrap">
        {"Bonjour\u00A0" + firstName}
      </span>
      <span className="whitespace-nowrap">
        {/* \u25CB = “○” — entouré d’espaces insécables */}
        {"\u00A0\u25CB\u00A0"}
        <span className="font-semibold">Espace</span>
        {"\u00A0désormais :\u00A0"}
        <span className="font-bold text-green-500">Actif</span>
      </span>
    </div>,
    hostRef.current
  );
}

/** ------------------------- Boutons droits ------------------------ */
export default function RightAuthButtons() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [connected, setConnected] = useState(false);

  // état connecté (pour la couleur du “O”)
  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  // helpers DOM
  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;

  const getOkEl = () => {
    const btns = Array.from(document.querySelectorAll("button"));
    return (btns.find((b) => (b.textContent || "").trim() === "OK") as HTMLElement) || null;
  };

  // Positionne les 2 cercles sous la barre : bord droit = bord droit de OK (alignement exact)
  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    const ok = getOkEl();
    if (!host || !bar || !ok) return;

    const barRect = bar.getBoundingClientRect();
    const okRect = ok.getBoundingClientRect();

    const BTN = 48;     // diamètre de chaque cercle
    const BETWEEN = 10; // espace entre les deux
    const GAP_Y = 10;   // distance sous la barre

    const totalWidth = 2 * BTN + BETWEEN;
    const rightEdge = okRect.right; // alignement exact sur le bord droit de OK
    const left = rightEdge - totalWidth;
    const top = barRect.bottom + GAP_Y;

    host.style.cssText = `
      position: fixed;
      left: ${left}px;
      top: ${top}px;
      z-index: 2147483647;
      display: block;
      pointer-events: auto;
    `;
  };

  // mount + observers
  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "none";
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

    const t1 = setTimeout(position, 60);
    const t2 = setTimeout(position, 160);
    const t3 = setTimeout(position, 320);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      ro.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position);
      host.remove();
    };
  }, []);

  if (!mounted || !hostRef.current) return null;

  const circle =
    "h-12 w-12 rounded-full bg-white/85 hover:bg-white/95 shadow " +
    "flex items-center justify-center backdrop-blur select-none";

  // “O” (doré clair ↔ bleu connecté)
  const gold = "#FFD451";
  const blue = "#1e78ff";
  const glowGold = "0 0 10px rgba(255,212,81,.55)";
  const glowBlue = "0 0 12px rgba(30,120,255,.45)";

  return createPortal(
    <>
      <div className="flex items-center gap-[10px]">
        {/* Création d’espace */}
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

        {/* Accès espace (état connecté) */}
        <button type="button" aria-label="Accéder à mon espace" className={circle}>
          <span
            className="text-xl font-extrabold"
            style={{
              lineHeight: 1,
              color: connected ? blue : gold,
              textShadow: connected ? glowBlue : glowGold,
            }}
          >
            O
          </span>
        </button>
      </div>

      {/* Bannière immersive au-dessus de la barre */}
      <WelcomeBannerOverBar />

      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>,
    hostRef.current
  );
      }
