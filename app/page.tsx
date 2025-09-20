"use client";

import { useState, useEffect, useRef } from "react";

/* --- Bandeau RGPD --- */
function RgpdBanner() {
  const CONSENT_KEY = "oneboarding.rgpdConsent";
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem(CONSENT_KEY) !== "1") setShow(true); }
    catch { setShow(true); }
  }, []);
  const accept = () => { try { localStorage.setItem(CONSENT_KEY, "1"); } catch {} ; setShow(false); };
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-5xl px-4">
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

/* --- Types --- */
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

/* --- Page --- */
export default function Page() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // Copier
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // 🎙️ Saisie vocale
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recogRef = useRef<any>(null);

  // init SpeechRecognition
  useEffect(() => {
    const SR: any =
      (typeof window !== "undefined" && (window as any).SpeechRecognition) ||
      (typeof window !== "undefined" && (window as any).webkitSpeechRecognition);
    if (SR) {
      setSpeechSupported(true);
      const r = new SR();
      r.lang = "fr-FR";
      r.continuous = true;
      r.interimResults = true;

      r.onresult = (e: any) => {
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const tr = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += tr + " ";
          else setInput(prev => (prev ? prev + " " : "") + tr);
        }
        if (final) setInput(prev => (prev ? prev + " " : "") + final.trim());
      };

      r.onend = () => setListening(false);
      recogRef.current = r;
    }
  }, []);

  const toggleMic = () => {
    const r = recogRef.current;
    if (!r) return;
    if (listening) {
      r.stop();
      setListening(false);
      return;
    }
    try {
      r.start();
      setListening(true);
    } catch { /* démarrage multiple, ignorer */ }
  };

  // charge / save historique
  useEffect(() => {
    try { const s = localStorage.getItem("oneboarding.history"); if (s) setHistory(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("oneboarding.history", JSON.stringify(history)); } catch {}
  }, [history]);

  // copier
  async function handleCopy(text: string, id: number) {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(()=>setCopiedId(null),1500); }
    catch { alert("Impossible de copier le texte."); }
  }

  // ENVOI + RÉPONSE IA
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    const now = new Date().toISOString();
    setHistory(h => [{ role: "user", text: q, time: now }, ...h]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setHistory(h => [
          { role: "error", text: `Erreur: ${data?.error || `HTTP ${res.status}`}`, time: new Date().toISOString() },
          ...h,
        ]);
      } else {
        setHistory(h => [
          { role: "assistant", text: String(data.text || "Réponse vide."), time: new Date().toISOString() },
          ...h,
        ]);
      }
    } catch (err: any) {
      setHistory(h => [
        { role: "error", text: `Erreur: ${err?.message || "réseau"}`, time: new Date().toISOString() },
        ...h,
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6 fade-in text-center">OneBoarding AI ✨</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Décrivez votre besoin… (ou touchez le micro)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2 text-black"
        />

        {/* 🎙️ Bouton micro */}
        <button
          type="button"
          disabled={!speechSupported}
          onClick={toggleMic}
          title={speechSupported ? "Saisie vocale" : "Non supporté par ce navigateur"}
          className={`px-3 py-2 rounded-xl font-medium border
            ${listening ? "bg-red-500 text-white border-red-400" : "bg-white text-black hover:bg-gray-200 border-transparent"}
            disabled:opacity-50`}
        >
          {listening ? "⏹" : "🎤"}
        </button>

        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-60"
        >
          {loading ? "…" : "OK"}
        </button>
      </form>

      <div className="w-full max-w-md space-y-3">
        {history.map((item, idx) => (
          <div
            key={idx}
            className={`fade-in rounded-xl border p-3 ${
              item.role === "user"
                ? "border-white/10 bg-white/5"
                : item.role === "assistant"
                ? "border-emerald-300/20 bg-emerald-500/10"
                : "border-red-400/30 bg-red-500/10"
            }`}
          >
            <p className="text-white/90 whitespace-pre-wrap">{item.text}</p>

            <div className="mt-2 flex items-center justify-between text-xs text-white/50">
              <span>
                {item.role === "user" ? "Vous" : item.role === "assistant" ? "IA" : "Erreur"} •{" "}
                {new Date(item.time).toLocaleString()}
              </span>

              {item.role === "assistant" && (
                <button
                  onClick={() => handleCopy(item.text, idx)}
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
                >
                  {copiedId === idx ? "Copié !" : "Copier"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <RgpdBanner />
    </div>
  );
}
