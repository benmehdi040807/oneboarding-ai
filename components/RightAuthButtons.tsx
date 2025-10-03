"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

export default function RightAuthButtons() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [openSubscribe, setOpenSubscribe] = useState(false);

  // Récupère les éléments de référence
  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;

  const getOkEl = () => {
    const btns = Array.from(document.querySelectorAll("button"));
    return (btns.find((b) => (b.textContent || "").trim() === "OK") as HTMLElement) || null;
  };

  // Positionne sous la barre, bord droit = barre + largeur d’OK
  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    if (!host || !bar) return;

    const barRect = bar.getBoundingClientRect();
    const ok = getOkEl();

    // Largeur d’OK : réelle si présent, sinon valeur nominale (56px) intégrée au calcul.
    const okWidth =
      ok?.getBoundingClientRect().width ??
      56; // bouton OK (largeur nominale, inclut padding et coins)

    const btn = 48;        // diamètre d’un cercle
    const gapY = 10;       // écart vertical sous la barre
    const between = 10;    // espace entre les deux cercles
    const total = 2 * btn + between;

    // Bord droit effectif de la barre (barre + OK)
    const effectiveRight = barRect.right + okWidth;

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

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "none";
    hostRef.current = host;
    document.body.appendChild(host);
    setMounted(true);

    const ro = new ResizeObserver(position);
    const bar = getBarEl();
    if (bar) ro.observe(bar);

    window.addEventListener("resize", position, { passive: true });
    window.addEventListener("scroll", position, { passive: true });

    // quelques ticks pour couvrir le rendu initial
    const t1 = setTimeout(position, 60);
    const t2 = setTimeout(position, 180);
    const t3 = setTimeout(position, 360);

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
        {/* + */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={circle}
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

        {/* O (OneBoardingAI) — majuscule, gras, dégradé bleu */}
        <button type="button" aria-label="Accéder à mon espace" className={circle}>
          <span
            className="uppercase font-black text-lg leading-none tracking-tight
                       bg-gradient-to-br from-[#22C1F1] via-[#15A1EE] to-[#0A84F6]
                       bg-clip-text text-transparent"
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
