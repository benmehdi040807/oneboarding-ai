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

type SpeechRec =
  | {
      lang?: string;
      continuous: boolean;
      interimResults: boolean;
      start: () => void;
      stop: () => void;
      addEventListener: (
        type: "result" | "end" | "error",
        listener: (ev: any) => void
      ) => void;
      removeEventListener: (
        type: "result" | "end" | "error",
        listener: (ev: any) => void
      ) => void;
    }
  | null;

export default function ChatPanel() {
  const [lang, setLang] = useState<Lang>("fr");
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [recognition, setRecognition] = useState<SpeechRec>(null);
  const [listening, setListening] = useState(false);

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

  useEffect(() => {
    if (!recognition) return;
    recognition.lang =
      lang === "ar" ? "ar-MA" : lang === "en" ? "en-US" : "fr-FR";
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter = nouvelle ligne, jamais envoi
    if (e.key === "Enter" && !e.shiftKey) {
      return;
    }
  };

  const handleUploadClick = () => {
    window.dispatchEvent(new Event("ob:open-ocr-picker"));
  };

  const handleMicClick = () => {
    if (!recognition) return;

    try {
      if (listening) {
        recognition.stop();
        setListening(false);
      } else {
        recognition.lang =
          lang === "ar" ? "ar-MA" : lang === "en" ? "en-US" : "fr-FR";
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
      <div className="relative w-full rounded-[32px] border border-slate-200 bg-white px-4 pt-3 pb-9 shadow-lg">
        <textarea
          ref={textareaRef}
          data-ob-chat-input
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={5}
          placeholder={placeholder}
          className="w-full min-h-[140px] max-h-[260px] resize-none border-none bg-transparent pr-[130px] text-base leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
          dir={lang === "ar" ? "rtl" : "ltr"}
        />

        {/* Upload + micro en bas à gauche */}
        <div className="pointer-events-auto absolute left-4 bottom-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleUploadClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm"
            aria-label="Upload"
          >
            <span className="text-lg" aria-hidden="true">
              📎
            </span>
          </button>

          <button
            type="button"
            onClick={handleMicClick}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition ${
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

        {/* Envoyer en bas à droite */}
        <button
          type="submit"
          disabled={sendDisabled}
          className={`pointer-events-auto absolute right-4 bottom-2 inline-flex h-9 items-center justify-center rounded-full border border-slate-800 bg-slate-800 px-5 text-sm font-semibold text-white shadow-md ${
            sendDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-black"
          }`}
        >
          {sendLabel}
        </button>
      </div>
    </form>
  );
      }
