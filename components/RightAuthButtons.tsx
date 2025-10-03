"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

export default function RightAuthButtons() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [openSubscribe, setOpenSubscribe] = useState(false);

  // --- visuel "O" : doré par défaut, deviendra bleu si "connecté" ---
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    // hook optionnel : si un jour tu passes "connecté", stocke "1" dans localStorage
    setConnected(typeof window !== "undefined" && localStorage.getItem("ob_connected") === "1");
  }, []);

  // ---- helpers DOM (aucune hypothèse superflue) ----
  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;

  const getOkEl = () => {
    const btns = Array.from(document.querySelectorAll("button"));
    return (btns.find((b) => (b.textContent || "").trim() === "OK") as HTMLElement) || null;
  };

  // ---- positionnement : sous la barre, à son extrémité droite, OK inclus ----
  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    const ok = getOkEl();
    if (!host || !bar || !ok) return; // on ne place que si OK est présent (ton exigence)

    const barRect = bar.getBoundingClientRect();
    const okRect = ok.getBoundingClientRect();

    const btn = 48;       // diamètre des cercles
    const between = 10;   // espace entre les deux cercles
    const gapY = 10;      // espace sous la barre
    const nudger = 8;     // léger "coup de pouce" vers la droite

    const total = 2 * btn + between;
    const effectiveRight = okRect.right + nudger; // on part du bord droit de OK
    const left = effectiveRight - total;
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

  // ---- montage + observers ----
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
        {/* + (ouvre la création d’espace) */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={circle}
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

        {/* O (connexion) : doré par défaut, bleu si connecté */}
        <button
          type="button"
          aria-label="Accéder à mon espace"
          className={circle}
        >
          <span
            className={`text-xl font-extrabold ${
              connected ? "text-[#1e78ff]" : "text-[#CFA23A]"
            }`}
            style={{ lineHeight: 1 }}
          >
            O
          </span>
        </button>
      </div>

      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>,
    hostRef.current
  );
}
