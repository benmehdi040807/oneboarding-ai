"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, KeyRound } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

export default function RightAuthButtons() {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [openSubscribe, setOpenSubscribe] = useState(false);

  // Sélection robuste de la barre "Votre question"
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
      const cand = els.find((e) => e.getBoundingClientRect().width > 280);
      if (cand) return cand;
    }
    return null;
  }

  // Monte un host à droite de la barre (dans le même parent)
  useLayoutEffect(() => {
    const bar = findBarEl();
    if (!bar || !bar.parentElement) return;

    const parent = bar.parentElement as HTMLElement;

    // le parent doit être positionné
    const cs = window.getComputedStyle(parent);
    if (cs.position === "static") parent.style.position = "relative";

    // crée l’hôte positionné à droite de la barre
    const host = document.createElement("div");
    host.style.position = "absolute";
    host.style.left = "100%";           // collé au bord droit de la barre
    host.style.marginLeft = "16px";     // petit écart
    host.style.top = "50%";             // alignement vertical milieu de la barre
    host.style.transform = "translateY(-50%)";
    host.style.zIndex = "50";           // au-dessus
    parent.appendChild(host);
    setMountNode(host);

    return () => {
      try { host.remove(); } catch {}
      setMountNode(null);
    };
  }, []);

  // Tant que l’hôte n’est pas prêt, on ne rend rien (évite un flash)
  if (!mountNode) return null;

  const btnCls =
    "h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow flex items-center justify-center";

  return createPortal(
    <>
      <div className="flex items-center gap-3">
        {/* + : même rendu que les boutons de gauche */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={btnCls}
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

        {/* Clé (placeholder) */}
        <button
          type="button"
          aria-label="Accéder à mon espace"
          className={btnCls}
        >
          <KeyRound className="h-6 w-6 text-amber-500" />
        </button>
      </div>

      <SubscribeModal
        open={openSubscribe}
        onClose={() => setOpenSubscribe(false)}
      />
    </>,
    mountNode
  );
}
