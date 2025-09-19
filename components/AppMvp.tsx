"use client";

import { useEffect, useState } from "react";
import RgpdBanner from "./RgpdBanner";

type Item = {
  input: string;
  output?: string;
  time: string;
  status: "loading" | "done" | "error";
  error?: string;
};

export default function AppMvp() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger l'historique
  useEffect(() => {
    try {
      const saved = localStorage.getItem("oneboarding.history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Sauvegarder l'historique
  useEffect(() => {
    try {
      localStorage.setItem("oneboarding.history", JSON.stringify(history));
    } catch {}
  }, [history]);

  async function generate(text: string) {
    setLoading(true);
    // on insère une carte "en cours"
    const entry: Item = {
      input: text,
      time: new Date().toISOString(),
      status: "loading",
    };
    setHistory((h) => [entry, ...h]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, locale: "fr" }),
      });

      const data = await res.json();

      setHistory((h) => {
        const [first, ...rest] = h;
        if (!first) return h;
        if (!data.ok) {
          return [
            {
              ...first,
              status: "error",
              error: data.error ?? "Échec de génération.",
            },
            ...rest,
          ];
        }
        return [
          {
            ...first,
            status: "done",
            output: String(data.output ?? "").trim(),
          },
          ...rest,
        ];
      });
    } catch (e: any) {
      setHistory((h) => {
        const [first, ...rest] = h;
        if (!first) return h;
        return [
          { ...first, status: "error", error: e?.message ?? "Erreur réseau." },
          ...rest,
        ];
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    generate(text);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="mx-auto w-full max-w-lg px-4 py-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 fade-in text-center">
          OneBoarding AI ✨
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
            disabled={loading}
            className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-60"
          >
            OK
          </button>
        </form>

        <div className="w-full space-y-4">
          {history.map((item, idx) => (
            <div
              key={idx}
              className="fade-in rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <p className="text-xs text-white/60 mb-1">
                {new Date(item.time).toLocaleString()}
              </p>
              <p className="text-white/90 mb-2">
                <span className="text-white/60">Vous :</span> {item.input}
              </p>

              {item.status === "loading" && (
                <p className="text-white/80">⏳ Génération en cours…</p>
              )}

              {item.status === "error" && (
                <p className="text-red-300">
                  ❌ {item.error ?? "Erreur de génération."}
                </p>
              )}

              {item.status === "done" && (
                <div className="prose prose-invert max-w-none">
                  {/* On affiche du markdown simple tel quel */}
                  <pre className="whitespace-pre-wrap">{item.output}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bandeau RGPD (fixe en bas) */}
      <RgpdBanner />
    </div>
  );
}
