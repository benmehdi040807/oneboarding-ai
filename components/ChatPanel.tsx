// components/ChatPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";

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

  /* ====== Réaction à l’effacement global de l’historique ====== */
  useEffect(() => {
    function onCleared() {
      // L’historique est vidé par la Page ; ici on nettoie juste l’input.
      setInput("");
    }

    window.addEventListener("ob:history-cleared", onCleared as EventListener);
    return () => {
      window.removeEventListener("ob:history-cleared", onCleared as EventListener);
    };
  }, []);

  /* ====== Envoi du message ====== */
  function onSend() {
    const text = input.trim();
    if (!text) return;

    window.dispatchEvent(
      new CustomEvent("ob:chat-submit", {
        detail: { text, lang },
      })
    );

    setInput("");
    requestAnimationFrame(() => taRef.current?.focus());
  }

  /* ====== Libellés UI ====== */
  const isRTL = lang === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const align = isRTL ? "text-right" : "text-left";

  const LABELS: Record<Lang, { placeholder: string; send: string }> = {
    fr: {
      placeholder: "Écrivez ici…",
      send: "Envoyer",
    },
    en: {
      placeholder: "Type here…",
      send: "Send",
    },
    ar: {
      placeholder: "اكتب هنا…",
      send: "إرسال",
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
            type="button"
            onClick={onSend}
            disabled={!input.trim()}
            className={`
              inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold
              text-white transition
              ${!input.trim()
                ? "opacity-60 cursor-not-allowed"
                : "hover:opacity-90"}
            `}
            style={{ background: "linear-gradient(135deg,#111827,#374151)" }}
          >
            {t.send}
          </button>
        </div>
      </div>
    </section>
  );
             }
