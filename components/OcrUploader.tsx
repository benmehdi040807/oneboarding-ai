"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Texte OCR final renvoyé vers le parent */
  onText: (text: string) => void;
  /** Prévisualisation (toutes les images compressées ensemble) */
  onPreview?: (urls: string[] | null) => void;
};

export default function OcrUploader({ onText, onPreview }: Props) {
  /* ===========================
      CONSTANTES & LIMITES
     =========================== */
  const MAX_FILES = 10;
  const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
  const AUTO_LANG = "fra+eng+ara";

  /* ===========================
      STATES
     =========================== */
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [runningIndex, setRunningIndex] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* ===========================
      GESTION PREVIEW
     =========================== */
  useEffect(() => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews(newPreviews);
    onPreview?.(newPreviews.length > 0 ? newPreviews : null);

    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files, onPreview]);

  /* ===========================
      SUPPRIMER UN FICHIER
     =========================== */
  function removeFile(idx: number) {
    setFiles((arr) => arr.filter((_, i) => i !== idx));
    setProgress(0);
    setStatus("");
  }

  /* ===========================
      CHARGEMENT DES FICHIERS
     =========================== */
  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files || []);

    if (incoming.length === 0) return;

    // ❌ PDF interdits
    if (incoming.some((f) => f.type === "application/pdf")) {
      alert("Les PDF ne peuvent pas être lus. Veuillez envoyer des images ou captures d’écran.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // ❌ trop de fichiers
    if (incoming.length + files.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} fichiers par analyse.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // ❌ fichier trop lourd
    for (const f of incoming) {
      if (f.size > MAX_SIZE) {
        alert(`Fichier trop lourd : ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} Mo)`);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }

    setFiles((prev) => [...prev, ...incoming]);
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ===========================
      OCR D'UN FICHIER
     =========================== */
  async function readOne(file: File, index: number): Promise<string> {
    setRunningIndex(index);
    setStatus("Lecture du document…");
    setProgress(1);

    const Tesseract = (await import("tesseract.js")).default as any;

    const result: any = await Tesseract.recognize(file, AUTO_LANG, {
      logger: (m: any) => {
        if (m?.status === "recognizing text" && typeof m?.progress === "number") {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });

    const raw = String(result?.data?.text || "");
    const clean = raw
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    setProgress(100);
    setStatus("Lecture terminée");

    return clean;
  }

  /* ===========================
      LANCER L'OCR SUR TOUS
     =========================== */
  async function runAll() {
    if (files.length === 0) {
      alert("Veuillez choisir au moins un fichier.");
      return;
    }

    let allText = "";

    for (let i = 0; i < files.length; i++) {
      try {
        const text = await readOne(files[i], i);
        if (text.length > 10) {
          allText += "\n\n" + text;
        } else {
          allText +=
            "\n\n(Passage peu lisible — zones floues ou texte absent. Analyse possible sur les parties reconnues.)";
        }
      } catch {
        allText +=
          "\n\n(La lecture de cette image est incomplète, mais certains passages restent exploitables. " +
          "Pour un meilleur résultat, vous pouvez envoyer une photo plus nette ou une capture d’écran de la page.)";
      }
    }

    setRunningIndex(null);
    setStatus("Analyse prête");
    onText(allText.trim());
  }

  /* ===========================
      RENDER
     =========================== */
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      {/* Zone de sélection */}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,image/heic,image/heif"
          multiple
          onChange={handlePick}
          className="hidden"
        />

        <label
          htmlFor="ocr-files"
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer px-3 py-2 rounded-xl text-sm font-medium bg-white text-black border border-transparent hover:bg-gray-200"
        >
          Ajouter des fichiers
        </label>

        <div className="text-xs text-white/70">
          {files.length === 0
            ? "Aucun fichier sélectionné"
            : `${files.length} fichier(s) — max ${MAX_FILES}`}
        </div>
      </div>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="mt-3 space-y-3">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="rounded-lg bg-white/10 p-2 flex items-center gap-3"
            >
              <img
                src={previews[idx]}
                alt="aperçu"
                className="w-20 h-20 object-contain rounded border border-white/10"
              />

              <div className="flex-1 text-xs text-white/80">
                <div className="font-medium">{file.name}</div>
                <div className="opacity-70">
                  {(file.size / 1024 / 1024).toFixed(2)} Mo
                </div>
              </div>

              <button
                onClick={() => removeFile(idx)}
                className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
              >
                Retirer ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Progression */}
      {runningIndex !== null && (
        <div className="mt-4">
          <div className="w-full bg-white/10 rounded h-2 overflow-hidden">
            <div
              className="h-2 bg-emerald-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs mt-1 text-white/70">
            {status} (document {runningIndex + 1}/{files.length})
          </div>
        </div>
      )}

      {/* Bouton Lancer */}
      {files.length > 0 && (
        <button
          onClick={runAll}
          className="mt-4 w-full py-2 rounded-xl bg-emerald-500 text-black font-medium hover:bg-emerald-400"
        >
          Lire et analyser
        </button>
      )}
    </div>
  );
            }
