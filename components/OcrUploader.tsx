"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  /** Texte OCR final renvoyé vers le parent (non affiché ici) */
  onText: (text: string) => void;
  /** Prévisualisation (utile si tu veux afficher l’image ailleurs) */
  onPreview?: (url: string | null) => void;
};

export default function OcrUploader({ onText, onPreview }: Props) {
  // === Réglages ===
  const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
  const AUTO_LANG = "fra+eng+ara"; // auto fr+en+ar
  const MAX_ATTEMPTS = 3;

  // === State UI ===
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [infoMsg, setInfoMsg] = useState<string>("");
  const [attempt, setAttempt] = useState<number>(0);
  const [justFinished, setJustFinished] = useState<boolean>(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  // propage l’aperçu & nettoie l’ancien ObjectURL
  useEffect(() => {
    onPreview?.(imageUrl ?? null);
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl, onPreview]);

  function humanSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  }

  /**
   * Nettoyage visuel uniquement : on efface l’aperçu et les infos UI,
   * mais on NE touche PAS au texte déjà envoyé au parent.
   */
  function softClearVisual() {
    if (fileRef.current) fileRef.current.value = "";
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFileName("");
    setFileSize("");
    setProgress(0);
    setStatusText("");
    setInfoMsg("");
    setAttempt(0);
    setJustFinished(false);
  }

  /**
   * Nettoyage complet : utilisé quand l’utilisateur clique sur « Retirer ✕ »
   * → on efface aussi le texte OCR côté parent.
   */
  function clearFile() {
    softClearVisual();
    onText("");
  }

  async function recognizeWithRetry(file: File) {
    setRunning(true);
    setInfoMsg("");
    setStatusText("Préparation…");
    setProgress((p) => (p <= 1 ? 1 : p));

    let lastErr: any = null;
    let extractedText = "";

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      try {
        setAttempt(i);
        if (i > 1) setStatusText(`Nouvelle tentative ${i}/${MAX_ATTEMPTS}…`);

        const Tesseract = (await import("tesseract.js")).default as any;

        setStatusText("Lecture du document…");
        const result: any = await Tesseract.recognize(file, AUTO_LANG, {
          logger: (m: any) => {
            if (m?.status === "recognizing text" && typeof m?.progress === "number") {
              const p = Math.max(1, Math.min(100, Math.round(m.progress * 100)));
              setProgress(p);
            }
          },
        } as any);

        const raw = String(result?.data?.text || "");
        extractedText = raw
          .replace(/[ \t]+\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        if (extractedText.length > 10) break; // on sort si du texte utile a été lu
      } catch (e: any) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, i * 200 + 300)); // petit délai avant retente
      }
    }

    setRunning(false);
    setProgress(100);
    setStatusText("Lecture terminée");
    setJustFinished(true);
    setTimeout(() => setJustFinished(false), 1200);

    // Cas 1 : lecture utile
    if (extractedText.length > 10) {
      setInfoMsg("Lecture complète — analyse en cours.");
      onText(extractedText);

      // On laisse 400 ms pour que l’utilisateur voie "Lecture terminée",
      // puis on nettoie visuellement pour ne pas encombrer l’écran.
      setTimeout(() => {
        softClearVisual();
      }, 400);

      return;
    }

    // Cas 2 : lecture partielle ou vide => retour expert, jamais d’erreur
    const gentle =
  "La lecture de l’image est incomplète, mais certains passages restent exploitables. " +
  "Pour un meilleur résultat, vous pouvez envoyer une photo plus nette ou une capture d’écran de la page.";
    setInfoMsg(gentle);
    onText(""); // texte vide côté parent, mais feedback positif
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    // Rejet doux des PDF (non pris en charge par ce module)
    const isPdf =
      f.type === "application/pdf" ||
      f.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      setInfoMsg(
        "Votre fichier est un PDF. Pour l’instant, je peux lire uniquement des images " +
          "(photo ou capture d’écran). Prenez une capture de la page importante puis rechargez-la ici."
      );
      if (fileRef.current) fileRef.current.value = "";
      setFileName("");
      setFileSize("");
      setImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setProgress(0);
      setStatusText("");
      setAttempt(0);
      setJustFinished(false);
      onText("");
      return;
    }

    if (f.size > MAX_SIZE) {
      setInfoMsg(`Fichier trop lourd (${humanSize(f.size)}). Limite : 10 Mo.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setFileName(f.name);
    setFileSize(humanSize(f.size));
    setProgress(1);
    setInfoMsg("");
    setStatusText("Préparation…");
    setAttempt(0);
    setJustFinished(false);

    const url = URL.createObjectURL(f);
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    recognizeWithRetry(f);
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
          <div className="mt-1 flex items-center justify-between text-[11px] text-white/70">
            <span>
              {statusText}
              {attempt > 1 && statusText !== "Lecture terminée"
                ? ` (${attempt}/${MAX_ATTEMPTS})`
                : ""}
            </span>
            {progress === 100 ? <span className="text-emerald-300">Prêt</span> : null}
          </div>
        </div>
      ) : null,
    [running, progress, statusText, attempt]
  );

  const hasFile = Boolean(fileName);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      {/* Barre info fichier + actions */}
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
            ${
              hasFile
                ? "bg-emerald-500 text-black border-emerald-400"
                : "bg-white text-black hover:bg-gray-200 border-transparent"
            }
            ${running ? "opacity-70 pointer-events-none" : ""}
            ${justFinished ? "animate-pulse" : ""}
          `}
          title={hasFile ? "Changer de fichier" : "Scanner une page (photo / capture)"}
        >
          {hasFile ? "Fichier chargé ✓" : "Scanner une page"}
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

      {/* Message d’information doux (jamais rouge, jamais “erreur”) */}
      {infoMsg && <div className="mt-2 text-xs text-emerald-300/90">{infoMsg}</div>}

      {/* Aperçu visuel */}
      {imageUrl && (
        <div className="mt-3 relative">
          <img
            src={imageUrl}
            alt="aperçu du document"
            className="rounded-lg w-full max-h-64 object-contain border border-white/10"
          />
          {running && (
            <div className="absolute inset-0 rounded-lg bg-black/25 grid place-items-center text-xs">
              {statusText || "Analyse…"}
            </div>
          )}
        </div>
      )}

      {/* Barre de progression */}
      {Progress}
    </div>
  );
      }
