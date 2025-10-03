"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, KeyRound } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

/**
 * RightAuthButtons
 * - Positionne les boutons par calcul RELATIF à l’input (barre de question).
 * - Pas de lien avec le bandeau CGU (supprimé).
 * - Fallback neutre : milieu droit de l’écran (jamais près de la CGU).
 * - Tout en un seul fichier, aucun autre changement requis.
 */
export default function RightAuthButtons() {
  const [openSubscribe, setOpenSubscribe] = useState(false);

  // Mesure / position
  const [pos, setPos] = useState<{ top: number; left: number; anchored: boolean }>({
    top: 0,
    left: 0,
    anchored: false,
  });

  // Constantes d’UI (doivent refléter tes classes tailwind)
  const BTN = 48;      // h-12 w-12 -> 48px
  const GAP = 12;      // gap-3
  const GROUP_W = useMemo(() => BTN * 2 + GAP, []); // deux boutons + l’espace

  /** Trouve l’input de la barre (plusieurs heuristiques, sans toucher page.tsx) */
  function findAnchor(): HTMLInputElement | null {
    // 1) data-attr si un jour tu l’ajoutes
    const byData = document.querySelector<HTMLInputElement>('[data-ob-question-bar] input[type="text"], [data-ob-question-bar] input[type="search"]');
    if (byData) return byData;

    // 2) placeholder actuel
    const byPlaceholder = document.querySelector<HTMLInputElement>('input[placeholder="Votre question…"]');
    if (byPlaceholder) return byPlaceholder;

    // 3) champ texte le plus large à l’écran (très robuste)
    const candidates = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="search"]'));
    let best: HTMLInputElement | null = null;
    let bestWidth = 0;
    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      const score = r.width * (r.height || 1);
      if (score > bestWidth) {
        bestWidth = score;
        best = el;
      }
    }
    return best;
  }

  /** Calcule la position sous la barre, alignée à droite */
  function computePosition() {
    const anchor = findAnchor();

    if (anchor) {
      const r = anchor.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;

      const gapBelow = 12; // espace sous la barre
      const top = r.top + scrollY + r.height + gapBelow;
      const left = r.right + scrollX - GROUP_W; // bord droit de la barre

      setPos({ top, left, anchored: true });
      return;
    }

    // ---- Fallback NEUTRE (aucune référence à la CGU) ----
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPos({
      top: Math.max(100, Math.round(vh * 0.52)),       // milieu visuel
      left: Math.max(12, Math.round(vw * 0.72) - GROUP_W / 2),
      anchored: false,
    });
  }

  // Recalcule sur resize/scroll/orientation/visibilité + léger timeout
  useEffect(() => {
    const handle = () => computePosition();
    handle();
    const ro = new ResizeObserver(handle);
    ro.observe(document.documentElement);

    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    window.addEventListener("orientationchange", handle);
    document.addEventListener("visibilitychange", handle);

    const t1 = setTimeout(handle, 50);
    const t2 = setTimeout(handle, 300); // après chargement des polices

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
      window.removeEventListener("orientationchange", handle);
      document.removeEventListener("visibilitychange", handle);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [GROUP_W]);

  // Styles identiques aux minis boutons de gauche
  const mini =
    "h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow flex items-center justify-center";

  return (
    <>
      {/* Groupe flottant — une seule source de vérité */}
      <div
        style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 30 }}
        data-ob-right-buttons={pos.anchored ? "anchored" : "fallback"}
        className="flex items-center gap-3"
      >
        {/* + */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={mini}
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

        {/* Clé (placeholder) */}
        <button
          type="button"
          aria-label="Accéder à mon espace"
          className={mini}
        >
          <KeyRound className="h-6 w-6 text-amber-500" />
        </button>
      </div>

      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
}
