"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  onText: (text: string) => void;
  onPreview?: (url: string | null) => void;
};

export default function OcrUploader({ onText, onPreview }: Props) {
  // ===== Réglages =====
  const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
  const SMALL_LANG = "eng+fra+ara"; // pass 1 (rapide & couvre la majorité)
  const BIG_LANG =
    "eng+fra+ara+spa+deu+ita+por+tur+nld+pol+rus+ukr+rom+chi_sim+chi_tra+jpn+kor"; // pass 2

  // CDN stables (améliore la fiabilité sur mobile)
  const CORE_PATH =
    "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.2/tesseract-core.wasm.js";
  const WORKER_PATH =
    "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js";
  const LANG_PATH = "https://tessdata.projectnaptha.com/4.0.0";

  // ===== UI state =====
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [extendedTried, setExtendedTried] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const stallTimerRef = useRef<number | null>(null);
  const lastProgressRef = useRef<number>(0);

  // Propage l’aperçu & nettoie l’ancien ObjectURL
  useEffect(() => {
    onPreview?.(imageUrl ?? null);
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl, onPreview]);

  // ===== Helpers =====
  function humanSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  }

  function startStallWatch() {
    stopStallWatch();
    lastProgressRef.current = progress;
    // si la progression n'a pas bougé en 25s, on bascule en mode étendu
    stallTimerRef.current = window.setTimeout(() => {
      if (!extendedTried) {
        setStatusText("Un peu long… bascule en mode étendu");
        setExtendedTried(true);
        // relance avec le gros pack (si un fichier est présent)
        const f = fileRef.current?.files?.[0];
        if (f) recognizeWith(f, BIG_LANG, true);
      }
    }, 25_000);
  }
  function stopStallWatch() {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }

  function updateProgressFromStatus(m: any) {
    const s: string = m?.status || "";
    const p: number = typeof m?.progress === "number" ? m.progress : 0;

    let pct = progress;
    let label = statusText;

    if (s.includes("loading tesseract core")) {
      pct = Math.max(1, Math.round(5 + p * 10));
      label = "Chargement du moteur…";
    } else if (s.includes("initializing tesseract")) {
      pct = Math.max(10, 18);
      label = "Initialisation du moteur…";
    } else if (s.includes("loading language traineddata")) {
      pct = Math.max(18, Math.round(20 + p * 40));
      label = "Téléchargement du modèle de langue…";
    } else if (s.includes("initializing api")) {
      pct = Math.max(60, 68);
      label = "Initialisation de l’API…";
    } else if (s.includes("recognizing text")) {
      pct = Math.max(68, Math.round(70 + p * 30));
      label = "Analyse du texte…";
    } else if (s) {
      pct = Math.max(progress, 15);
      label = s;
    }

    pct = Math.min(99, pct);
    setProgress(pct);
    setStatusText(label);

    // réarmer le watchdog si on a progressé
    if (pct > lastProgressRef.current + 1) {
      lastProgressRef.current = pct;
      startStallWatch();
    }
  }

  async function recognizeWith(file: File, langs: string, isRetry = false) {
    try {
      const Tesseract = (await import("tesseract.js")).default as any;
      const result = await Tesseract.recognize(
        file,
        langs,
        {
          corePath: CORE_PATH,
          workerPath: WORKER_PATH,
          langPath: LANG_PATH,
          logger: (m: any) => updateProgressFromStatus(m),
        } as any
      );

      const text: string = String(result?.data?.text || "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // Heuristique : si le 1er passage (SMALL_LANG) ramène très peu de texte,
      // on tente le BIG_LANG automatiquement (une seule fois).
      if (!isRetry && !extendedTried && langs === SMALL_LANG) {
        const tooShort = text.length < 40;
        if (tooShort) {
          setStatusText("Résultat léger, relance en mode étendu…");
          setExtendedTried(true);
          return recognizeWith(file, BIG_LANG, true);
        }
      }

      onText(text);
      setProgress(100);
      setStatusText("Terminé");
      stopStallWatch();
    } catch (e: any) {
      const msg = `Échec OCR (${e?.message || "erreur"}).`;
      setErrorMsg(msg);
      setStatusText("Erreur");
      onText(`⚠️ ${msg}`);
      stopStallWatch();
    } finally {
      setRunning(false);
    }
  }

  async function runOCR(file: File) {
    if (running) return;
    setRunning(true);
    setErrorMsg("");
    setProgress(1);
    setStatusText("Préparation…");
    setExtendedTried(false);
    startStallWatch();
    await recognizeWith(file, SMALL_LANG, false);
  }

  function clearFile() {
    if (fileRef.current) fileRef.current.value = "";
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFileName("");
    setFileSize("");
    setProgress(0);
    setStatusText("");
    setErrorMsg("");
    setExtendedTried(false);
    onText("");
    stopStallWatch();
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > MAX_SIZE) {
      setErrorMsg(`Fichier trop lourd (${humanSize(f.size)}). Limite: 10 Mo.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setFileName(f.name);
    setFileSize(humanSize(f.size));
    setProgress(1);
    setStatusText("Préparation…");
    setErrorMsg("");

    const url = URL.createObjectURL(f);
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    runOCR(f);
  }

  const ProgressBar = useMemo(
    () =>
      running || progress > 0 ? (
        <div className="w-full mt-3">
          <div className="w-full bg-white/10 rounded h-2 overflow-hidden">
            <div
              className="h-2 bg-emerald-400 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-right text-[11px] text-white/70">
            {progress < 100 ? statusText : "Terminé"}
          </div>
        </div>
      ) : null,
    [running, progress, statusText]
  );

  const hasFile = Boolean(fileName);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      {/* Choix fichier (bouton custom) */}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          id="ocr-file"
          type="file"
          accept="image/*,image/heic,image/heif"
          onChange={onPickFile}
          className="hidden"
        />
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

        <div className="flex items-center gap-2 min-w-0">
          <div className="text-xs text-white/70 truncate">
            {hasFile ? `${fileName} — ${fileSize}` : "Aucun fichier choisi"}
          </div>
          {hasFile && (
            <button
              type="button"
              onClick={clearFile}
              className="shrink-0 text-xs px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25"
              title="Retirer le fichier"
            >
              Retirer ✕
            </button>
          )}
        </div>
      </div>

      {/* Alerte douce */}
      {errorMsg && <div className="mt-2 text-xs text-red-300">{errorMsg}</div>}

      {/* Aperçu */}
      {imageUrl && (
        <div className="mt-3 relative">
          <img
            src={imageUrl}
            alt="aperçu du document"
            className="rounded-lg w-full max-h-64 object-contain border border-white/10"
          />
          {running && (
            <div className="absolute inset-0 rounded-lg bg-black/30 grid place-items-center text-xs">
              {statusText || "Analyse en cours…"}
            </div>
          )}
        </div>
      )}

      {/* Barre de progression */}
      {ProgressBar}
    </div>
  );
}
