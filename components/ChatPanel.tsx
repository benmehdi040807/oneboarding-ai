"use client";

import React, { useEffect, useRef, useState } from "react";

type Lang = "fr" | "en" | "ar";

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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M5 5.5 19 12 5 18.5l2.5-6L12 12l-4.5-0.5Z"
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

  // état micro (venant de app/page via ob:mic-state)
  const [micListening, setMicListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);

  useEffect(() => {
    setLang(readLang());
    const onLangChanged = () => setLang(readLang());
    window.addEventListener("ob:lang-changed", onLangChanged as EventListener);
    return () =>
      window.removeEventListener(
        "ob:lang-changed",
        onLangChanged as EventListener
      );
  }, []);

  useEffect(() => {
    const onMicState = (evt: Event) => {
      const e = evt as CustomEvent<{ listening: boolean; supported: boolean }>;
      setMicListening(!!e.detail?.listening);
      setMicSupported(!!e.detail?.supported);
    };
    window.addEventListener("ob:mic-state", onMicState as EventListener);
    return () =>
      window.removeEventListener("ob:mic-state", onMicState as EventListener);
  }, []);

  const placeholder =
    lang === "ar"
      ? "اكتب هنا..."
      : lang === "en"
      ? "Write here..."
      : "Écrivez ici...";

  const sendLabel =
    lang === "ar" ? "إرسال" : lang === "en" ? "Send" : "Envoyer";

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

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const next = Math.min(ta.scrollHeight, 200);
    ta.style.height = next + "px";
  };

  const handleUploadClick = () => {
    window.dispatchEvent(new Event("ob:open-ocr-picker"));
  };

  const handleMicClick = () => {
    window.dispatchEvent(new Event("ob:toggle-mic"));
  };

  const iconBtnBase =
    "inline-flex items-center justify-center h-11 w-11 rounded-full border border-[var(--border)] bg-white/80 hover:bg-white shadow-sm text-[var(--fg)] transition-all duration-150";

  const sendDisabled = !text.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-md border border-[var(--border)] px-3 py-2 flex items-end gap-2">
        {/* zone de texte */}
        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            data-ob-chat-input
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={placeholder}
            className="w-full resize-none border-none bg-transparent outline-none text-[var(--fg)] text-base leading-relaxed placeholder:text-[var(--fg)]/40 pt-1 pb-2 px-1"
            dir={lang === "ar" ? "rtl" : "ltr"}
          />
        </div>

        {/* boutons gauche (upload + micro) */}
        <div className="flex items-center gap-1 pr-1">
          {/* Upload */}
          <button
            type="button"
            onClick={handleUploadClick}
            className={iconBtnBase}
            aria-label="Joindre un fichier"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>

          {/* Micro */}
          <button
            type="button"
            onClick={handleMicClick}
            className={`${iconBtnBase} ${
              micListening
                ? "bg-[var(--panel)] text-white mic-pulse"
                : micSupported
                ? ""
                : "opacity-60"
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
          className={`inline-flex items-center justify-center h-11 px-5 rounded-full bg-[var(--panel)] hover:bg-[var(--panel-strong)] text-white font-semibold shadow-md border border-[var(--panel-strong)] text-sm ${
            sendDisabled ? "opacity-50 cursor-not-allowed" : ""
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
