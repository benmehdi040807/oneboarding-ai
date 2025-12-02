"use client";

import React, { useEffect, useRef, useState } from "react";

type OcrUploaderProps = {
  // On renvoie toujours la liste courante des fichiers vers le parent
  onSubmit: (files: File[]) => void;
};

type OcrFile = {
  id: string;
  file: File;
  url: string;
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
  const [progress, setProgress] = useState(0); // 0 -> 1
  const [isReading, setIsReading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null); // "Max 10 files" / "Only first 10 files kept"
  const inputRef = useRef<HTMLInputElement | null>(null);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);

  const remainingSlots = MAX_FILES - files.length;
  const hasFiles = files.length > 0;

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function showNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => {
      setNotice((current) => (current === msg ? null : current));
    }, 2500);
  }

  function startProgress() {
    // petite animation simple, pas liée à un vrai upload
    if (progressTimer.current) clearInterval(progressTimer.current);
    setIsReading(true);
    setProgress(0.05);

    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 0.12;
        if (next >= 1) {
          if (progressTimer.current) clearInterval(progressTimer.current);
          setIsReading(false);
          return 1;
        }
        return next;
      });
    }, 180);
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (!list.length) return;

    // Aucun slot disponible : on ne touche pas aux fichiers existants
    if (remainingSlots <= 0) {
      showNotice("Max 10 files");
      resetInput();
      return;
    }

    let accepted = list;
    let limited = false;

    // Si la sélection dépasse le nombre de slots restants,
    // on garde uniquement les premiers nécessaires pour atteindre 10.
    if (list.length > remainingSlots) {
      accepted = list.slice(0, remainingSlots);
      limited = true;
    }

    const mapped: OcrFile[] = accepted
      .map((f, idx) => {
        if (f.size > MAX_SIZE) return null as any;
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

    if (limited) {
      showNotice("Only first 10 files kept");
    }

    startProgress();
    resetInput();
  }

  function handleRemove(id: string) {
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
    if (!next.length) {
      setProgress(0);
      setIsReading(false);
    }
  }

  function handleRemoveAll() {
    setFiles([]);
    setProgress(0);
    setIsReading(false);
  }

  // Envoi des fichiers bruts vers le parent à chaque changement
  useEffect(() => {
    onSubmit(files.map((f) => f.file));
  }, [files, onSubmit]);

  // Nettoyage des URL objets
  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      files.forEach((f) => URL.revokeObjectURL(f.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`rounded-xl border bg-white/5 p-3 transition-all ${
        notice ? "border-red-400 ring-1 ring-red-400/70" : "border-white/10"
      }`}
    >
      {/* input natif invisible, déclenché par le bouton trombone externe OU par clic interne */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      {/* En-tête : message + notice courte */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-white/70 px-4 py-1 text-xs font-medium text-sky-700 shadow-sm active:scale-95"
        >
          {hasFiles ? "Add files" : "Upload files"}
        </button>

        {notice && (
          <span className="rounded-full bg-red-500/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            {notice}
          </span>
        )}
      </div>

      {/* Liste des fichiers */}
      {hasFiles && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-white/70">
            <button
              type="button"
              onClick={handleRemoveAll}
              className="text-[11px] font-medium text-white/80 underline-offset-2 hover:underline"
            >
              Remove all ✕
            </button>
            <span>
              {files.length}/{MAX_FILES}
            </span>
          </div>

          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white/90"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 overflow-hidden rounded-md bg-white/20">
                  <img
                    src={f.url}
                    alt={f.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="max-w-[150px] truncate">{f.name}</span>
                  <span className="text-[10px] text-white/60">
                    {f.sizeLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(f.id)}
                className="text-[11px] font-medium text-white/80 hover:text-white"
              >
                Remove ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Barre de lecture/état, même sans texte */}
      <div className="mt-1 flex items-center gap-2">
        <div
          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
            isReading ? "border-sky-400" : "border-emerald-400"
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full ${
              isReading ? "bg-sky-400 animate-pulse" : "bg-emerald-400"
            }`}
          />
        </div>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className={`h-full rounded-full transition-all ${
              isReading ? "bg-sky-400" : "bg-emerald-400"
            }`}
            style={{ width: `${Math.max(progress, hasFiles ? 0.15 : 0) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
  }
