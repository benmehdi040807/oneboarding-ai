// components/ChatPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Lang = "fr" | "en" | "ar";

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
  const [input, setInput] = useState("");

  // état visuel du micro (vient de Page via ob:mic-state)
  const [micListening, setMicListening] = useState(false);

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

  /* ====== Sync DOM → state (micro / input bridge) ====== */
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

  /* ====== Reset input quand l’historique est effacé ====== */
  useEffect(() => {
    function onCleared() {
      setInput("");
    }
    window.addEventListener("ob:history-cleared", onCleared as EventListener);
    return () =>
      window.removeEventListener("ob:history-cleared", onCleared as EventListener);
  }, []);

  /* ====== Écoute de l’état du micro (Page → ChatPanel) ====== */
  useEffect(() => {
    const onMicState = (e: Event) => {
      const detail = (e as CustomEvent<{ listening?: boolean }>).detail;
      setMicListening(Boolean(detail?.listening));
    };
    window.addEventListener("ob:mic-state", onMicState as EventListener);
    return () => {
      window.removeEventListener("ob:mic-state", onMicState as EventListener);
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

  /* ====== Actions : joindre / micro ====== */
  function onAttachClick() {
    // Demande à la Page d’ouvrir le tiroir OCR + file picker
    window.dispatchEvent(new Event("ob:open-ocr-picker"));
  }

  function onMicClick() {
    window.dispatchEvent(new Event("ob:toggle-mic"));
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
      <div
        className={`
          rounded-2xl border border-black/10 bg-white/80 text-black shadow-sm
          p-3 sm:p-4
        `}
      >
        <textarea
          ref={taRef}
          data-ob-chat-input
          className={`
            w-full resize-none outline-none
            leading-6 text-[15px] placeholder-black/40 bg-transparent
            ${isRTL ? "text-right" : "text-left"}
          `}
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          dir={dir}
          aria-label="Zone de saisie du message"
        />

        <div className="mt-3 flex items-center justify-between">
          {/* Zone gauche : joindre + micro */}
          <div className="flex items-center gap-2">
            {/* Joindre */}
            <button
              type="button"
              onClick={onAttachClick}
              className={`
                h-10 w-10 sm:h-11 sm:w-11 rounded-xl
                flex items-center justify-center
                border border-black/5
                bg-white/70 hover:bg-white
                shadow-sm
              `}
              aria-label="Joindre un document"
            >
              <svg
                className="h-5 w-5 text-sky-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l8.49-8.49a4 4 0 015.66 5.66L10 16.83a2 2 0 11-2.83-2.83l7.78-7.78" />
              </svg>
            </button>

            {/* Micro */}
            <button
              type="button"
              onClick={onMicClick}
              className={`
                h-10 w-10 sm:h-11 sm:w-11 rounded-xl
                flex items-center justify-center
                border border-black/10
                bg-[#0b1b2b]
                text-white
                shadow-sm
                ${micListening ? "mic-pulse" : "hover:bg-slate-900"}
              `}
              aria-label={
                micListening ? "Arrêter l’enregistrement" : "Saisie vocale"
              }
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1.5a3 3 0 00-3 3v7a3 3 0 006 0v-7a3 3 0 00-3-3z" />
                <path d="M19 10.5a7 7 0 01-14 0" />
                <path d="M12 21v-3" />
              </svg>
            </button>
          </div>

          {/* Bouton Envoyer */}
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim()}
            className={`
              inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold
              text-white transition
              ${
                !input.trim()
                  ? "opacity-60 cursor-not-allowed bg-slate-600"
                  : "hover:opacity-90"
              }
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
