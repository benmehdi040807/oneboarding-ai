"use client";

import React, { useEffect, useRef, useState } from "react";

type OcrUploaderProps = {
  onSubmit?: (files: File[]) => void;
};

type OcrFile = {
  id: string;
  file: File;
  name: string;
  sizeLabel: string;
};

const MAX_FILES = 10;
const MAX_SIZE = 15 * 1024 * 1024; // 15 Mo

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} Ko`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} Mo`;
}

export default function OcrUploader({ onSubmit }: OcrUploaderProps) {
  const [files, setFiles] = useState<OcrFile[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasFiles = files.length > 0;
  const remainingSlots = MAX_FILES - files.length;

  // ▶️ Clic sur l’icône upload dans ChatPanel
  useEffect(() => {
    const onOpen = () => {
      if (!inputRef.current) return;
      inputRef.current.click();
    };
    window.addEventListener("ob:open-ocr-picker", onOpen as EventListener);
    return () =>
      window.removeEventListener("ob:open-ocr-picker", onOpen as EventListener);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (!list.length) return;

    if (remainingSlots <= 0) {
      e.target.value = "";
      return;
    }

    let accepted = list;
    if (list.length > remainingSlots) {
      accepted = list.slice(0, remainingSlots);
    }

    const mapped: OcrFile[] = accepted
      .map((f, idx) => {
        if (f.size > MAX_SIZE) return null as any;
        return {
          id: `${Date.now()}-${idx}-${f.name}`,
          file: f,
          name: f.name,
          sizeLabel: humanSize(f.size),
        };
      })
      .filter(Boolean);

    const merged = [...files, ...mapped];
    setFiles(merged);

    // on reset pour pouvoir re-sélectionner le même fichier plus tard
    e.target.value = "";
  }

  function handleRemove(id: string) {
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
  }

  function handleRemoveAll() {
    setFiles([]);
  }

  // Envoi des fichiers bruts vers le parent (backend OCR)
  useEffect(() => {
    if (onSubmit) {
      onSubmit(files.map((f) => f.file));
    }
  }, [files, onSubmit]);

  return (
    <>
      {/* input natif, jamais visible, déclenché par l’event */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={handleChange}
        className="hidden"
      />

      {/* Carte attachée : n’apparaît QUE s’il y a des fichiers */}
      {hasFiles && (
        <div className="mb-3 w-full rounded-[26px] border border-white/70 bg-white/96 px-4 py-3 shadow-lg backdrop-blur-[2px]">
          {/* En-tête  📎 2/10   [Effacer tout] */}
          <div className="mb-2 flex items-center justify-between text-xs text-[var(--fg)]/80">
            <div className="inline-flex items-center gap-1 rounded-full bg-[var(--panel)]/8 px-3 py-1">
              <span aria-hidden="true">📎</span>
              <span>
                {files.length}/{MAX_FILES}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveAll}
              className="text-[11px] font-medium text-[var(--fg)]/70 underline-offset-2 hover:underline"
            >
              Effacer tout
            </button>
          </div>

          {/* Liste des fichiers */}
          <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-xl bg-[var(--panel)]/6 px-3 py-1.5 text-xs text-[var(--fg)]"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[11px] font-medium">
                    {f.name}
                  </span>
                  <span className="text-[10px] opacity-70">
                    {f.sizeLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(f.id)}
                  className="ml-3 text-[11px] font-semibold text-[var(--fg)]/70 hover:text-[var(--fg)]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
