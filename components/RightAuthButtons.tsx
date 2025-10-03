"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SubscribeModal from "./SubscribeModal";

/** ----------------- Bandeau immersif « clone de la barre » ----------------- */
function WelcomeBannerOverBar() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;
  const getOkEl = () => {
    const btns = Array.from(document.querySelectorAll("button"));
    return (btns.find((b) => (b.textContent || "").trim() === "OK") as HTMLElement) || null;
  };

  // positionne le host au-dessus, même largeur/hauteur que la barre + OK
  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    if (!host || !bar) return;

    const ok = getOkEl();
    const barRect = bar.getBoundingClientRect();
    const rightEdge = ok ? ok.getBoundingClientRect().right : barRect.right;

    const gapY = 10; // espace vertical entre les deux barres
    const top = Math.max(8, barRect.top - gapY - barRect.height);
    const left = barRect.left;
    const width = Math.max(180, rightEdge - barRect.left); // même largeur que barre+OK
    const height = barRect.height;

    const br = getComputedStyle(bar).borderRadius || "9999px";

    host.style.cssText = `
      position: fixed;
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      height: ${height}px;
      z-index: 2147483646;
      display: block;
      pointer-events: none;
    `;
    host.setAttribute("data-br", br);
  };

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "none";
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

    const ro = new ResizeObserver(position);
    const bar = getBarEl();
    const ok = getOkEl();
    if (bar) ro.observe(bar);
    if (ok) ro.observe(ok);
    window.addEventListener("resize", position, { passive: true });
    window.addEventListener("scroll", position, { passive: true });

    const t1 = setTimeout(position, 60);
    const t2 = setTimeout(position, 160);

    return () => {
      window.removeEventListener("ob:connected-changed", onChange);
      ro.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position);
      clearTimeout(t1);
      clearTimeout(t2);
      host.remove();
    };
  }, []);

  if (!mounted || !hostRef.current || !active || !firstName) return null;

  const radius = hostRef.current.getAttribute("data-br") || "9999px";

  return createPortal(
    <div
      className="w-full h-full flex items-center justify-center px-4"
      style={{
        borderRadius: radius as any,
        background: "rgba(17, 24, 39, 0.92)", // même esprit que la barre
        boxShadow: "0 6px 20px rgba(0,0,0,.18)",
      }}
    >
      <div className="truncate text-center text-[12px] sm:text-[13px] text-white/95 font-medium">
        {"Bonjour\u00A0" + firstName}
        {"\u00A0\u25CB\u00A0"}
        <span className="font-semibold">Espace</span>
        {"\u00A0désormais :\u00A0"}
        <span className="font-bold text-green-400">Actif</span>
      </div>
    </div>,
    hostRef.current
  );
}

/** ------------------------- Boutons droits ------------------------ */
export default function RightAuthButtons() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [connected, setConnected] = useState(false);

  // état connecté
  useEffect(() => {
    const load = () => setConnected(localStorage.getItem("ob_connected") === "1");
    load();
    const onChange = () => load();
    window.addEventListener("ob:connected-changed", onChange);
    return () => window.removeEventListener("ob:connected-changed", onChange);
  }, []);

  // helpers DOM
  const getBarEl = () =>
    (document.querySelector('input[placeholder*="Votre question"]') as HTMLElement) ||
    (document.querySelector('textarea[placeholder*="Votre question"]') as HTMLElement) ||
    null;
  const getOkEl = () => {
    const btns = Array.from(document.querySelectorAll("button"));
    return (btns.find((b) => (b.textContent || "").trim() === "OK") as HTMLElement) || null;
  };

  // Positionnement des deux ronds, alignés au bord droit du bouton OK
  const position = () => {
    const host = hostRef.current;
    const bar = getBarEl();
    const ok = getOkEl();
    if (!host || !bar || !ok) return;

    const barRect = bar.getBoundingClientRect();
    const okRect = ok.getBoundingClientRect();

    const BTN = 48;
    const BETWEEN = 10;
    const GAP_Y = 10;

    const totalWidth = 2 * BTN + BETWEEN;
    const rightEdge = okRect.right;
    const left = rightEdge - totalWidth;
    const top = barRect.bottom + GAP_Y;

    host.style.cssText = `
      position: fixed;
      left: ${left}px;
      top: ${top}px;
      z-index: 2147483647;
      display: block;
      pointer-events: auto;
    `;
  };

  useEffect(() => {
    const host = document.createElement("div");
    host.style.display = "none";
    hostRef.current = host;
    document.body.appendChild(host);
    setMounted(true);

    const ro = new ResizeObserver(position);
    const bar = getBarEl();
    const ok = getOkEl();
    if (bar) ro.observe(bar);
    if (ok) ro.observe(ok);

    window.addEventListener("resize", position, { passive: true });
    window.addEventListener("scroll", position, { passive: true });

    const t1 = setTimeout(position, 60);
    const t2 = setTimeout(position, 160);
    const t3 = setTimeout(position, 320);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      ro.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position);
      host.remove();
    };
  }, []);

  if (!mounted || !hostRef.current) return null;

  const circle =
    "h-12 w-12 rounded-full bg-white/85 hover:bg-white/95 shadow " +
    "flex items-center justify-center backdrop-blur select-none";

  const onGoldClick = () => {
    if (connected) {
      // Déconnexion : on garde le profil mais on passe connecté=0
      localStorage.setItem("ob_connected", "0");
      window.dispatchEvent(new Event("ob:connected-changed"));
    } else {
      // Connexion locale (temporaire, en attendant OTP)
      const p = localStorage.getItem("ob_profile");
      if (p) {
        localStorage.setItem("ob_connected", "1");
        window.dispatchEvent(new Event("ob:connected-changed"));
      } else {
        alert("Aucun espace trouvé sur cet appareil.\nCrée ton espace avec le O bleu.");
      }
    }
  };

  return createPortal(
    <>
      <div className="flex items-center gap-[10px]">
        {/* Création d’espace (O dégradé bleu→turquoise) */}
        <button
          type="button"
          aria-label="Créer mon espace"
          onClick={() => setOpenSubscribe(true)}
          className={circle}
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

        {/* Connexion / Déconnexion (toujours doré, dédié auth) */}
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
              background: "linear-gradient(90deg,#FFD451,#EABE3F,#D9D1C0)", // doré → argenté léger
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

      <SubscribeModal open={openSubscribe} onClose={() => setOpenSubscribe(false)} />
    </>,
    hostRef.current
  );
      }
