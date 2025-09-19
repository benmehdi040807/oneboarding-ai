"use client";

import { useEffect, useState } from "react";

/* --- Petit composant bandeau RGPD, intégré directement ici --- */
const CONSENT_KEY = "oneboarding.rgpdConsent";
function RgpdBannerInline() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const force = sp.get("rgpd") === "1";
      if (force) localStorage.removeItem(CONSENT_KEY);

      const v = localStorage.getItem(CONSENT_KEY);
      setShow(force || v !== "1");
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
      <div className="mx-auto max-w-xl px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="m-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-3 sm:p-4">
          <p className="text-sm text-white/90 leading-relaxed">
            Vos données restent privées sur cet appareil. Vous pouvez{" "}
            <a href="/legal" className="underline">
              exporter ou supprimer
            </a>{" "}
            vos informations à tout moment.
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href="/legal"
              className="px-3 py-2 rounded-xl border border-white/20 text-white/90 text-sm"
            >
              En savoir plus
            </a>
            <button
              onClick={accept}
              className="px-3 py-2 rounded-xl bg-white text-black text-sm font-medium"
            >
              D’accord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Page d’accueil autonome (sans import externe) --- */
export default function Page() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ text: string; time: string }[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("oneboarding.history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("oneboarding.history", JSON.stringify(history));
    } catch {}
  }, [history]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const entry = { text, time: new Date().toISOString() };
    setHistory((prev) => [entry, ...prev]);
    setInput("");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-lg w-full px-4 py-6 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 fade-in text-center">
          OneBoarding AI ⚡✨
        </h1>

        <form onSubmit={handleSubmit} className="w-full flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Décrivez votre besoin..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl px-4 py-2 text-black"
          />
          <button
            type="submit"
            className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            OK
          </button>
        </form>

        <div className="w-full space-y-3">
          {history.map((item, idx) => (
            <div
              key={idx}
              className="fade-in rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <p className="text-white/90">{item.text}</p>
              <p className="text-xs text-white/50 mt-1">
                {new Date(item.time).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bandeau RGPD en bas */}
      <RgpdBannerInline />
    </div>
  );
}
