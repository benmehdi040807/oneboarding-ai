"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, KeyRound } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

export default function RightAuthButtons() {
  const [mounted, setMounted] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [openSubscribe, setOpenSubscribe] = useState(false);

  // Trouve la barre "Votre question"
  function findBar(): HTMLElement | null {
    const sels = [
      'input[placeholder*="Votre question"]',
      'textarea[placeholder*="Votre question"]',
      '[aria-label*="Votre question"]',
      '[data-placeholder*="Votre question"]',
      '[role="textbox"]',
    ];
    for (const s of sels) {
      const el = Array.from(document.querySelectorAll<HTMLElement>(s)).find(
        (e) => e.getBoundingClientRect().width > 280
      );
      if (el) return el;
    }
    return null;
  }

  // Position : sous la barre, bord droit (miroir des icônes de gauche)
  const positionHost = () => {
    const host = hostRef.current;
    if (!host) return;
    const bar = findBar();
    if (!bar) {
      host.style.display = "none";
      return;
    }
    const r = bar.getBoundingClientRect();
    host.style.display = "block";
    host.style.position = "fixed";
    // Espace vertical sous la barre
    const gapY = 16;
    // On aligne le groupe sur le BORD DROIT de la barre,
    // en utilisant "right" (plus fiable quelles que soient les largeurs)
    const right = Math.max(0, Math.round(window.innerWidth - r.right));
    host.style.top = `${Math.round(r.bottom + gapY)}px`;
    host.style.right = `${right}px`;
    host.style.left = "auto";
    host.style.zIndex = "2147483647";
    host.style.pointerEvents = "auto";
  };

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "none";
    hostRef.current = host;
    document.body.appendChild(host);
    setMounted(true);

    const ro = new ResizeObserver(positionHost);
    const mo = new MutationObserver(positionHost);
    const bar = findBar();
    if (bar) ro.observe(bar);
    mo.observe(document.body, { subtree: true, childList: true, attributes: true });

    const onScroll = () => positionHost();
    const onResize = () => positionHost();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    const t1 = setTimeout(positionHost, 0);
    const t2 = setTimeout(positionHost, 150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      try { ro.disconnect(); } catch {}
      try { mo.disconnect(); } catch {}
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      try { host.remove(); } catch {}
      hostRef.current = null;
    };
  }, []);

  if (!mounted || !hostRef.current) return null;

  const btn = "h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow flex items-center justify-center";

  return createPortal(
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={btn}
        >
          <Plus className="h-6 w-6 text-black/80" />
        </button>

        <button
          type="button"
          aria-label="Accéder à mon espace"
          className={btn}
        >
          <KeyRound className="h-6 w-6 text-amber-500" />
        </button>
      </div>

      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>,
    hostRef.current
  );
}
