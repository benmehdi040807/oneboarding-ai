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

  if (!mounted || !hostRef.current || !active || !firstName) return null;

  const badge =
    "rounded-2xl bg-white/85 backdrop-blur-md shadow px-4 py-2 text-[15px] " +
    "text-black/80 flex items-center gap-2 pointer-events-auto";

  return createPortal(
    <div className={badge}>
      <span className="font-semibold">Bonjour {firstName}</span>
      <span>
        — <span className="font-semibold">Espace</span> désormais :{" "}
        <span className="font-bold text-green-400">Actif</span>
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

  // état connecté (pour le dégradé du “O” de droite)
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

  // Dégradés (texte en dégradé avec bg-clip)
  const GRAD_BLUE =
    "bg-gradient-to-r from-[#4F8AF9] via-[#25B6E1] to-[#20DFC8]";
  const GRAD_GOLD =
    "bg-gradient-to-r from-yellow-400 via-yellow-500 to-gray-300";

  // Composant “O” avec dégradé
  const GradientO = ({ gradient, className = "" }: { gradient: string; className?: string }) => (
    <span
      className={`text-xl font-extrabold ${gradient} bg-clip-text text-transparent ${className}`}
      style={{ lineHeight: 1 }}
      aria-hidden
    >
      O
    </span>
  );

  return createPortal(
    <>
      <div className="flex items-center gap-[10px]">
        {/* O (création) : bleu → turquoise */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={circle}
        >
          <GradientO gradient={GRAD_BLUE} />
        </button>

        {/* O (accès espace) : or → argent si déconnecté, bleu → turquoise si connecté */}
        <button type="button" aria-label="Accéder à mon espace" className={circle}>
          <GradientO gradient={connected ? GRAD_BLUE : GRAD_GOLD} />
        </button>
      </div>

      {/* Bannière immersive au-dessus de la barre */}
      <WelcomeBannerOverBar />

      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>,
    hostRef.current
  );
}
