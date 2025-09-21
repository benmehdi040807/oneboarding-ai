"use client";
export const runtime = "nodejs";

import { useEffect, useRef, useState } from "react";
import OcrUploader from "@/components/OcrUploader";

/* ===== mini keyframe util (pour le pulse du micro) ===== */
if (typeof document !== "undefined" && !document.getElementById("pulseSoftKF")) {
  const s = document.createElement("style");
  s.id = "pulseSoftKF";
  s.textContent = `
  @keyframes pulseSoft { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }`;
  document.head.appendChild(s);
}

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
  try {
    navigator.clipboard.writeText(text);
  } catch {}
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
      try {
        r.start();
      } catch {}
      return;
    }

    try {
      r.stop();
    } catch {}
    setTimeout(() => {
      if (listening) {
        try {
          r.abort?.();
        } catch {}
        setListening(false);
      }
    }, 800);
  }

  // historique
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

  // envoyer
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    const hasOcr = Boolean(ocrText.trim());
    if ((!q && !hasOcr) || loading) return;

    const now = new Date().toISOString();
    const userShown = q || (hasOcr ? "(Question vide — envoi du texte OCR uniquement)" : "");
    if (userShown) setHistory((h) => [{ role: "user", text: userShown, time: now }, ...h]);

    setInput("");
    setLoading(true);
    try { navigator.vibrate?.(15); } catch {} // #5 petite vibration

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
        setHistory((h) => [
          { role: "error", text: `Erreur: ${data?.error || `HTTP ${res.status}`}`, time: new Date().toISOString() },
          ...h,
        ]);
      } else {
        setHistory((h) => [
          { role: "assistant", text: String(data.text || "Réponse vide."), time: new Date().toISOString() },
          ...h,
        ]);
      }
    } catch (err: any) {
      setHistory((h) => [{ role: "error", text: `Erreur: ${err?.message || "réseau"}`, time: new Date().toISOString() }, ...h]);
    } finally {
      setLoading(false);
    }
  }

  const okDisabled = loading || (!input.trim() && !ocrText.trim());

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">OneBoarding AI ✨</h1>

      {/* ===== Barre fusionnée + OK (divider subtil) ===== */}
      <form onSubmit={handleSubmit} className="w-full max-w-[720px] mb-3">
        <div className="flex items-stretch w-full select-none">
          {/* zone de saisie */}
          <div className="flex-1 min-w-0 rounded-l-2xl bg-white text-black overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Votre question…"
              rows={2}
              className="w-full resize-none px-4 py-3 leading-6 placeholder-black/40 bg-transparent
                         focus:outline-none focus:ring-2 focus:ring-emerald-300/60" /* #1 focus ring */
            />
          </div>

          {/* séparateur visuel */}
          <div className="w-[1px] bg-black/10" />

          {/* bouton OK */}
          <button
            type="submit"
            disabled={okDisabled}
            title="Envoyer la question"
            className={`w-[100px] rounded-r-2xl bg-white text-black font-semibold
                        transition-colors grid place-items-center px-3
                        disabled:opacity-60 hover:bg-gray-100
                        shadow-sm active:scale-[0.98]`} /* #2 ombre + press */
          >
            {loading ? (
              /* #3 spinner clean */
              <svg className="animate-spin w-4 h-4 mx-[2px]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              "OK"
            )}
          </button>
        </div>

        {/* rangée d’actions sous la barre */}
        <div className="mt-3 flex gap-3 items-center">
          {/* Joindre (toggle OCR) */}
          <button
            type="button"
            onClick={() => setShowOcr((v) => !v)}
            title="Joindre un document (OCR)"
            className="w-11 h-11 rounded-xl bg-white text-black grid place-items-center hover:bg-gray-200 transition"
          >
            {/* trombone minimal */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7l-9.5 9.5a4 4 0 11-5.657-5.657L14.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Micro */}
          <button
            type="button"
            disabled={!speechSupported}
            onClick={toggleMic}
            title={speechSupported ? (listening ? "Arrêter l’écoute" : "Saisie vocale") : "Micro non supporté"}
            className={`w-11 h-11 rounded-xl grid place-items-center transition
                        ${listening
                          ? "bg-red-500 text-white border border-red-400 ring-2 ring-red-300/60 animate-[pulseSoft_1.5s_ease-in-out_infinite]"
                          : "bg-white text-black hover:bg-gray-200"} disabled:opacity-50`} /* #4 */
          >
            {/* micro minimal */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z" />
              <path d="M19 10v1a7 7 0 01-14 0v-1" />
              <path d="M12 17v4" />
            </svg>
          </button>
        </div>
      </form>

      {/* Tiroir OCR */}
      {showOcr && (
        <div className="w-full max-w-[720px] mb-6 animate-[fadeIn_.2s_ease]">
          <OcrUploader onText={setOcrText} onPreview={() => {}} />
        </div>
      )}

      {/* Historique */}
      <div className="w-full max-w-[720px] space-y-3">
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
                title="Copier la réponse"
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
