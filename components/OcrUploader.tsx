"use client";

import React, { useRef, useState } from "react";

type Props = {
  // Liste des fichiers sélectionnés (ou [] si plus rien)
  onSubmit: (files: File[] | null) => void;
};

const MAX_FILES = 10;

export function OcrUploader({ onSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;

    const current = [...files];
    const incoming = Array.from(list);

    const available = Math.max(0, MAX_FILES - current.length);
    const toAdd = incoming.slice(0, available);

    const next = [...current, ...toAdd];
    setFiles(next);
    onSubmit(next);
  };

  const handleRemove = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onSubmit(next);
    if (next.length === 0 && inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemoveAll = () => {
    setFiles([]);
    onSubmit([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-3 py-2 shadow-sm">
      {/* Ligne de commande : bouton + compteur */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--fg)] shadow-sm active:scale-95"
        >
          <span className="text-base leading-none">📎</span>
          <span className="tabular-nums text-[11px]">
            {files.length}/{MAX_FILES}
          </span>
        </button>

        {files.length > 0 && (
          <button
            type="button"
            onClick={handleRemoveAll}
            className="inline-flex items-center justify-center rounded-full bg-black/6 px-2 py-1 text-[11px] text-[var(--fg)]/70 hover:bg-black/12 active:scale-95"
          >
            ✕
          </button>
        )}
      </div>

      {/* Liste des fichiers sélectionnés */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, idx) => (
            <div
              key={`${idx}-${f.name}`}
              className="flex items-center justify-between rounded-xl bg-white/90 px-2 py-1 text-xs text-[var(--fg)]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--chip-bg)]">
                  <span className="text-[13px]">📄</span>
                </div>
                <span className="truncate text-[11px]">{f.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="ml-2 text-[11px] text-[var(--fg)]/60 hover:text-[var(--fg)]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* input natif totalement caché, déclenché par 📎 ou par le trombone externe */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

export default OcrUploader;
