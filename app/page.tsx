"use client";
export const runtime = "nodejs";

import { useEffect, useMemo, useRef, useState } from "react";

/* ===== Bandeau RGPD ===== */
function RgpdBanner() {
  const CONSENT_KEY = "oneboarding.rgpdConsent";
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {}
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-xl px-4">
        <div className="m-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-3 text-sm text-white">
          <p className="mb-2">
            Vos données restent privées sur cet appareil.{" "}
            <a href="/legal" className="underline">
              En savoir plus
            </a>
          </p>
          <button
            onClick={accept}
            className="px-3 py-2 rounded-xl bg-white text-black font-medium"
          >
            D’accord
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Types ===== */
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

/* ===== Utilitaires UI ===== */
function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text);
  } catch {}
}

/* ===== Page ===== */
export default function Page() {
  /* --- Chat --- */
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  /* --- OCR --- */
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [ocrLang, setOcrLang] = useState<string>("fra+eng+ara"); // "auto" simplifiée
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrRunning, setOcrRunning] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Charger / Sauver l'historique
  useEffect(() => {
    try {
      const s = localStorage.getItem("oneboarding.history");
      if (s) setHistory(JSON.parse(s));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("oneboarding.history", JSON.stringify(history));
    } catch {}
  }, [history]);

  // ====== OCR : lancer sur un fichier image ======
  async function runOCR(file: File) {
    setOcrText("");
    setOcrProgress(0);
    setOcrRunning(true);
    try {
      // import dynamique pour ne pas alourdir le bundle initial
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker({
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      await worker.load();
      await worker.loadLanguage(ocrLang); // ex: "fra+eng+ara"
      await worker.initialize(ocrLang);
      const { data } = await worker.recognize(file);
      await worker.terminate();

      setOcrText((data.text || "").trim());
      setOcrProgress(100);
    } catch (e: any) {
      setOcrText(
        `⚠️ Échec OCR (${e?.message || "erreur"}). Vérifie la netteté / langue.`
      );
    } finally {
      setOcrRunning(false);
    }
  }

  // Gestion du fichier (image)
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImageUrl(url);
    runOCR(f); // lance automatiquement l’OCR
  }

  // Relancer OCR (si on change de langue par ex.)
  async function rerunOCR() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await runOCR(file);
  }

  // ====== Envoi IA ======
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if ((!q && !ocrText) || loading) return;

    const now = new Date().toISOString();

    // Affiche le message "utilisateur" (on montre juste la consigne, pas tout l’OCR pour rester lisible)
    const userShown =
      q || (ocrText ? "(Question vide — envoi du texte OCR uniquement)" : "");
    if (userShown) {
      setHistory((h) => [{ role: "user", text: userShown, time: now }, ...h]);
    }

    setInput("");
    setLoading(true);

    // Compose le prompt : on fournit le texte OCR + la consigne
    const composedPrompt = ocrText
      ? `Voici le texte extrait d’un document (OCR) :\n\n"""${ocrText}"""\n\nConsigne de l’utilisateur : ${q || "(aucune)"}\n\nConsigne pour l’IA : Résume, explique et réponds à la question. Sois clair et concis.`
      : q;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: composedPrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setHistory((h) => [
          {
            role: "error",
            text: `Erreur: ${data?.error || `HTTP ${res.status}`}`,
            time: new Date().toISOString(),
          },
          ...h,
        ]);
      } else {
        setHistory((h) => [
          {
            role: "assistant",
            text: String(data.text || "Réponse vide."),
            time: new Date().toISOString(),
          },
          ...h,
        ]);
      }
    } catch (err: any) {
      setHistory((h) => [
        {
          role: "error",
          text: `Erreur: ${err?.message || "réseau"}`,
          time: new Date().toISOString(),
        },
        ...h,
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Progress bar (simple)
  const Progress = useMemo(
    () =>
      ocrRunning || ocrProgress > 0 ? (
        <div className="w-full bg-white/10 rounded h-2 overflow-hidden">
          <div
            className="h-2 bg-emerald-400"
            style={{ width: `${ocrProgress}%` }}
          />
        </div>
      ) : null,
    [ocrRunning, ocrProgress]
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">OneBoarding AI ✨</h1>

      {/* ========= Bloc OCR (image + options + texte extrait) ========= */}
      <div className="w-full max-w-md space-y-3 mb-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <label className="text-sm text-white/80">Image / document</label>
            <select
              value={ocrLang}
              onChange={(e) => setOcrLang(e.target.value)}
              className="bg-black/60 border border-white/20 rounded px-2 py-1 text-sm"
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
                onClick={rerunOCR}
                type="button"
                className="shrink-0 px-3 py-2 rounded-xl bg-white text-black text-sm font-medium"
              >
                Relancer OCR
              </button>
            )}
          </div>

          {/* Aperçu image */}
          {imageUrl && (
            <div className="mt-3">
              <img
                src={imageUrl}
                alt="aperçu"
                className="rounded-lg w-full max-h-64 object-contain border border-white/10"
              />
            </div>
          )}

          {/* Progression */}
          <div className="mt-3">{Progress}</div>

          {/* Texte OCR éditable */}
          <textarea
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            rows={6}
            placeholder="Texte OCR (éditable)…"
            className="mt-3 w-full rounded-xl px-3 py-2 text-sm text-white bg-black/40 border border-white/15"
          />
          <p className="mt-2 text-xs text-white/50">
            Astuce : si l’OCR n’est pas propre, change la langue puis “Relancer
            OCR”.
          </p>
        </div>
      </div>

      {/* ========= Saisie utilisateur + envoi ========= */}
      <form onSubmit={handleSubmit} className="w-full max-w-md flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Décrivez votre besoin… (ou touchez 🎤 si activé ailleurs)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2 text-black"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-60"
        >
          {loading ? "…" : "OK"}
        </button>
      </form>

      {/* ========= Historique ========= */}
      <div className="w-full max-w-md space-y-3">
        {history.map((item, idx) => (
          <div
            key={idx}
            className={`fade-in rounded-xl border p-3 relative ${
              item.role === "user"
                ? "border-white/10 bg-white/5"
                : item.role === "assistant"
                ? "border-emerald-300/20 bg-emerald-950/40"
                : "border-red-400/30 bg-red-500/10"
            }`}
          >
            <p className="text-white/90 whitespace-pre-wrap">{item.text}</p>

            {/* Bouton Copier pour les réponses IA */}
            {item.role === "assistant" && (
              <button
                onClick={() => copyToClipboard(item.text)}
                className="absolute right-3 bottom-3 text-xs px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25"
              >
                Copier
              </button>
            )}

            <p className="text-xs text-white/50 mt-6">
              {item.role === "user"
                ? "Vous"
                : item.role === "assistant"
                ? "IA"
                : "Erreur"}{" "}
              • {new Date(item.time).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <RgpdBanner />
    </div>
  );
}
