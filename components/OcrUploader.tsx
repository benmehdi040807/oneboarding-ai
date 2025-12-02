"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export default function OcrUploader({ onSubmit }: { onSubmit: (files: File[]) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 📍 Ajout fichiers (max 10)
  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (!selected.length) return;

    const merged = [...files, ...selected];
    if (merged.length > 10) {
      alert("Maximum 10 fichiers par envoi.");
      setFiles(merged.slice(0, 10)); // on garde juste les 10 premiers
    } else {
      setFiles(merged);
    }
  }

  // 📍 Retirer fichier individuellement
  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
  }

  // 🚀 Unique action → Envoyer & analyser
  function handleSubmit() {
    if (!files.length) return alert("Veuillez sélectionner au moins un document.");
    onSubmit(files);
  }

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* 🔹 Barre centrale (remontée au-dessus des commandes) */}
      <div className="w-full text-center text-xs opacity-80 font-light select-none">
        📄 0–10 fichiers — texte & documents acceptés
      </div>

      {/* 🔹 Boutons haut (Joindre / Micro / O bleu / O jaune) */}
      <div className="flex flex-row justify-center gap-4 mb-2">
        {/* === BOUTON PRINCIPAL → Joindre fichiers === */}
        <button
          onClick={() => inputRef.current?.click()}
          className="p-3 rounded-xl shadow-md bg-white text-gray-800 font-medium active:scale-95"
        >
          📎 Joindre
        </button>

        {/* (les autres boutons restent gérés par ton UI externe) */}
      </div>

      {/* Input invisible → multi fichiers */}
      <input
        type="file"
        accept="image/*,application/pdf,text/plain"
        multiple
        ref={inputRef}
        onChange={handleSelect}
        className="hidden"
      />

      {/* 🔹 Liste des fichiers chargés (aperçu persistant) */}
      {files.length > 0 && (
        <div className="flex flex-col gap-3 p-3 bg-white/40 rounded-xl shadow-inner">
          <div className="text-sm font-medium">
            {files.length} fichier(s) — <b>max 10</b>
          </div>

          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm">
              {/* 📄 Aperçu image si possible */}
              <div className="flex items-center gap-3">
                {f.type.startsWith("image/") ? (
                  <Image
                    src={URL.createObjectURL(f)}
                    alt="preview"
                    width={50}
                    height={50}
                    className="rounded-lg object-cover border"
                  />
                ) : (
                  <div className="text-sm opacity-70">📄 {f.name}</div>
                )}

                <span className="text-xs opacity-70">
                  {(f.size / 1024 / 1024).toFixed(2)} Mo
                </span>
              </div>

              {/* ❌ Retirer */}
              <button
                onClick={() => removeFile(i)}
                className="px-2 py-1 rounded-lg text-red-500 hover:bg-red-100 active:scale-95"
              >
                Retirer ✖
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 🚀 Bouton final → UN SEUL */}
      <button
        onClick={handleSubmit}
        className="w-full py-3 mt-2 rounded-xl bg-green-600 text-white font-semibold text-lg active:scale-[0.97]"
      >
        Envoyer & analyser
      </button>
    </div>
  );
          }
