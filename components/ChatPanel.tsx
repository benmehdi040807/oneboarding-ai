"use client";

import React, { useEffect, useRef, useState } from "react";

type Lang = "fr" | "en" | "ar";

/* =================== Lang helper =================== */

function readLang(): Lang {
  if (typeof document === "undefined") return "fr";
  const fromDom = document.documentElement.getAttribute("lang");
  if (fromDom === "en" || fromDom === "ar") return fromDom;

  try {
    const ls = localStorage.getItem("oneboarding.lang") as Lang | null;
    if (ls === "en" || ls === "ar") return ls;
  } catch {}

  return "fr";
}

/* =================== Icônes =================== */

function PaperClipIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M8.5 12.75 13 8.25a2.5 2.5 0 1 1 3.54 3.54l-5.66 5.66a3.75 3.75 0 1 1-5.3-5.3l5.3-5.3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 4.5a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 1 1-5 0v-4A2.5 2.5 0 0 1 12 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <path
        d="M7.75 11.5a4.25 4.25 0 0 0 8.5 0M12 15.75V19m-3 0h6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M5 5.5 19 12 5 18.5l2.5-6L12 12l-4.5-.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =================== ChatPanel =================== */

export default function ChatPanel() {
  const [lang, setLang] = useState<Lang>("fr");
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Micro : état local pour l’effet visuel
  const [micListening, setMicListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);

  /* Langue réactive */
  useEffect(() => {
    setLang(readLang());

    const onLangChanged = () => setLang(readLang());
    window.addEventListener("ob:lang-changed", onLangChanged as EventListener);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "oneboarding.lang") setLang(readLang());
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(
        "ob:lang-changed",
        onLangChanged as EventListener
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /* Détection très simple du support micro (pour griser le bouton si besoin) */
  useEffect(() => {
    try {
      const w = window as any;
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
      setMicSupported(!!SR);
    } catch {
      setMicSupported(false);
    }
  }, []);

  /* Libellés */
  const placeholder =
    lang === "ar"
      ? "اكتب هنا..."
      : lang === "en"
      ? "Write here..."
      : "Écrivez ici...";

  const sendLabel =
    lang === "ar" ? "إرسال" : lang === "en" ? "Send" : "Envoyer";

  /* Envoi du message */
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const value = text.trim();
    if (!value) return;

    window.dispatchEvent(
      new CustomEvent("ob:chat-submit", {
        detail: { text: value, lang },
      })
    );

    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /* Auto-resize du textarea, plus d’espace d’écriture */
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const next = Math.min(ta.scrollHeight, 220);
    ta.style.height = next + "px";
  };

  /* Upload OCR */
  const handleUploadClick = () => {
    window.dispatchEvent(new Event("ob:open-ocr-picker"));
  };

  /* Micro :
     - focus textarea (pour la dictée native du clavier sur mobile)
     - envoie l’event à app/page.tsx (WebSpeech si dispo)
     - bascule l’état visuel (halo/pulse)
  */
  const handleMicClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    if (micSupported) {
      setMicListening((prev) => !prev);
      window.dispatchEvent(new Event("ob:toggle-mic"));
    }
  };

  const iconBtnBase =
    "inline-flex items-center justify-center h-10 w-10 rounded-full border border-[var(--border)] bg-white/85 hover:bg-white shadow-sm text-[var(--fg)] transition-all duration-150";

  const sendDisabled = !text.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 rounded-[26px] border border-[var(--border)] bg-white/86 px-4 py-2.5 shadow-md backdrop-blur-md">
        {/* zone de texte — plus large */}
        <div className="flex min-h-[44px] flex-1 flex-col">
          <textarea
            ref={textareaRef}
            data-ob-chat-input
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={placeholder}
            className="w-full flex-1 resize-none border-none bg-transparent px-1 text-base leading-relaxed text-[var(--fg)] outline-none placeholder:text-[var(--fg)]/40"
            dir={lang === "ar" ? "rtl" : "ltr"}
          />
        </div>

        {/* boutons upload + micro */}
        <div className="flex items-center gap-1.5">
          {/* Upload */}
          <button
            type="button"
            onClick={handleUploadClick}
            className={iconBtnBase}
            aria-label="Upload"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>

          {/* Micro */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={!micSupported}
            className={`${iconBtnBase} ${
              !micSupported
                ? "cursor-not-allowed opacity-45"
                : micListening
                ? "bg-[var(--panel)] text-white ring-2 ring-[var(--accent)] mic-pulse"
                : ""
            }`}
            aria-label="Dictée vocale"
          >
            <MicIcon className="h-5 w-5" />
          </button>
        </div>

        {/* bouton Envoyer */}
        <button
          type="submit"
          disabled={sendDisabled}
          className={`inline-flex h-10 items-center justify-center rounded-full border border-[var(--panel-strong)] bg-[var(--panel)] px-4 text-sm font-semibold text-white shadow-md hover:bg-[var(--panel-strong)] ${
            sendDisabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          <span className="mr-1">
            <SendIcon className="h-4 w-4" />
          </span>
          {sendLabel}
        </button>
      </div>
    </form>
  );
}
