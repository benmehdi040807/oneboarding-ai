"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

// Petit composant interne : bandeau "Bienvenue, Prénom"
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

    // lecture profil + écoute des changements
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

  const card =
    "rounded-2xl bg-white/80 backdrop-blur-md shadow px-4 py-2 text-[15px] " +
    "text-black/80 flex flex-col items-end";

  return createPortal(
    <div className={card}>
      <div className="font-semibold">Bienvenue, {firstName}</div>
      <div>
        Votre espace OneBoarding est désormais{" "}
        <span className="font-semibold text-green-600">actif</span>.
      </div>
    </div>,
    hostRef.current
  );
}

export default function RightAuthButtons() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [connected, setConnected] = useState(false);

  // lecture de l'état connecté
  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  // DOM helpers
  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;
  const getOkEl = () => {
    const btns = Array.from(document.querySelectorAll("button"));
    return (btns.find((b) => (b.textContent || "").trim() === "OK") as HTMLElement) || null;
  };

  // Positionner les 2 cercles sous la barre, bord droit = bord droit de OK (+ nudger)
  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    const ok = getOkEl();
    if (!host || !bar || !ok) return;

    const barRect = bar.getBoundingClientRect();
    const okRect = ok.getBoundingClientRect();

    const btn = 48;
    const between = 10;
    const gapY = 10;
    const nudger = 8;

    const total = 2 * btn + between;
    const right = okRect.right + nudger;
    const left = right - total;
    const top = barRect.bottom + gapY;

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
    "flex items-center justify-center backdrop-blur";

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
          {/* plus “plein” visuellement */}
          <span className="text-2xl -mt-[2px] text-black/80">＋</span>
        </button>

        {/* O : doré si déconnecté, bleu si connecté */}
        <button type="button" aria-label="Accéder à mon espace" className={circle}>
          <span
            className={`text-xl font-extrabold ${connected ? "text-[#1e78ff]" : "text-[#CFA23A]"}`}
            style={{ lineHeight: 1 }}
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
