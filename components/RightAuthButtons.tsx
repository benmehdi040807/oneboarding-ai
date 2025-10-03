"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, KeyRound } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

/**
 * RightAuthButtons
 * - 100% autonome (aucune modif ailleurs)
 * - Essaie d’ankrer les boutons juste sous la barre (input "Votre question…")
 * - Fallback propre en bas-droite si la barre n’est pas détectée
 */
export default function RightAuthButtons() {
  // --- UI states
  const [openSubscribe, setOpenSubscribe] = useState(false);

  // --- Mesure / position
  const groupRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; anchored: boolean }>({
    top: 0,
    left: 0,
    anchored: false,
  });

  // Constantes d’UI utilisées pour calculer la largeur du groupe
  const BTN = 48;          // 12rem -> 48px (h-12 w-12)
  const GAP = 12;          // gap-3
  const GROUP_W = useMemo(() => BTN * 2 + GAP, []); // deux boutons + l’espace

  // Sélecteur “sans toucher page.tsx” :
  // 1) data attr si présent (non bloquant)
  // 2) input avec placeholder FR courant
  // 3) fallback texte de bouton OK: on remonte à l’input voisin
  function findAnchor(): HTMLElement | null {
    // 1) si un data-attr existe chez toi plus tard :
    const byData = document.querySelector<HTMLElement>('[data-ob-question-bar] input');
    if (byData) return byData;

    // 2) placeholder actuel (ne casse rien si tu le changes plus tard)
    const byPlaceholder = document.querySelector<HTMLElement>('input[placeholder="Votre question…"]');
    if (byPlaceholder) return byPlaceholder;

    // 3) voisin du bouton OK (rarement utile, mais robuste)
    const okBtn = Array.from(document.querySelectorAll<HTMLElement>("button"))
      .find((b) => b.textContent?.trim() === "OK");
    if (okBtn) {
      // cherche un input dans le même conteneur
      let n: HTMLElement | null = okBtn;
      for (let i = 0; i < 4 && n; i++) {
        const input = n.querySelector?.("input");
        if (input) return input as HTMLElement;
        n = n.parentElement;
      }
    }

    return null;
  }

  // Calcule la position idéale (sous la barre, aligné à droite)
  function computePosition() {
    const anchor = findAnchor();
    if (!anchor) {
      // Fallback : bas-droite de l’écran, au-dessus du bandeau CGU
      const margin = 20;
      const bottomSafe = 140; // au-dessus du bandeau CGU
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPos({
        top: vh - bottomSafe,
        left: vw - margin - GROUP_W,
        anchored: false,
      });
      return;
    }

    const r = anchor.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    const gapBelow = 12; // espace sous la barre
    const top = r.top + scrollY + r.height + gapBelow;
    const left = r.right + scrollX - GROUP_W; // aligné au bord droit de la barre

    setPos({ top, left, anchored: true });
  }

  // Recalcule sur resize/scroll/orientation/visibilité
  useEffect(() => {
    const handle = () => computePosition();
    handle();
    const ro = new ResizeObserver(handle);
    ro.observe(document.documentElement);

    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    window.addEventListener("orientationchange", handle);
    document.addEventListener("visibilitychange", handle);

    // Recalcule après rendu des polices / images
    const t = setTimeout(handle, 50);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
      window.removeEventListener("orientationchange", handle);
      document.removeEventListener("visibilitychange", handle);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Styles communs aux minis boutons (uniformité stricte)
  const mini =
    "h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow flex items-center justify-center";

  return (
    <>
      {/* Groupe flottant, positionné depuis JS (une SEULE source de vérité) */}
      <div
        ref={groupRef}
        style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 30 }}
        // Sélecteur visible pour debog rapide si besoin
        data-ob-right-buttons={pos.anchored ? "anchored" : "fallback"}
        className="flex items-center gap-3"
      >
        {/* Bouton + */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={mini}
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

        {/* Bouton clé (placeholder) */}
        <button
          type="button"
          aria-label="Accéder à mon espace"
          className={mini}
        >
          <KeyRound className="h-6 w-6 text-amber-500" />
        </button>
      </div>

      {/* Modal d’inscription (inchangé) */}
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
}
