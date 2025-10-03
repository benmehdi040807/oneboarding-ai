"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, KeyRound } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

/**
 * Ancrage STRICT aux coordonnées du champ input[placeholder="Votre question…"].
 * - Si l’input n’est pas trouvé, on ne rend rien (pas de fallback).
 * - Z-index élevé (z-50) pour éviter tout souci de superposition/masquage.
 * - Recalcul sur resize/scroll/orientation + ResizeObserver SUR l’input trouvé.
 * - Uniquement ce composant à remplacer. Aucun autre fichier à modifier.
 */

export default function RightAuthButtons() {
  const [openSubscribe, setOpenSubscribe] = useState(false);

  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLInputElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  // Styles identiques aux mini-boutons de gauche
  const mini =
    "h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow flex items-center justify-center";

  // Mesure stricte : uniquement si on trouve l’input cible
  const measure = () => {
    const anchor =
      anchorRef.current ??
      document.querySelector<HTMLInputElement>('input[placeholder="Votre question…"]');

    if (!anchor) {
      // Pas d’input => on cache tout (rien ne se rend).
      anchorRef.current = null;
      setPos(null);
      return;
    }

    anchorRef.current = anchor;

    const r = anchor.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    // Deux boutons (48px chacun) + gap 12px => 108px
    const groupWidth = 48 + 12 + 48;
    const gapBelow = 12; // espace vertical sous la barre

    const top = r.top + scrollY + r.height + gapBelow;
    const left = r.right + scrollX - groupWidth;

    setPos({ top, left });
  };

  useEffect(() => {
    // Mesure initiale
    measure();

    // Observe l’input lui-même (changement de taille/position)
    if (anchorRef.current) {
      roRef.current?.disconnect();
      roRef.current = new ResizeObserver(measure);
      roRef.current.observe(anchorRef.current);
    }

    // Events fenêtre
    const handler = () => measure();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("orientationchange", handler);

    // Petits recalculs après layout/polices
    const t1 = setTimeout(measure, 50);
    const t2 = setTimeout(measure, 200);

    return () => {
      roRef.current?.disconnect();
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler);
      window.removeEventListener("orientationchange", handler);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Si pas d’ancrage trouvé, ne rien afficher
  if (!pos) return null;

  return (
    <>
      {/* Groupe positionné EXACTEMENT contre la barre (bord droit) */}
      <div
        style={{
          position: "absolute",
          top: pos.top,
          left: pos.left,
          zIndex: 50, // > CGU/badges/etc.
        }}
        className="flex items-center gap-3"
      >
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={mini}
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

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
