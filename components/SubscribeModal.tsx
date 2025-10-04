"use client";

import { useEffect, useRef, useState } from "react";
import PhoneField from "./PhoneField";

type Props = { open: boolean; onClose: () => void };

/* Message compact au-dessus de la barre (resté inchangé côté page) */
function WelcomeMessageAboveBar() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const load = () => {
      const p = typeof window !== "undefined" ? localStorage.getItem("ob_profile") : null;
      const prof = p ? JSON.parse(p) : null;
      setFirstName(prof?.firstName ?? null);
      setActive(localStorage.getItem("ob_connected") === "1");
    };
    load();
    window.addEventListener("ob:connected-changed", load);
    window.addEventListener("ob:profile-changed", load);
    return () => {
      window.removeEventListener("ob:connected-changed", load);
      window.removeEventListener("ob:profile-changed", load);
    };
  }, []);

  if (!active || !firstName) return null;

  return (
    <div className="w-full text-center mt-3 mb-2">
      <span className="text-lg font-semibold text-black/80">
        Bonjour {firstName} — Espace désormais :
        <span className="ml-1 font-bold" style={{ background: "linear-gradient(90deg,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Actif
        </span>
      </span>
    </div>
  );
}

export default function SubscribeModal({ open, onClose }: Props) {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [e164, setE164] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Verrouillage scroll de la page quand ouvert
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const prevOBY = (document.body.style as any).overscrollBehaviorY;
    document.body.style.overflow = "hidden";
    (document.body.style as any).overscrollBehaviorY = "contain";
    return () => {
      document.body.style.overflow = prev;
      (document.body.style as any).overscrollBehaviorY = prevOBY ?? "";
    };
  }, [open]);

  // Empêcher pull-to-refresh / overscroll hors du panneau
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current!;
    const panel = panelRef.current!;

    // Helper: l’élément cible peut-il scroller ?
    const canScroll = (el: HTMLElement | null) => {
      while (el && el !== panel && el !== overlay) {
        const style = getComputedStyle(el);
        const oy = style.overflowY;
        if (
          (oy === "auto" || oy === "scroll") &&
          el.scrollHeight > el.clientHeight
        ) {
          return true;
        }
        el = el.parentElement as HTMLElement | null;
      }
      // le panel lui-même peut scroller
      return panel.scrollHeight > panel.clientHeight;
    };

    const preventIfOverlay = (e: Event) => {
      // si le geste part de l’overlay (en dehors du contenu) → on bloque
      if (e.target === overlay) {
        e.preventDefault();
        return;
      }
      // si ça vient de l’intérieur mais aucun parent scrollable → on bloque pour éviter le refresh
      if (!canScroll(e.target as HTMLElement)) {
        e.preventDefault();
      }
    };

    // iOS/Android (tactile)
    overlay.addEventListener("touchmove", preventIfOverlay, { passive: false });
    // Desktop touchpad/roulette
    overlay.addEventListener("wheel", preventIfOverlay, { passive: false });

    return () => {
      overlay.removeEventListener("touchmove", preventIfOverlay);
      overlay.removeEventListener("wheel", preventIfOverlay);
    };
  }, [open]);

  if (!open) return null;

  // Création espace
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !e164) return;
    setSubmitting(true);

    const profile = { firstName, lastName, phone: e164 };
    localStorage.setItem("ob_profile", JSON.stringify(profile));
    localStorage.setItem("ob_connected", "1");

    // Notifier le reste de l’UI (et laisser à React/DOM le temps de respirer)
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("ob:profile-changed"));
      window.dispatchEvent(new Event("ob:connected-changed"));
    });

    setSubmitting(false);
    onClose();
  };

  const baseInput =
    "w-full rounded-2xl border border-black/10 bg-white/60 backdrop-blur " +
    "px-4 py-3 text-black placeholder-white/90 outline-none " +
    "focus:ring-2 focus:ring-[#2E6CF5]/40 focus:border-transparent";

  return (
    <>
      <WelcomeMessageAboveBar />

      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/25 backdrop-blur-md"
        style={{
          overscrollBehavior: "contain",
          touchAction: "none",
        }}
      >
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-white/60
                     bg-[rgba(255,255,255,0.32)] backdrop-blur-2xl shadow-xl p-4 sm:p-6 m-0 sm:m-6"
          style={{
            touchAction: "pan-y",
            overscrollBehavior: "contain",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-black/90">Créer mon espace</h2>
            {/* X universel pour fermer */}
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white/80 hover:bg-white/95 text-black/80
                         flex items-center justify-center text-xl"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="Nom"
              autoComplete="family-name"
              className={baseInput}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoFocus
            />

            <input
              type="text"
              placeholder="Prénom"
              autoComplete="given-name"
              className={baseInput}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            {/* Pays + Indicatif + Numéro */}
            <div
              // wrapper qui contraint aussi les menus portalisés (certains libs les exportent dans body)
              className="relative"
              style={{ overscrollBehavior: "contain" }}
            >
              <PhoneField value={e164} onChange={setE164} />
            </div>

            {/* Bouton principal */}
            <button
              disabled={submitting || !firstName || !lastName || !e164}
              className="w-full rounded-2xl py-5 text-lg font-semibold text-white
                         shadow hover:opacity-95 active:scale-[.99] transition
                         disabled:opacity-60 disabled:cursor-not-allowed
                         bg-[linear-gradient(135deg,#4F8AF9,#2E6CF5)]"
            >
              {submitting ? "Création..." : "Créer mon espace"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
