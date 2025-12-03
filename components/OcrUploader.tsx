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

export function OcrUploader({ onSubmit }: OcrUploaderProps) {
  const [files, setFiles] = useState<OcrFile[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sélection des fichiers
  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (!list.length) return;

    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      // déjà plein → on ignore
      return;
    }

    const accepted = list.slice(0, remaining);

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

    if (!mapped.length) return;

    setFiles((prev) => [...prev, ...mapped]);
    // on laisse input.value vide pour pouvoir re-sélectionner les mêmes noms
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRemoveAll = () => {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Propager vers le parent chaque changement
  useEffect(() => {
    if (onSubmit) onSubmit(files.map((f) => f.file));
  }, [files, onSubmit]);

  // Nettoyage (au cas où)
  useEffect(() => {
    return () => {
      if (inputRef.current) inputRef.current.value = "";
    };
  }, []);

  const count = files.length;

  return (
    <div className="w-full">
      {/* input file caché, déclenché par app/page.tsx */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      {/* Rien à afficher tant qu’aucun fichier */}
      {count === 0 ? null : (
        <div className="rounded-[26px] border border-[var(--border)] bg-white/88 shadow-md px-4 py-3 space-y-3">
          {/* En-tête : compteur + fermer */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-[var(--border)]">
              <span aria-hidden="true" className="text-sm">
                📎
              </span>
              <span className="text-xs font-medium text-[var(--fg)]">
                {count}/{MAX_FILES}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveAll}
              className="text-xs text-[var(--fg)]/70 hover:text-[var(--fg)]"
            >
              ✕
            </button>
          </div>

          {/* Liste des fichiers */}
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-2xl bg-white/90 px-3 py-2 text-xs text-[var(--fg)] shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-base">
                    📄
                  </span>
                  <div className="flex flex-col">
                    <span className="max-w-[220px] truncate">
                      {f.name}
                    </span>
                    <span className="text-[10px] opacity-70">
                      {f.sizeLabel}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(f.id)}
                  className="text-[11px] font-medium opacity-80 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// default export pour les imports existants
export default OcrUploader;
