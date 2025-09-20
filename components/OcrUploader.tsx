"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  onText: (text: string) => void;           // texte OCR remonté au parent
  onPreview?: (url: string | null) => void; // URL locale de l’aperçu (image)
  defaultLang?: string;                      // ex: "fra+eng+ara"
};

export default function OcrUploader({
  onText,
  onPreview,
  defaultLang = "fra+eng+ara",
}: Props) {
  const [ocrLang, setOcrLang] = useState<string>(defaultLang);
  const [ocrText, setOcrText] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // notifier le parent de l’aperçu
  useEffect(() => {
    onPreview?.(imageUrl ?? null);
    return () => {
      // nettoyage de l'ObjectURL si on quitte/changé d’image
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl, onPreview]);

  // --- OCR principal ---
  async function runOCR(file: File) {
    setRunning(true);
    setProgress(0);
    setOcrText("");
    try {
      const mod = await import("tesseract.js");
      // cast pour accepter l’option `logger` (types trop stricts)
      const createWorkerAny = (mod as any).createWorker as any;

      const worker = await createWorkerAny({
        logger: (m: any) => {
          if (m?.status === "recognizing text" && m?.progress != null) {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      await worker.load();
      await worker.loadLanguage(ocrLang);
      await worker.initialize(ocrLang);

      const { data } = await worker.recognize(file);
      await worker.terminate();

      const text = (data?.text || "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      setOcrText(text);
      onText(text);
      setProgress(100);
    } catch (e: any) {
      const t = `⚠️ Échec OCR (${e?.message || "erreur"}). Vérifie la netteté / langue.`;
      setOcrText(t);
      onText(t);
    } finally {
      setRunning(false);
    }
  }

  // sélection d’un fichier
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
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
        <div className="w-full bg-white/10 rounded h-2 overflow-hidden">
          <div className="h-2 bg-emerald-400" style={{ width: `${progress}%` }} />
        </div>
      ) : null,
    [running, progress]
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <label className="text-sm text-white/80">Image / document</label>
        <select
          value={ocrLang}
          onChange={(e) => setOcrLang(e.target.value)}
          className="bg-black/60 border border-white/20 rounded px-2 py-1 text-sm"
          title="Langue OCR"
        >
          <option value="fra+eng+ara">Auto (fr+en+ar)</option>
          <option value="fra">Français (fra)</option>
          <option value="eng">English (eng)</option>
          <option value="ara">العربية (ara)</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPickFile}
          className="block w-full text-sm"
        />
        {fileRef.current?.files?.[0] && (
          <button
            onClick={rerun}
            type="button"
            className="shrink-0 px-3 py-2 rounded-xl bg-white text-black text-sm font-medium"
          >
            Relancer OCR
          </button>
        )}
      </div>

      {imageUrl && (
        <div className="mt-3">
          <img
            src={imageUrl}
            alt="aperçu"
            className="rounded-lg w-full max-h-64 object-contain border border-white/10"
          />
        </div>
      )}

      <div className="mt-3">{Progress}</div>

      <textarea
        value={ocrText}
        onChange={(e) => {
          setOcrText(e.target.value);
          onText(e.target.value);
        }}
        rows={6}
        placeholder="Texte OCR (éditable)…"
        className="mt-3 w-full rounded-xl px-3 py-2 text-sm text-white bg-black/40 border border-white/15"
      />
      <p className="mt-2 text-xs text-white/50">
        Astuce : si l’OCR n’est pas propre, change la langue puis “Relancer OCR”.
      </p>
    </div>
  );
}
