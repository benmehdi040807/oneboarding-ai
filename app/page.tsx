"use client";
export const runtime = "nodejs";

import { useEffect, useRef, useState } from "react";
import OcrUploader from "@/components/OcrUploader";

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
    try { localStorage.setItem(CONSENT_KEY, "1"); } catch {}
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-xl px-4">
        <div className="m-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-3 text-sm text-white">
          <p className="mb-2">
            Vos données restent privées sur cet appareil.{" "}
            <a href="/legal" className="underline">En savoir plus</a>
          </p>
          <button onClick={accept} className="px-3 py-2 rounded-xl bg-white text-black font-medium">
            D’accord
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Types ===== */
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

/* ===== Utils ===== */
const cleanText = (s: string) =>
  s.replace(/\s+/g, " ").replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1").trim();

function copyToClipboard(text: string) {
  try { navigator.clipboard.writeText(text); } catch {}
}

/* ===== Page ===== */
export default function Page() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // OCR
  const [showOcr, setShowOcr] = useState(false);
  const [ocrText, setOcrText] = useState("");

  // 🎙️ Micro (final only)
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  const baseInputRef = useRef<string>("");

  useEffect(() => {
    const SR: any =
      (typeof window !== "undefined" && (window as any).SpeechRecognition) ||
      (typeof window !== "undefined" && (window as any).webkitSpeechRecognition);
    if (!SR) return;

    setSpeechSupported(true);
    const r = new SR();
    r.lang = "fr-FR";
    r.continuous = true;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onstart = () => {
      baseInputRef.current = input;
      setListening(true);
    };

    r.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        final += " " + e.results[i][0].transcript;
      }
      setInput(cleanText([baseInputRef.current, final].join(" ")));
    };

    const stopUI = () => setListening(false);
    r.onend = stopUI;
    r.onspeechend = stopUI;
    r.onaudioend = stopUI;
    r.onnomatch = stopUI;
    r.onerror = stopUI;

    recogRef.current = r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMic() {
    const r = recogRef.current;
    if (!r) return;
    if (!listening) {
      try { r.start(); } catch {}
      return;
    }
    try { r.stop(); } catch {}
    setTimeout(() => {
      if (listening) {
        try { r.abort?.(); } catch {}
        setListening(false);
      }
    }, 800);
  }

  // historique
  useEffect(() => {
    try { const s = localStorage.getItem("oneboarding.history"); if (s) setHistory(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("oneboarding.history", JSON.stringify(history)); } catch {}
  }, [history]);

  // envoyer
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    const hasOcr = Boolean(ocrText.trim());
    if ((!q && !hasOcr) || loading) return;

    const now = new Date().toISOString();
    const userShown = q || (hasOcr ? "(Question vide — envoi du texte OCR uniquement)" : "");
    if (userShown) setHistory(h => [{ role: "user", text: userShown, time: now }, ...h]);

    setInput("");
    setLoading(true);

    const composedPrompt = hasOcr
      ? `Voici le texte extrait d’un document (OCR) :\n\n"""${ocrText}"""\n\nConsigne de l’utilisateur : ${q || "(aucune)"}\n\nConsigne pour l’IA : Résume/explique et réponds clairement, en conservant la langue du texte OCR si possible.`
      : q;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: composedPrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setHistory(h => [{ role: "error", text: `Erreur: ${data?.error || `HTTP ${res.status}`}`, time: new Date().toISOString() }, ...h]);
      } else {
        setHistory(h => [{ role: "assistant", text: String(data.text || "Réponse vide."), time: new Date().toISOString() }, ...h]);
      }
    } catch (err: any) {
      setHistory(h => [{ role: "error", text: `Erreur: ${err?.message || "réseau"}`, time: new Date().toISOString() }, ...h]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">OneBoarding AI ✨</h1>

      {/* ===== BARRE UNIQUE : icônes intégrées + input + OK ===== */}
      <form onSubmit={handleSubmit} className="w-full max-w-md mb-4">
        <div className="flex items-stretch gap-2">
          {/* Champ avec icônes intégrées */}
          <div className="relative flex-1">
            {/* zone icônes à gauche */}
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 gap-1">
              {/* Bouton OCR (paperclip) */}
              <button
                type="button"
                onClick={() => setShowOcr(v => !v)}
                title="Joindre un document (OCR)"
                aria-label="Joindre un document (OCR)"
                className="h-9 w-9 grid place-items-center rounded-lg bg-white text-black hover:bg-gray-200 active:scale-[0.98] transition"
              >
                {/* Paperclip minimal SVG */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M7 12l7-7a4 4 0 115.657 5.657L9.879 20.435A6 6 0 111.05 11.607L12.293.364" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Bouton micro */}
              <button
                type="button"
                disabled={!speechSupported}
                onClick={toggleMic}
                title={speechSupported ? "Saisie vocale" : "Micro non supporté"}
                aria-label="Saisie vocale"
                className={`h-9 w-9 grid place-items-center rounded-lg transition
                  ${listening ? "bg-red-500 text-white" : "bg-white text-black hover:bg-gray-200"}
                  ${!speechSupported ? "opacity-50" : ""}
                `}
              >
                {/* Micro minimal SVG */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M6 10v1a6 6 0 0012 0v-1M12 20v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* input avec padding à gauche pour laisser respirer les icônes */}
            <input
              type="text"
              placeholder="Votre question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-xl px-24 pr-4 py-2 text-black"
            />
          </div>

          {/* Bouton OK */}
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-60"
          >
            {loading ? "…" : "OK"}
          </button>
        </div>
      </form>

      {/* Tiroir OCR */}
      {showOcr && (
        <div className="w-full max-w-md mb-6 animate-[fadeIn_.2s_ease]">
          <OcrUploader onText={setOcrText} onPreview={() => {}} />
        </div>
      )}

      {/* Historique */}
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

            {item.role === "assistant" && (
              <button
                onClick={() => copyToClipboard(item.text)}
                className="absolute right-3 bottom-3 text-xs px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25"
              >
                Copier
              </button>
            )}

            <p className="text-xs text-white/50 mt-6">
              {item.role === "user" ? "Vous" : item.role === "assistant" ? "IA" : "Erreur"} •{" "}
              {new Date(item.time).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <RgpdBanner />
    </div>
  );
                   }
