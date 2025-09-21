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

  // ===== Auto-scroll refs =====
  const topRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollRef = useRef(false);

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

    // stop + fallback abort si onend ne vient pas
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

  // Auto-scroll quand un nouveau message assistant/erreur arrive
  useEffect(() => {
    if (!shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    // remonter en haut (nouveaux messages sont en haut)
    requestAnimationFrame(() => {
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }, [history]);

  // envoyer
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    const hasOcr = Boolean(ocrText.trim());
    if ((!q && !hasOcr) || loading) return;

    // refermer clavier mobile pour libérer l’écran
    (document.activeElement as HTMLElement | null)?.blur?.();

    const now = new Date().toISOString();
    const userShown = q || (hasOcr ? "(Question vide — envoi du texte OCR uniquement)" : "");
    if (userShown) setHistory((h) => [{ role: "user", text: userShown, time: now }, ...h]);

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
      // Une réponse a été ajoutée : on déclenche l'auto-scroll
      shouldScrollRef.current = true;
    } catch (err: any) {
      setHistory((h) => [
        { role: "error", text: `Erreur: ${err?.message || "réseau"}`, time: new Date().toISOString() },
        ...h,
      ]);
      shouldScrollRef.current = true;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      {/* ancre pour auto-scroll */}
      <div ref={topRef} />

      <h1 className="text-2xl font-bold mb-6 text-center">OneBoarding AI ✨</h1>

      {/* ===== Barre fusionnée : input + OK ===== */}
      <form onSubmit={handleSubmit} className="w-full max-w-md mb-3">
        <div className="flex items-stretch w-full">
          {/* zone de texte */}
          <div className="flex-1 bg-white rounded-l-2xl px-4 py-3 text-black border border-white/10 border-r-0">
            <input
              type="text"
              placeholder="Votre question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </div>
          {/* séparateur subtil */}
          <div className="w-px bg-white/20" />
          {/* bouton OK fusionné */}
          <button
            type="submit"
            disabled={loading}
            className="rounded-r-2xl bg-white text-black px-6 font-semibold hover:bg-gray-200 transition disabled:opacity-60 border border-white/10 border-l-0"
            style={{ minWidth: 110 }}
          >
            {loading ? "…" : "OK"}
          </button>
        </div>
      </form>

      {/* Deux icônes sous la barre, à gauche */}
      <div className="w-full max-w-md flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setShowOcr((v) => !v)}
          className="h-12 w-12 grid place-items-center rounded-xl bg-white text-black border border-white/10 hover:bg-gray-200 transition"
          title="Joindre un document (OCR)"
        >
          {/* trombone épuré (SVG) */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 12.5l6.5-6.5a3.5 3.5 0 015 5L9.5 19a4.5 4.5 0 01-6.5-6.5l8-8"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          disabled={!speechSupported}
          onClick={toggleMic}
          className={`h-12 w-12 grid place-items-center rounded-xl border transition ${
            listening
              ? "bg-red-500 text-white border-red-400"
              : "bg-white text-black hover:bg-gray-200 border-white/10"
          } disabled:opacity-50`}
          title={speechSupported ? "Saisie vocale" : "Micro non supporté"}
        >
          {/* micro épuré (SVG) */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="4" width="6" height="10" rx="3" stroke="black" strokeWidth="2" />
            <path d="M5 11a7 7 0 0014 0" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 18v3" stroke="black" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

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
