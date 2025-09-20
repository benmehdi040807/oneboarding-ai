"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  /** Texte OCR final renvoyé “en coulisses” vers le parent */
  onText: (text: string) => void;
  /** Prévisualisation (utile si tu veux afficher l’image ailleurs) */
  onPreview?: (url: string | null) => void;
  /** Langue(s) Tesseract (ex: "fra", "eng", "ara", "fra+eng+ara") */
  defaultLang?: string;
};

export default function OcrUploader({
  onText,
  onPreview,
  defaultLang = "fra+eng+ara",
}: Props) {
  const [ocrLang, setOcrLang] = useState<string>(defaultLang);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  // propage l’aperçu & nettoie l’ancien ObjectURL
  useEffect(() => {
    onPreview?.(imageUrl ?? null);
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl, onPreview]);

  // relance auto si la langue change et qu’un fichier est sélectionné
  useEffect(() => {
    const f = fileRef.current?.files?.[0];
    if (f) {
      setProgress(1);
      runOCR(f);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrLang]);

  function humanSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  }

  async function runOCR(file: File) {
    if (running) return; // anti double-clic
    setRunning(true);
    setProgress((p) => (p <= 1 ? 1 : p));

    try {
      const Tesseract = (await import("tesseract.js")).default as any;

      const result = await Tesseract.recognize(
        file,
        ocrLang,
        {
          logger: (m: any) => {
            if (m?.status === "recognizing text" && typeof m?.progress === "number") {
              const p = Math.max(1, Math.min(100, Math.round(m.progress * 100)));
              setProgress(p);
            }
          },
        } as any
      );

      const text: string = String(result?.data?.text || "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      onText(text); // on envoie le texte OCR au parent
      setProgress(100);
    } catch (e: any) {
      onText(`⚠️ Échec OCR (${e?.message || "erreur"}).`);
    } finally {
      setRunning(false);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    // feedback immédiat
    setFileName(f.name);
    setFileSize(humanSize(f.size));
    setProgress(1);

    const url = URL.createObjectURL(f);
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    runOCR(f);
  }

  const Progress = useMemo(
    () =>
      running || progress > 0 ? (
        <div className="w-full mt-3">
          <div className="w-full bg-white/10 rounded h-2 overflow-hidden">
            <div
              className="h-2 bg-emerald-400 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-right text-[11px] text-white/60">
            {running && progress < 100
              ? `Analyse… ${progress}%`
              : progress === 100
              ? "Terminé"
              : null}
          </div>
        </div>
      ) : null,
    [running, progress]
  );

  const hasFile = Boolean(fileName);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      {/* En-tête + langue */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <label className="text-sm text-white/80">Image / document</label>
        <select
          value={ocrLang}
          onChange={(e) => setOcrLang(e.target.value)}
          className="bg-black/60 border border-white/20 rounded px-2 py-1 text-sm"
          title="Langue(s) OCR"
        >
          <option value="fra+eng+ara">Auto (fr+en+ar)</option>
          <option value="fra">Français (fra)</option>
          <option value="eng">English (eng)</option>
          <option value="ara">العربية (ara)</option>
        </select>
      </div>

      {/* Choix fichier (bouton custom) */}
      <div className="flex items-center gap-2">
        {/* input natif masqué */}
        <input
          ref={fileRef}
          id="ocr-file"
          type="file"
          accept="image/*,image/heic,image/heif"
          onChange={onPickFile}
          className="hidden"
        />
        {/* label = bouton visible */}
        <label
          htmlFor="ocr-file"
          className={`cursor-pointer select-none px-3 py-2 rounded-xl text-sm font-medium border transition
            ${hasFile ? "bg-emerald-500 text-black border-emerald-400" : "bg-white text-black hover:bg-gray-200 border-transparent"}
            ${running ? "opacity-70 pointer-events-none" : ""}
          `}
          title={hasFile ? "Changer de fichier" : "Choisir un fichier"}
        >
          {hasFile ? "Fichier chargé ✓" : "Choisir un fichier"}
        </label>

        {/* Infos fichier */}
        <div className="text-xs text-white/70 truncate">
          {hasFile ? `${fileName} — ${fileSize}` : "Aucun fichier choisi"}
        </div>
      </div>

      {/* Aperçu visuel */}
      {imageUrl && (
        <div className="mt-3 relative">
          <img
            src={imageUrl}
            alt="aperçu du document"
            className="rounded-lg w-full max-h-64 object-contain border border-white/10"
          />
          {running && (
            <div className="absolute inset-0 rounded-lg bg-black/30 grid place-items-center text-xs">
              Analyse en cours…
            </div>
          )}
        </div>
      )}

      {/* Barre de progression */}
      {Progress}
    </div>
  );
}
