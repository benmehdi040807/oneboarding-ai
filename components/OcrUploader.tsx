"use client";

import React, { useRef, useState } from "react";

type Props = {
  onSubmit: (files: File[] | null) => void;
};

export function OcrUploader({ onSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;

    const arr = Array.from(list);
    setFiles(arr);
    onSubmit(arr);
  };

  const handleRemoveAll = () => {
    setFiles([]);
    onSubmit([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const labelText =
    files.length === 0
      ? "Aucun fichier sélectionné."
      : files.length === 1
      ? "1 fichier sélectionné :"
      : `${files.length} fichiers sélectionnés :`;

  const detailText =
    files.length > 0 ? files.map((f) => f.name).join(", ") : "";

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-white/88 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] text-[var(--fg)] text-sm font-medium"
        >
          Choisir un fichier
        </button>
        {files.length > 0 && (
          <button
            type="button"
            onClick={handleRemoveAll}
            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-white/70 hover:bg-white text-[var(--fg)] text-xs"
          >
            Retirer tout
          </button>
        )}
      </div>

      <div className="text-xs text-[var(--fg)]/80">
        <p>{labelText}</p>
        {detailText && (
          <p className="mt-1 line-clamp-2 break-all text-[11px] opacity-80">
            {detailText}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple={false}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

export default OcrUploader;
