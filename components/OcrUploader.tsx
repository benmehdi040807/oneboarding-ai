"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  onText: (text: string) => void;
  onPreview?: (url: string | null) => void;
};

export default function OcrUploader({ onText, onPreview }: Props) {
  // ===== Réglages =====
  const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
  const SMALL_LANG = "eng+fra+ara"; // pass 1 (rapide)
  const BIG_LANG =
    "eng+fra+ara+spa+deu+ita+por+tur+nld+pol+rus+ukr+rom+chi_sim+chi_tra+jpn+kor"; // fallback

  // deux miroirs pour les modèles (le 1er peut échouer selon l’opérateur / région)
  const LANG_PATHS = [
    "https://tessdata.projectnaptha.com/4.0.0",
    "https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0",
  ];

  // fichiers du moteur (CDN stables)
  const CORE_PATH =
    "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.2/tesseract-core.wasm.js";
  const WORKER_PATH =
    "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js";

  // ===== UI state =====
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  // propage l’aperçu & nettoie l’ancien ObjectURL
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

  function updateProgress(m: any) {
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

    setProgress(Math.min(99, pct));
    setStatusText(label);
  }

  async function recognizeWithCreateWorker(
    file: File,
    langs: string,
    langPath: string
  ) {
    const T = (await import("tesseract.js")).default as any;
    const worker = await T.createWorker({
      corePath: CORE_PATH,
      workerPath: WORKER_PATH,
      langPath,
      logger: (m: any) => updateProgress(m),
    } as any);

    try {
      setStatusText("Chargement…");
      await worker.load();
      setStatusText("Téléchargement du modèle…");
      await worker.loadLanguage(langs);
      setStatusText("Initialisation…");
      await worker.initialize(langs);

      setStatusText("Reconnaissance…");
      const { data } = await worker.recognize(file);
      const text: string = String(data?.text || "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      return text;
    } finally {
      // toujours terminer le worker pour éviter les blocages mémoire
      try {
        await worker.terminate();
      } catch {}
    }
  }

  /** Essaie SMALL_LANG puis (si texte trop court) BIG_LANG ; et alterne les langPath en cas d’échec réseau. */
  async function runOCR(file: File) {
    if (running) return;
    setRunning(true);
    setErrorMsg("");
    setProgress(1);
    setStatusText("Préparation…");

    const attempts: Array<{ langs: string; langPath: string }> = [];
    for (const lp of LANG_PATHS) {
      attempts.push({ langs: SMALL_LANG, langPath: lp });
      attempts.push({ langs: BIG_LANG, langPath: lp });
    }

    for (let i = 0; i < attempts.length; i++) {
      const { langs, langPath } = attempts[i];
      try {
        const text = await recognizeWithCreateWorker(file, langs, langPath);
        if (text.length < 40 && langs === SMALL_LANG) {
          // trop court : on tente la passe suivante (BIG_LANG) sans sortir
          continue;
        }
        onText(text);
        setProgress(100);
        setStatusText("Terminé");
        setRunning(false);
        return;
      } catch (e: any) {
        // on tente l’étape suivante (autre pack / autre CDN)
        const msg = e?.message || "erreur";
        setErrorMsg(`Tentative ${i + 1}/${attempts.length} échouée (${msg}).`);
      }
    }

    // si toutes les tentatives échouent :
    setRunning(false);
    setStatusText("Erreur");
    const finalMsg =
      "Échec OCR après plusieurs tentatives (réseau/CDN bloqué ?). Réessaie plus tard.";
    setErrorMsg(finalMsg);
    onText(`⚠️ ${finalMsg}`);
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
    onText("");
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
