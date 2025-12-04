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

/* =============== Types upload =============== */

type AttachedFile = {
  id: string;
  file: File;
  name: string;
  sizeLabel: string;
  isImage: boolean;
  previewUrl?: string | null;
};

const MAX_FILES = 3; // ← 3 fichiers max
const MAX_SIZE = 15 * 1024 * 1024; // 15 Mo

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} Ko`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} Mo`;
}

/* =============== Composant principal =============== */

export default function ChatPanel() {
  const [lang, setLang] = useState<Lang>("fr");
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // upload
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // micro
  const [recognition, setRecognition] = useState<any>(null);
  const [listening, setListening] = useState(false);

  /* ---- Langue ---- */

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

  /* ---- Micro (Web Speech natif) ---- */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setRecognition(null);
      return;
    }

    const rec = new SR();
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

    const handleEnd = () => setListening(false);
    const handleError = () => setListening(false);

    rec.addEventListener("result", handleResult);
    rec.addEventListener("end", handleEnd);
    rec.addEventListener("error", handleError);

    setRecognition(rec);

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

  /* ---- Upload natif dans la carte ---- */

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (!list.length) return;

    setFiles((prev) => {
      const current: AttachedFile[] = [...prev];

      for (const f of list) {
        if (current.length >= MAX_FILES) break;
        if (f.size > MAX_SIZE) continue;

        const isImage = f.type.startsWith("image/");
        const previewUrl = isImage ? URL.createObjectURL(f) : null;

        current.push({
          id: `${Date.now()}-${f.name}-${Math.random()
            .toString(16)
            .slice(2)}`,
          file: f,
          name: f.name,
          sizeLabel: humanSize(f.size),
          isImage,
          previewUrl,
        });
      }

      return current;
    });

    // reset input pour pouvoir re-sélectionner les mêmes fichiers ensuite
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      const removed = prev.find((f) => f.id === id);
      if (removed?.previewUrl) {
        try {
          URL.revokeObjectURL(removed.previewUrl);
        } catch {}
      }
      return next;
    });
  };

  const handleClearFiles = () => {
    setFiles((prev) => {
      for (const f of prev) {
        if (f.previewUrl) {
          try {
            URL.revokeObjectURL(f.previewUrl);
          } catch {}
        }
      }
      return [];
    });
  };

  // Notifier le reste de l'app qu'il y a des fichiers sélectionnés
  useEffect(() => {
    const payload = files.map((f) => f.file);
    window.dispatchEvent(
      new CustomEvent("ob:files-selected", { detail: { files: payload } })
    );
  }, [files]);

  /* ---- Micro bouton ---- */

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

  /* ---- Texte & envoi ---- */

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

  const handleKeyDown = (_e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter = retour à la ligne uniquement (jamais d'envoi auto)
    return;
  };

  const sendDisabled = !text.trim();

  /* ---- Rendu ---- */

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* input natif caché pour l'upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={handleFilesChange}
      />

      <div
        className="
          relative w-full
          rounded-[32px]
          border border-white/75
          bg-white/85
          shadow-[0_18px_40px_rgba(15,23,42,0.16)]
          backdrop-blur-md
          px-4 pt-3 pb-10
        "
      >
        {/* Liste des fichiers attachés, en haut de la carte */}
        {files.length > 0 && (
          <div className="mb-2 rounded-2xl border border-sky-100 bg-sky-50/90 px-3 py-2 text-xs text-sky-900">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">📎</span>
                <span className="font-semibold">
                  {files.length}/{MAX_FILES}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearFiles}
                aria-label="Remove all"
                className="text-lg leading-none text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>
            <div className="max-h-28 space-y-1 overflow-y-auto pr-1">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-xl bg-white/90 px-2 py-1 text-[11px]"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {/* Vignette image si disponible */}
                    {f.isImage && f.previewUrl ? (
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={f.previewUrl}
                          alt={f.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 flex-shrink-0 rounded-lg border border-slate-200 bg-slate-50 text-center text-[14px] leading-8">
                        📄
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <span className="block truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {f.sizeLabel}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(f.id)}
                    className="ml-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zone de saisie */}
        <textarea
          ref={textareaRef}
          data-ob-chat-input
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={5}
          placeholder={placeholder}
          className={`w-full min-h-[140px] max-h-[260px] resize-none border-none bg-transparent pr-[64px] text-base leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 ${
            lang === "ar" ? "text-right" : "text-left"
          }`}
          dir={lang === "ar" ? "rtl" : "ltr"}
        />

        {/* Boutons en bas de la carte */}
        <div className="pointer-events-auto absolute left-4 bottom-2 flex items-center gap-2">
          {/* Upload */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm"
            aria-label="Upload"
          >
            <span aria-hidden="true">📎</span>
          </button>

          {/* Micro */}
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

        {/* Envoyer */}
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
