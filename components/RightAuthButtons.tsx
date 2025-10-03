"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, KeyRound } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

/**
 * Ancre les deux boutons juste sous la barre "Votre question",
 * en s’insérant dans le même conteneur (portal).
 * Aucune dépendance à la barre CGU, pas de calcul de coordonnées.
 */
export default function RightAuthButtons() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  // Sélection robuste de la barre (input/textarea/contenteditable)
  function findBarEl(): HTMLElement | null {
    const selectors = [
      'input[placeholder*="Votre question"]',
      'textarea[placeholder*="Votre question"]',
      '[aria-label*="Votre question"]',
      '[data-placeholder*="Votre question"]',
      '[role="textbox"]',
    ];
    for (const sel of selectors) {
      const els = Array.from(document.querySelectorAll<HTMLElement>(sel));
      // on garde un champ "large" (la vraie barre)
      const cand = els.find((e) => e.getBoundingClientRect().width > 280);
      if (cand) return cand;
    }
    return null;
  }

  // Monte un host dans le même parent que la barre
  useLayoutEffect(() => {
    const bar = findBarEl();
    if (!bar) return;

    const parent = bar.parentElement as HTMLElement | null;
    if (!parent) return;

    // force le parent en "relative" si c'est "static" (pour l'absolute de nos boutons)
    const cs = window.getComputedStyle(parent);
    if (cs.position === "static") parent.style.position = "relative";

    // crée l'hôte s'il n'existe pas
    const host = document.createElement("div");
    hostRef.current = host;
    host.style.position = "absolute";
    host.style.right = "0";     // aligné à droite de la barre
    host.style.top = "100%";    // juste sous la barre
    host.style.marginTop = "12px";
    host.style.zIndex = "30";

    parent.appendChild(host);
    setMountNode(host);

    return () => {
      try {
        host.remove();
      } catch {}
      hostRef.current = null;
      setMountNode(null);
    };
  }, []);

  const mini =
    "h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow flex items-center justify-center";

  // Rien tant que l’hôte n’est pas prêt
  if (!mountNode) return null;

  return createPortal(
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpen(true)}
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

      <SubscribeModal open={open} onClose={() => setOpen(false)} />
    </>,
    mountNode
  );
}
