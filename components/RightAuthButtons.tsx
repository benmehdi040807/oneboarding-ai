"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

/** --------- Bandeau “Bienvenue, Prénom” (en haut-droite) --------- */
function WelcomeBanner() {
  const [mounted, setMounted] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;top:18px;right:16px;z-index:2147483647;";
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
    return () => {
      window.removeEventListener("ob:connected-changed", onChange);
      host.remove();
    };
  }, []);

  if (!mounted || !hostRef.current || !active || !firstName) return null;

  return createPortal(
    <div className="rounded-2xl bg-white/80 backdrop-blur-md shadow px-4 py-2 text-[15px] text-black/80 flex flex-col items-end">
      <div className="font-semibold">Bienvenue, {firstName}</div>
      <div>
        Votre espace OneBoarding est désormais{" "}
        <span className="font-semibold text-green-600">actif</span>.
      </div>
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

  // Positionne les 2 cercles sous la barre : bord droit = bord droit de OK (léger shift à gauche)
  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    const ok = getOkEl();
    if (!host || !bar || !ok) return;

    const barRect = bar.getBoundingClientRect();
    const okRect = ok.getBoundingClientRect();

    const BTN = 48;           // diamètre de chaque cercle
    const BETWEEN = 10;       // espace entre les deux
    const GAP_Y = 10;         // distance sous la barre
    const NUDGE_X = -4;       // petit décalage vers la GAUCHE (symétrie visuelle)

    const totalWidth = 2 * BTN + BETWEEN;
    const rightEdge = okRect.right + NUDGE_X; // bord droit = bord droit du OK (−4 px)
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

  // styles “halo” pour O (doré très clair ↔ bleu connecté)
  const gold = "#FFD451";          // doré clair éclatant
  const blue = "#1e78ff";          // bleu logo
  const glowGold = "0 0 10px rgba(255,212,81,.55)";
  const glowBlue = "0 0 12px rgba(30,120,255,.45)";

  return createPortal(
    <>
      <div className="flex items-center gap-[10px]">
        {/* + : ouvre la création d’espace */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={circle}
        >
          <span className="text-2xl -mt-[2px] text-black/80">＋</span>
        </button>

        {/* O : doré (déconnecté) ⇄ bleu (connecté) avec halo */}
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

      <WelcomeBanner />
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>,
    hostRef.current
  );
}
