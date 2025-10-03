"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

export default function RightAuthButtons() {
  const [mounted, setMounted] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [openSubscribe, setOpenSubscribe] = useState(false);

  // ---- helpers: trouver la barre et le bouton OK ----
  const findBar = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;

  const findOk = () => {
    const btns = Array.from(document.querySelectorAll("button")) as HTMLButtonElement[];
    return btns.find((b) => (b.textContent || "").trim() === "OK") || null;
  };

  // ---- positionnement : bord droit = bord droit du bouton OK (sinon bord droit de la barre) ----
  const positionHost = () => {
    const host = hostRef.current;
    const bar = findBar();
    if (!host || !bar) return;

    const r = bar.getBoundingClientRect();
    const ok = findOk();
    const okRect = ok?.getBoundingClientRect();

    const gapY = 10;              // espace vertical sous la barre
    const gapRight = 8;           // marge visuelle avec l'extrémité droite (OK inclus)
    const btn = 48;               // diamètre d’un cercle
    const between = 10;           // espace entre les deux cercles
    const totalWidth = 2 * btn + between;

    // >>> ICI le changement clé : on prend le BORD DROIT du bouton OK <<<
    const rightLimit = okRect ? okRect.right : r.right;

    const left = rightLimit - gapRight - totalWidth;
    const top  = r.bottom + gapY;

    host.style.position = "fixed";
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    host.style.zIndex = "2147483647";
    host.style.display = "block";
    host.style.pointerEvents = "auto";
  };

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "none";
    hostRef.current = host;
    document.body.appendChild(host);
    setMounted(true);

    const ro = new ResizeObserver(positionHost);
    const bar = findBar();
    if (bar) ro.observe(bar);

    window.addEventListener("resize", positionHost);
    window.addEventListener("scroll", positionHost, { passive: true });

    // ticks pour couvrir transitions / fonts
    const t1 = setTimeout(positionHost, 60);
    const t2 = setTimeout(positionHost, 180);
    const t3 = setTimeout(positionHost, 380);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      ro.disconnect();
      window.removeEventListener("resize", positionHost);
      window.removeEventListener("scroll", positionHost);
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
        {/* ➕ */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={circle}
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

        {/* O (OneBoardingAI) en dégradé bleu proche du logo */}
        <button
          type="button"
          aria-label="Accéder à mon espace"
          className={circle}
        >
          <span
            className="font-extrabold text-lg leading-none
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
