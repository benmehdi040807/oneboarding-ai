"use client";

import React, { useEffect, useRef, useState } from "react";

type Lang = "fr" | "en" | "ar";

/* =================== Lang helper =================== */

function readLang(): Lang {
  if (typeof document === "undefined") return "fr";
  const fromDom = document.documentElement.getAttribute("lang");
  if (fromDom === "en" || fromDom === "ar") return fromDom as Lang;

  try {
    const ls = localStorage.getItem("oneboarding.lang") as Lang | null;
    if (ls === "en" || ls === "ar") return ls;
  } catch {}

  return "fr";
}

/* =================== ChatPanel =================== */

export default function ChatPanel() {
  const [lang, setLang] = useState<Lang>("fr");
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Langue réactive (Menu / localStorage)
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

  /* Micro ultra simple :
     - focus textarea
     - laisse la dictée native / app/page.tsx faire le reste
  */
  const handleMicClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    window.dispatchEvent(new Event("ob:toggle-mic"));
  };

  const sendDisabled = !text.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 rounded-[26px] border border-[var(--border)] bg-white px-4 py-3 shadow-md">
        {/* zone de texte large */}
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
        <div className="flex items-center gap-2 mr-1">
          {/* Upload */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[var(--border)] shadow-sm"
            aria-label="Upload"
          >
            <span className="text-lg" aria-hidden="true">
              📎
            </span>
          </button>

          {/* Micro */}
          <button
            type="button"
            onClick={handleMicClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[var(--border)] shadow-sm"
            aria-label="Micro"
          >
            <span className="text-lg" aria-hidden="true">
              🎙
            </span>
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
          {sendLabel}
        </button>
      </div>
    </form>
  );
}
