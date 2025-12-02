"use client";

import { useRef, useState } from "react";

type Props = {
  onText: (text: string) => void;
  onPreview?: (url: string | null) => void;
};

type OcrFile = {
  id: string;
  file: File;
  url: string;
  name: string;
  sizeLabel: string;
};

export default function OcrUploader({ onText, onPreview }: Props) {
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  const AUTO_LANG = "fra+eng+ara";
  const MAX_FILES = 10;

  const [files, setFiles] = useState<OcrFile[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorTooMany, setErrorTooMany] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  function humanSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  }

  function clearAll() {
    files.forEach((f) => URL.revokeObjectURL(f.url));
    setFiles([]);
    setRunning(false);
    setProgress(0);
    onText("");
    onPreview?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeOne(id: string) {
    const remaining = files.filter((f) => f.id !== id);
    const removed = files.find((f) => f.id === id);
    if (removed) URL.revokeObjectURL(removed.url);

    setFiles(remaining);

    if (!remaining.length) {
      setProgress(0);
      onText("");
      onPreview?.(null);
      return;
    }

    recognizeAll(remaining);
  }

  async function recognizeAll(list: OcrFile[]) {
    if (!list.length) return;

    setRunning(true);
    setProgress(1);

    let globalText = "";

    try {
      const Tesseract = (await import("tesseract.js")).default as any;

      for (let index = 0; index < list.length; index++) {
        const item = list[index];
        let localText = "";

        for (let i = 1; i <= 3; i++) {
          try {
            const result: any = await Tesseract.recognize(
              item.file,
              AUTO_LANG,
              {
                logger: (m: any) => {
                  if (
                    m?.status === "recognizing text" &&
                    typeof m?.progress === "number"
                  ) {
                    const base = (index / list.length) * 100;
                    const perFile =
                      (Math.max(0, Math.min(1, m.progress)) / list.length) *
                      100;
                    const p = Math.max(
                      1,
                      Math.min(100, Math.round(base + perFile))
                    );
                    setProgress(p);
                  }
                },
              } as any
            );

            const raw = String(result?.data?.text || "");
            localText = raw
              .replace(/[ \t]+\n/g, "\n")
              .replace(/\n{3,}/g, "\n\n")
              .trim();

            if (localText.length > 10) break;
          } catch {
            await new Promise((r) => setTimeout(r, i * 200 + 300));
          }
        }

        if (localText.length > 0) {
          globalText +=
            `\n\n--- Document ${index + 1}: ${item.name} ---\n\n` + localText;
        }
      }
    } catch (e) {
      console.warn("[OCR] error", e);
    }

    setRunning(false);
    setProgress(100);

    if (globalText.trim().length > 10) {
      onText(globalText.trim());
    } else {
      // lecture trop faible -> on n’envoie rien mais on ne casse pas l’UX
      onText("");
    }
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (!list.length) return;

    // 🔴 Vrai plafond : si la sélection dépasse le max → on refuse tout
    if (list.length + files.length > MAX_FILES) {
      setErrorTooMany(true);
      setTimeout(() => setErrorTooMany(false), 1200);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const mapped: OcrFile[] = list
      .map((f, idx) => {
        if (f.size > MAX_SIZE) {
          return null as any;
        }
        const url = URL.createObjectURL(f);
        return {
          id: `${Date.now()}-${idx}-${f.name}`,
          file: f,
          url,
          name: f.name,
          sizeLabel: humanSize(f.size),
        };
      })
      .filter(Boolean);

    const merged = [...files, ...mapped];
    setFiles(merged);

    const first = merged.find((f) => f.file.type.startsWith("image/"));
    onPreview?.(first ? first.url : null);

    recognizeAll(merged);
  }

  const hasFiles = files.length > 0;

  return (
    <div
      className={`rounded-xl border bg-white/5 p-3 transition
        border-white/10
        ${errorTooMany ? "ring-2 ring-red-400" : ""}
      `}
    >
      {/* Top bar: select + count + remove all */}
      <div className="flex items-center gap-2 mb-2">
        <input
          ref={inputRef}
          id="ocr-multi-file"
          type="file"
          accept="image/*,image/heic,image/heif"
          multiple
          onChange={handleSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer select-none px-3 py-2 rounded-xl text-sm font-medium border transition
            ${
              hasFiles
                ? "bg-emerald-500 text-black border-emerald-400"
                : "bg-white text-black hover:bg-gray-200 border-transparent"
            }
            ${running ? "opacity-70 pointer-events-none" : ""}
          `}
          title={hasFiles ? "Add documents" : "Select documents"}
        >
          {hasFiles ? "Add documents" : "Select documents"}
        </button>

        <div className="flex-1 text-xs text-white/70 truncate">
          {hasFiles
            ? `${files.length} file(s) — max ${MAX_FILES}`
            : `0 / ${MAX_FILES} file(s)`}
        </div>

        {hasFiles && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-xs px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25"
            title="Remove all"
          >
            Remove all ✕
          </button>
        )}
      </div>

      {/* List of files with mini-preview */}
      {hasFiles && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg bg-white/10 px-2 py-1"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 rounded-md overflow-hidden bg-white/10 shrink-0">
                  <img
                    src={f.url}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-white/90 truncate">
                    {f.name}
                  </span>
                  <span className="text-[11px] text-white/60">
                    {f.sizeLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeOne(f.id)}
                className="text-[11px] px-2 py-1 rounded-md bg-white/15 hover:bg-white/25"
                title="Remove"
              >
                Remove ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Futuristic status: spinner + bar, sans texte */}
      {(running || progress > 0) && (
        <div className="w-full mt-3 flex items-center gap-2">
          {/* Icône de statut */}
          <div className="h-4 w-4 flex items-center justify-center">
            {running ? (
              <div className="h-4 w-4 rounded-full border-2 border-emerald-300 border-t-transparent animate-spin" />
            ) : progress === 100 && hasFiles ? (
              <div className="h-4 w-4 rounded-full bg-emerald-400 flex items-center justify-center">
                <span className="text-[10px] text-black font-bold">✓</span>
              </div>
            ) : null}
          </div>

          {/* Barre de progression stylisée */}
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
                }
