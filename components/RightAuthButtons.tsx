"use client";

import { useEffect, useRef, useState } from "react";
import SubscribeModal from "./SubscribeModal";

/** ----------------- Bannière immersive type « mini barre » ----------------- */
function WelcomeBannerOverBar() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;

  // Constantes validées
  const BANNER_H = 27; // px
  const GAP_Y = 6;     // px

  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    if (!host || !bar) return;

    const barRect = bar.getBoundingClientRect();
    const okBtn =
      (Array.from(document.querySelectorAll("button")).find(
        (b) => (b.textContent || "").trim() === "OK" || (b.getAttribute("aria-label") || "").toLowerCase() === "ok"
      ) as HTMLElement) || null;
    const rightEdge = okBtn ? okBtn.getBoundingClientRect().right : barRect.right;

    const width = Math.max(180, rightEdge - barRect.left);
    const height = BANNER_H;
    const top = Math.max(8, barRect.top - GAP_Y - height);
    const left = barRect.left;

    host.style.cssText = `
      position: fixed;
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      height: ${height}px;
      z-index: 60;
      display: block;
      pointer-events: none;
      border-radius: 12px;
    `;
  };

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "block";
    document.body.appendChild(host);
    hostRef.current = host;
    setMounted(true);

    const load = () => {
      const p = typeof window !== "undefined" ? localStorage.getItem("ob_profile") : null;
      const prof = p ? JSON.parse(p) : null;
      setFirstName(prof?.firstName ?? null);
      setActive(localStorage.getItem("ob_connected") === "1");
    };
    load();

    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    window.addEventListener("ob:profile-changed", onChange);

    const ro = new ResizeObserver(position);
    const bar = getBarEl();
    if (bar) ro.observe(bar);

    window.addEventListener("resize", position, { passive: true });
    window.addEventListener("scroll", position, { passive: true });
    window.addEventListener("load", position, { once: true });

    const t1 = setTimeout(position, 40);
    const t2 = setTimeout(position, 140);
    const t3 = setTimeout(position, 300);

    return () => {
      window.removeEventListener("ob:connected-changed", onChange);
      window.removeEventListener("ob:profile-changed", onChange);
      ro.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      host.remove();
    };
  }, []);

  if (!mounted || !hostRef.current || !active || !firstName) return null;

  // On injecte directement dans le host (pas besoin de createPortal ici)
  hostRef.current.innerHTML = "";
  const container = document.createElement("div");
  container.className = "w-full h-full flex items-center justify-center px-3";
  Object.assign(container.style, {
    background: "rgba(17,24,39,0.12)",
    boxShadow: "0 10px 24px rgba(0,0,0,.14)",
    borderRadius: "12px",
  });

  const inner = document.createElement("div");
  inner.className = "truncate text-center text-[12px] sm:text-[13px] text-white font-medium";
  inner.innerHTML =
    `Bonjour&nbsp;${firstName}&nbsp;` +
    "○&nbsp;<span class='font-semibold'>Espace</span>&nbsp;désormais&nbsp;:&nbsp;" +
    `<span class='font-extrabold' style="-webkit-background-clip:text;-webkit-text-fill-color:transparent;background:linear-gradient(90deg,#3b82f6,#06b6d4);">Actif</span>`;
  container.appendChild(inner);

  // Monte à chaque render (léger mais sûr)
  requestAnimationFrame(() => {
    try {
      hostRef.current?.appendChild(container);
    } catch {}
  });

  return null;
}

/** ------------------------- Boutons droits (inline) ------------------------ */
export default function RightAuthButtons() {
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  const circle =
    // EXACTEMENT la même classe que les boutons GAUCHE (effet miroir)
    "h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] " +
    "hover:bg-[var(--chip-hover)] grid place-items-center transition select-none";

  const onGoldClick = () => {
    const profile = localStorage.getItem("ob_profile");
    if (connected) {
      // Déconnexion
      localStorage.setItem("ob_connected", "0");
      window.dispatchEvent(new Event("ob:connected-changed"));
    } else {
      // Connexion : si profil existe → connecter ; sinon ouvrir création d’espace
      if (profile) {
        localStorage.setItem("ob_connected", "1");
        window.dispatchEvent(new Event("ob:connected-changed"));
      } else {
        setOpenSubscribe(true);
      }
    }
  };

  return (
    <>
      {/* Boutons rendus INLINE, donc toujours visibles */}
      <div className="flex items-center gap-3">
        {/* Création d’espace (O dégradé bleu→turquoise) */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={circle}
          title="Créer mon espace"
        >
          <span
            className="text-xl font-extrabold"
            style={{
              lineHeight: 1,
              background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            O
          </span>
        </button>

        {/* Connexion / Déconnexion (doré, dégradé doux) */}
        <button
          type="button"
          aria-label={connected ? "Se déconnecter" : "Se connecter"}
          className={circle}
          onClick={onGoldClick}
          title={connected ? "Se déconnecter" : "Se connecter"}
        >
          <span
            className="text-xl font-extrabold"
            style={{
              lineHeight: 1,
              background: "linear-gradient(90deg,#FFD451,#EABE3F,#D9D1C0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            O
          </span>
        </button>
      </div>

      {/* Bannière immersive au-dessus de la barre */}
      <WelcomeBannerOverBar />

      {/* Modal de création d’espace */}
      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>
  );
}
