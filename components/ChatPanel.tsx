// components/ChatPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import WelcomeLimitDialog from "@/components/WelcomeLimitDialog";
import { consumeOne } from "@/lib/quotaClient";

type Lang = "fr" | "en" | "ar";

/* Langue initiale
   - priorité URL ?lang=
   - sinon localStorage.oneboarding.lang
   - sinon <html lang=...>
   - sinon "en" (langue par défaut validée)
*/
function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const sp = new URLSearchParams(window.location.search);
    const qRaw =
      sp.get("lang") ||
      document.documentElement.lang ||
      localStorage.getItem("oneboarding.lang") ||
      "en";

    const q = qRaw.toLowerCase().trim();
    return (["fr", "en", "ar"].includes(q) ? (q as Lang) : "en");
  } catch {
    return "en";
  }
}

export default function ChatPanel() {
  const [lang, setLang] = useState<Lang>(getInitialLang());

  // Texte tapé par l'utilisateur
  const [input, setInput] = useState("");

  // Pendant l'envoi
  const [sending, setSending] = useState(false);

  // Contrôle de la modale paywall / bienvenue
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  // Etat "premium actif" => si true, on ne bloque plus sur la limite gratuite
  const [unlocked, setUnlocked] = useState(false);

  const taRef = useRef<HTMLTextAreaElement | null>(null);

  /* ====== Sync langue (Menu, URL) ====== */
  useEffect(() => {
    const onLang = (e: Event) => {
      const detail = (e as CustomEvent).detail as { lang?: string } | undefined;
      const nextGuess =
        (detail?.lang as Lang) ||
        (localStorage.getItem("oneboarding.lang") as Lang) ||
        (document.documentElement.lang as Lang) ||
        "en";

      const v = (["fr", "en", "ar"].includes(nextGuess) ? (nextGuess as Lang) : "en");
      setLang(v);
    };

    const onUrl = () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const q = (sp.get("lang") || "").toLowerCase();
        if (q && (["fr", "en", "ar"] as const).includes(q as Lang)) {
          setLang(q as Lang);
        }
      } catch {
        /* noop */
      }
    };

    window.addEventListener("ob:lang-changed", onLang as EventListener);
    window.addEventListener("ob:url-changed", onUrl as EventListener);

    return () => {
      window.removeEventListener("ob:lang-changed", onLang as EventListener);
      window.removeEventListener("ob:url-changed", onUrl as EventListener);
    };
  }, []);

  /* ====== Focus externe éventuel ====== */
  useEffect(() => {
    const onFocusReq = () => taRef.current?.focus();
    window.addEventListener("ob:focus-input", onFocusReq);
    return () => window.removeEventListener("ob:focus-input", onFocusReq);
  }, []);

  /* ====== Injection micro → sync React ======
     La page parent écrit directement dans <textarea data-ob-chat-input>
     et déclenche un Event("input", { bubbles: true }).
     Ici on écoute en capture et on recolle la valeur DOM dans le state React.
  */
  useEffect(() => {
    const syncFromDom = (ev: Event) => {
      const ta = taRef.current;
      if (!ta) return;
      if (ev.target === ta) {
        setInput(ta.value);
      }
    };
    window.addEventListener("input", syncFromDom, true);
    return () => window.removeEventListener("input", syncFromDom, true);
  }, []);

  /* ====== IMPORTANT : écouter les events globaux
     - ob:history-cleared  => reset propre sans reload
     - ob:subscription-active / ob:device-authorized => accès illimité validé
  */
  useEffect(() => {
    function onCleared() {
      // On efface juste l'input et on ferme la modale de limite.
      // (L'historique a déjà été vidé par la Page)
      setInput("");
      setWelcomeOpen(false);
      // on ne touche pas "unlocked", ça reste ce qu'il est
    }

    function onUnlocked() {
      // Dès qu'un device est autorisé ou qu'un paiement est confirmé,
      // le chat devient illimité, donc plus de blocage à 3/jour
      setUnlocked(true);
      setWelcomeOpen(false);
    }

    window.addEventListener("ob:history-cleared", onCleared as EventListener);
    window.addEventListener("ob:subscription-active", onUnlocked as EventListener);
    window.addEventListener("ob:device-authorized", onUnlocked as EventListener);

    return () => {
      window.removeEventListener("ob:history-cleared", onCleared as EventListener);
      window.removeEventListener("ob:subscription-active", onUnlocked as EventListener);
      window.removeEventListener("ob:device-authorized", onUnlocked as EventListener);
    };
  }, []);

  /* ====== Envoi du message ====== */
  async function onSend() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      if (!unlocked) {
        // mode gratuit : consomme 1 interaction
        const res = await consumeOne();

        if (!res.ok && res.code === "LIMIT_REACHED") {
          // Quota atteint → on ouvre la modale d'activation premium
          setWelcomeOpen(true);
          return;
        }

        if (!res.ok) {
          console.warn("Unexpected quota response:", res);
          return;
        }
      }

      // Ici soit on est en mode gratuit encore valable,
      // soit on est déjà "unlocked" (= illimité après abonnement / autorisation)
      window.dispatchEvent(
        new CustomEvent("ob:chat-submit", {
          detail: { text, lang },
        })
      );
      setInput("");
      requestAnimationFrame(() => taRef.current?.focus());
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  }

  /* ====== Libellés UI ====== */
  const isRTL = lang === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const align = isRTL ? "text-right" : "text-left";

  const LABELS: Record<Lang, { placeholder: string; send: string; sending: string }> = {
    fr: {
      placeholder: "Écrivez ici…",
      send: "Envoyer",
      sending: "Envoi…",
    },
    en: {
      placeholder: "Type here…",
      send: "Send",
      sending: "Sending…",
    },
    ar: {
      placeholder: "اكتب هنا…",
      send: "إرسال",
      sending: "جارٍ الإرسال…",
    },
  };
  const t = LABELS[lang];

  /* ====== Rendu ====== */
  return (
    <section dir={dir} className={`w-full max-w-3xl mx-auto ${align}`}>
      {/* Zone de saisie */}
      <div
        className={`
          rounded-2xl border border-black/10 bg-white text-black shadow-sm
          p-3 sm:p-4
        `}
      >
        <textarea
          ref={taRef}
          data-ob-chat-input
          className={`
            w-full resize-none outline-none
            leading-6 text-[15px] placeholder-black/40
            ${isRTL ? "text-right" : "text-left"}
          `}
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          dir={dir}
          aria-label="Zone de saisie du message"
        />

        <div className={`mt-3 flex ${isRTL ? "justify-start" : "justify-end"}`}>
          <button
            onClick={onSend}
            disabled={sending || !input.trim()}
            className={`
              inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold
              text-white transition
              ${sending || !input.trim()
                ? "opacity-60 cursor-not-allowed"
                : "hover:opacity-90"
              }
            `}
            style={{ background: "linear-gradient(135deg,#111827,#374151)" }}
          >
            {sending ? t.sending : t.send}
          </button>
        </div>
      </div>

      {/* Modale de bienvenue / offre premium quand limite atteinte */}
      <WelcomeLimitDialog
        open={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        lang={lang}
      />
    </section>
  );
}
