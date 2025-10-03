"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

/**
 * RENDU
 * - Deux boutons ronds (➕ et "O" bleu) sous la barre, côté droit.
 * - Le calcul tient compte du bouton "OK" (si présent).
 * - Aucun couplage à Page.tsx, pas de dépendance à d'autres composants.
 */
export default function RightAuthButtons() {
  const [mounted, setMounted] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [openSubscribe, setOpenSubscribe] = useState(false);

  // Trouver la barre + (si possible) le bouton OK
  function findBar(): HTMLElement | null {
    return (
      document.querySelector('input[placeholder*="Votre question"]') ||
      document.querySelector('textarea[placeholder*="Votre question"]')
    );
  }
  function findOk(): HTMLButtonElement | null {
    // cherche un bouton dont le texte visible vaut "OK"
    const btns = Array.from(document.querySelectorAll("button")) as HTMLButtonElement[];
    return btns.find((b) => (b.textContent || "").trim() === "OK") || null;
  }

  // Positionner l’hôte (le conteneur des deux boutons)
  const positionHost = () => {
    const host = hostRef.current;
    const bar = findBar();
    if (!host || !bar) return;

    const r = bar.getBoundingClientRect();
    const ok = findOk();
    const gapY = 10;             // espace vertical sous la barre
    const gapX = 8;              // marge avec le "OK" ou le bord droit de la barre
    const totalWidth = 2 * 48 + 12; // 2 boutons (48px) + gap (12px)

    // Bord droit “utile” = bord G du OK (s’il existe) sinon bord D de la barre
    const rightLimit = ok ? ok.getBoundingClientRect().left : r.right;

    // On cale notre bloc pour que son bord D = rightLimit - gapX
    const left = rightLimit - gapX - totalWidth;
    const top = r.bottom + gapY;

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

    // Plusieurs ticks pour couvrir les transitions/layouts
    const t1 = setTimeout(positionHost, 60);
    const t2 = setTimeout(positionHost, 180);
    const t3 = setTimeout(positionHost, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      ro.disconnect();
      window.removeEventListener("resize", positionHost);
      window.removeEventListener("scroll", positionHost);
      host.remove();
    };
  }, []);

  if (!mounted || !hostRef.current) return null;

  // Styles communs : ronds, 48x48, rendu premium
  const circle =
    "h-12 w-12 rounded-full bg-white/80 hover:bg-white/90 shadow flex items-center justify-center backdrop-blur";

  return createPortal(
    <>
      <div className="flex items-center gap-3">
        {/* ➕ : ouvrir le modal */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={circle}
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

        {/* O bleu (OneBoardingAI) – action à définir plus tard */}
        <button
          type="button"
          aria-label="Accéder à mon espace"
          className={circle}
        >
          <span className="text-blue-600 font-extrabold text-lg leading-none">O</span>
        </button>
      </div>

      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>,
    hostRef.current
  );
}
