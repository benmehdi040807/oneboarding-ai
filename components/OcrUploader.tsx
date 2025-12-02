"use client";

import { useRef, useState } from "react";

type Props = {
  /** Texte OCR final renvoyé vers le parent (non affiché ici) */
  onText: (text: string) => void;
  /** Prévisualisation (utile si tu veux afficher l’image ailleurs) */
  onPreview?: (url: string | null) => void;
};

type OcrFile = {
  id: string;
  file: File;
  url: string;
  name: string;
  sizeLabel: string;
};

export default function OcrUploader({ onText, onPreview }: Props) {
  const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
  const AUTO_LANG = "fra+eng+ara"; // auto fr+en+ar
  const MAX_FILES = 10;

  const [files, setFiles] = useState<OcrFile[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [infoMsg, setInfoMsg] = useState(""); // interne uniquement, non affiché

  const inputRef = useRef<HTMLInputElement | null>(null);

  function humanSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  }

  function clearAll() {
    files.forEach((f) => URL.revokeObjectURL(f.url));
    setFiles([]);
    setRunning(false);
    setProgress(0);
    setInfoMsg("");
    onText("");
    onPreview?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeOne(id: string) {
    const remaining = files.filter((f) => f.id !== id);
    const removed = files.find((f) => f.id === id);
    if (removed) URL.revokeObjectURL(removed.url);

    setFiles(remaining);

    if (!remaining.length) {
      setProgress(0);
      setInfoMsg("");
      onText("");
      onPreview?.(null);
      return;
    }

    // Re-lancer une lecture sur les fichiers restants
    recognizeAll(remaining);
  }

  async function recognizeAll(list: OcrFile[]) {
    if (!list.length) return;

    setRunning(true);
    setProgress(1);
    setInfoMsg("");

    let globalText = "";
    let lastErr: any = null;

    try {
      const Tesseract = (await import("tesseract.js")).default as any;

      for (let index = 0; index < list.length; index++) {
        const item = list[index];

        let localText = "";
        for (let i = 1; i <= 3; i++) {
          try {
            const result: any = await Tesseract.recognize(
              item.file,
              AUTO_LANG,
              {
                logger: (m: any) => {
                  if (
                    m?.status === "recognizing text" &&
                    typeof m?.progress === "number"
                  ) {
                    const base = (index / list.length) * 100;
                    const perFile =
                      (Math.max(0, Math.min(1, m.progress)) / list.length) *
                      100;
                    const p = Math.max(
                      1,
                      Math.min(100, Math.round(base + perFile))
                    );
                    setProgress(p);
                  }
                },
              } as any
            );

            const raw = String(result?.data?.text || "");
            localText = raw
              .replace(/[ \t]+\n/g, "\n")
              .replace(/\n{3,}/g, "\n\n")
              .trim();

            if (localText.length > 10) break;
          } catch (e: any) {
            lastErr = e;
            await new Promise((r) => setTimeout(r, i * 200 + 300));
          }
        }

        if (localText.length > 0) {
          globalText +=
            `\n\n--- Document ${index + 1}: ${item.name} ---\n\n` + localText;
        }
      }
    } catch (e: any) {
      lastErr = e;
      console.warn("[OCR] erreur de lecture", lastErr);
    }

    setRunning(false);
    setProgress(100);

    if (globalText.trim().length > 10) {
      // Message interne (non affiché)
      setInfoMsg("Lecture complète — analyse en cours.");
      onText(globalText.trim());
    } else {
      // Message doux interne (non affiché)
      const gentle =
        "La lecture de l’image est incomplète, mais certains passages restent exploitables. " +
        "Pour un meilleur résultat, vous pouvez envoyer une photo plus nette ou une capture d’écran de la page.";
      setInfoMsg(gentle);
      onText("");
    }
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (!list.length) return;

    const mapped: OcrFile[] = list
      .map((f, idx) => {
        if (f.size > MAX_SIZE) {
          // on ignore les fichiers trop lourds
          return null as any;
        }
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
    const limited = merged.slice(0, MAX_FILES);

    if (merged.length > MAX_FILES) {
      // info interne, pas affichée
      setInfoMsg(
        "Maximum 10 fichiers par envoi. Seuls les 10 premiers sont pris en compte."
      );
    } else {
      setInfoMsg("");
    }

    setFiles(limited);

    // aperçu = premier visuel (image)
    const first = limited.find((f) => f.file.type.startsWith("image/"));
    onPreview?.(first ? first.url : null);

    recognizeAll(limited);
  }

  const hasFiles = files.length > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      {/* Barre info + bouton choisir */}
      <div className="flex items-center gap-2 mb-2">
        <input
          ref={inputRef}
          id="ocr-multi-file"
          type="file"
          accept="image/*,image/heic,image/heif"
          multiple
          onChange={handleSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer select-none px-3 py-2 rounded-xl text-sm font-medium border transition
            ${
              hasFiles
                ? "bg-emerald-500 text-black border-emerald-400"
                : "bg-white text-black hover:bg-gray-200 border-transparent"
            }
            ${running ? "opacity-70 pointer-events-none" : ""}
          `}
          title={
            hasFiles
              ? "Ajouter / remplacer des fichiers"
              : "Choisir des fichiers"
          }
        >
          {hasFiles ? "Ajouter des documents" : "Sélectionner des documents"}
        </button>

        <div className="flex-1 text-xs text-white/70 truncate">
          {hasFiles
            ? `${files.length} fichier(s) — max 10`
            : "Aucun document sélectionné (max 10 fichiers par envoi)."}
        </div>

        {hasFiles && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-xs px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25"
            title="Retirer tous les fichiers"
          >
            Tout retirer ✕
          </button>
        )}
      </div>

      {/* Liste des fichiers avec aperçu */}
      {hasFiles && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg bg-white/10 px-2 py-1"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 rounded-md overflow-hidden bg-white/10 shrink-0">
                  <img
                    src={f.url}
                    alt="aperçu du document"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-white/90 truncate">
                    {f.name}
                  </span>
                  <span className="text-[11px] text-white/60">
                    {f.sizeLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeOne(f.id)}
                className="text-[11px] px-2 py-1 rounded-md bg-white/15 hover:bg-white/25"
              >
                Retirer ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Barre de progression — sans texte (signalétique universelle) */}
      {(running || progress > 0) && (
        <div className="w-full mt-3">
          <div className="w-full bg-white/10 rounded h-2 overflow-hidden">
            <div
              className="h-2 bg-emerald-400 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
                }
