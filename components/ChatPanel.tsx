"use client";

import React, { useEffect, useRef, useState } from "react";

type Lang = "fr" | "en" | "ar";

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

/**
 * Petit type local pour la reco vocale.
 * Pas de SpeechRecognition global → pas d’erreur TS.
 */
type SpeechRec =
  | {
      lang?: string;
      continuous: boolean;
      interimResults: boolean;
      start: () => void;
      stop: () => void;
      addEventListener: (type: "result" | "end" | "error", listener: (ev: any) => void) => void;
      removeEventListener: (type: "result" | "end" | "error", listener: (ev: any) => void) => void;
    }
  | null;

/* =================== ChatPanel =================== */

export default function ChatPanel() {
  const [lang, setLang] = useState<Lang>("fr");
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [recognition, setRecognition] = useState<SpeechRec>(null);
  const [listening, setListening] = useState(false);

  // Lang dynamique
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

  // Initialisation Web Speech (natif navigateur si dispo)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const AnyWindow = window as any;
    const SR = AnyWindow.SpeechRecognition || AnyWindow.webkitSpeechRecognition;
    if (!SR) {
      setRecognition(null);
      return;
    }

    const rec: any = new SR();
    rec.continuous = true;
    rec.interimResults = false;

    const handleResult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscript += res[0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        setText((prev) =>
          prev
            ? prev.trimEnd() + "\n" + finalTranscript.trim()
            : finalTranscript.trim()
        );
      }
    };

    const handleEnd = () => {
      setListening(false);
    };

    const handleError = () => {
      setListening(false);
    };

    rec.addEventListener("result", handleResult);
    rec.addEventListener("end", handleEnd);
    rec.addEventListener("error", handleError);

    setRecognition(rec as SpeechRec);

    return () => {
      rec.removeEventListener("result", handleResult);
      rec.removeEventListener("end", handleEnd);
      rec.removeEventListener("error", handleError);
      try {
        rec.stop();
      } catch {}
    };
  }, []);

  // adapter la langue de reco
  useEffect(() => {
    if (!recognition) return;
    const code =
      lang === "ar" ? "ar-MA" : lang === "en" ? "en-US" : "fr-FR";
    recognition.lang = code;
  }, [lang, recognition]);

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
      textareaRef.current.style.height = "140px";
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

  // IMPORTANT : Entrée = nouvelle ligne, PAS d’envoi
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // on laisse juste la nouvelle ligne (comportement natif)
      return;
    }
  };

  // Upload : on envoie un event, OcrUploader s’occupe du natif
  const handleUploadClick = () => {
    window.dispatchEvent(new Event("ob:open-ocr-picker"));
  };

  // Micro : toggle reco vocale
  const handleMicClick = () => {
    if (!recognition) return;

    try {
      if (listening) {
        recognition.stop();
        setListening(false);
      } else {
        const code =
          lang === "ar" ? "ar-MA" : lang === "en" ? "en-US" : "fr-FR";
        recognition.lang = code;
        recognition.start();
        setListening(true);
      }
    } catch {
      setListening(false);
    }
  };

  const sendDisabled = !text.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative w-full rounded-[32px] border border-[var(--border)] bg-white px-4 pt-3 pb-9 shadow-lg">
        {/* Grande zone de texte (identité claire, fond blanc) */}
        <textarea
          ref={textareaRef}
          data-ob-chat-input
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={5}
          placeholder={placeholder}
          className="w-full min-h-[140px] max-h-[260px] resize-none border-none bg-transparent pr-[130px] text-base leading-relaxed text-[var(--fg)] outline-none placeholder:text-[var(--fg)]/35"
          dir={lang === "ar" ? "rtl" : "ltr"}
        />

        {/* Boutons bas gauche */}
        <div className="pointer-events-auto absolute left-4 bottom-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleUploadClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white shadow-sm"
            aria-label="Upload"
          >
            <span className="text-lg" aria-hidden="true">
              📎
            </span>
          </button>

          <button
            type="button"
            onClick={handleMicClick}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white shadow-sm transition ${
              listening ? "ring-2 ring-sky-400" : ""
            }`}
            aria-label="Micro"
          >
            <span
              className={`text-lg ${listening ? "animate-pulse" : ""}`}
              aria-hidden="true"
            >
              🎙
            </span>
          </button>
        </div>

        {/* Bouton Envoyer bas droite */}
        <button
          type="submit"
          disabled={sendDisabled}
          className={`pointer-events-auto absolute right-4 bottom-2 inline-flex h-9 items-center justify-center rounded-full border border-[var(--panel-strong)] bg-[var(--panel)] px-5 text-sm font-semibold text-white shadow-md ${
            sendDisabled
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-[var(--panel-strong)]"
          }`}
        >
          {sendLabel}
        </button>
      </div>
    </form>
  );
}
