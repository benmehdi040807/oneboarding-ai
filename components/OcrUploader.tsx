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
  const fileRef = useRef<HTMLInputElement | null>(null);

  // propage l’aperçu & nettoie l’ancien ObjectURL
  useEffect(() => {
    onPreview?.(imageUrl ?? null);
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl, onPreview]);

  // si la langue change et qu’un fichier est déjà sélectionné → relancer
  useEffect(() => {
    const f = fileRef.current?.files?.[0];
    if (f) {
      setProgress(1);
      runOCR(f);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrLang]);

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
      const fallback = `⚠️ Échec OCR (${e?.message || "erreur"}).`;
      onText(fallback);
    } finally {
      setRunning(false);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // reset progression visuelle
    setProgress(1);
    const url = URL.createObjectURL(f);
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    runOCR(f);
  }

  async function rerun() {
    const f = fileRef.current?.files?.[0];
    if (f) await runOCR(f);
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

      {/* Choix fichier + relance */}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,image/heic,image/heif"
          onChange={onPickFile}
          className="block w-full text-sm"
        />
        {fileRef.current?.files?.[0] && (
          <button
            onClick={rerun}
            type="button"
            disabled={running}
            className="shrink-0 px-3 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-50"
            title="Relancer l'OCR (si vous changez la langue par ex.)"
          >
            Relancer OCR
          </button>
        )}
      </div>

      {/* Aperçu visuel */}
      {imageUrl && (
        <div className="mt-3">
          <img
            src={imageUrl}
            alt="aperçu du document"
            className="rounded-lg w-full max-h-64 object-contain border border-white/10"
          />
        </div>
      )}

      {/* Barre de progression */}
      {Progress}
    </div>
  );
}
