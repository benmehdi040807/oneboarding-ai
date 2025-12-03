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
      textareaRef.current.style.height = "72px";
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const next = Math.min(ta.scrollHeight, 260);
    ta.style.height = next + "px";
  };

  /* Upload OCR */

  const handleUploadClick = () => {
    // app/page.tsx va ouvrir le sélecteur de fichiers
    window.dispatchEvent(new Event("ob:open-ocr-picker"));
  };

  /* Micro très simple :
     - met le curseur dans la zone de texte
     - tu utilises ensuite le micro natif de ton clavier
  */
  const handleMicClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const end = textareaRef.current.value.length;
      try {
        textareaRef.current.setSelectionRange(end, end);
      } catch {}
    }
  };

  const sendDisabled = !text.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative w-full rounded-[26px] border border-[var(--border)] bg-white shadow-md px-4 py-3">
        {/* Zone de texte haute */}
        <textarea
          ref={textareaRef}
          data-ob-chat-input
          value={text}
          onChange={handleInput}
          // ⚠️ plus de onKeyDown : Entrée = nouvelle ligne
          rows={3}
          placeholder={placeholder}
          className="w-full min-h-[72px] max-h-[260px] resize-none border-none bg-transparent pr-[130px] pb-9 text-base leading-relaxed text-[var(--fg)] outline-none placeholder:text-[var(--fg)]/40"
          dir={lang === "ar" ? "rtl" : "ltr"}
        />

        {/* Boutons upload + micro en bas à gauche */}
        <div className="pointer-events-auto absolute left-4 bottom-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleUploadClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[var(--border)] shadow-sm"
            aria-label="Upload"
          >
            <span className="text-lg" aria-hidden="true">
              📎
            </span>
          </button>

          <button
            type="button"
            onClick={handleMicClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[var(--border)] shadow-sm"
            aria-label="Micro"
          >
            <span className="text-lg" aria-hidden="true">
              🎙
            </span>
          </button>
        </div>

        {/* Bouton Envoyer en bas à droite */}
        <button
          type="submit"
          disabled={sendDisabled}
          className={`pointer-events-auto absolute right-4 bottom-2 inline-flex h-9 items-center justify-center rounded-full border border-[var(--panel-strong)] bg-[var(--panel)] px-4 text-sm font-semibold text-white shadow-md hover:bg-[var(--panel-strong)] ${
            sendDisabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {sendLabel}
        </button>
      </div>
    </form>
  );
    }
