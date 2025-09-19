// components/AppMvp.tsx
"use client";

import { useEffect, useState } from "react";
import RgpdBanner from "./RgpdBanner";

type Item = {
  role: "user" | "assistant" | "error";
  text: string;
  time: string;
};

export default function AppMvp() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    const now = new Date().toISOString();
    const userItem: Item = { role: "user", text: q, time: now };
    setHistory((h) => [userItem, ...h]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });
      const data = await res.json();

      if (!data?.ok) {
        const errItem: Item = {
          role: "error",
          text: `Erreur: ${data?.error || "échec appel API"}`,
          time: new Date().toISOString(),
        };
        setHistory((h) => [errItem, ...h]);
      } else {
        const aiItem: Item = {
          role: "assistant",
          text: data.text,
          time: new Date().toISOString(),
        };
        setHistory((h) => [aiItem, ...h]);
      }
    } catch (err: any) {
      const errItem: Item = {
        role: "error",
        text: `Erreur: ${err?.message || "réseau"}`,
        time: new Date().toISOString(),
      };
      setHistory((h) => [errItem, ...h]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-screen-sm px-4 py-6 flex flex-col items-center">
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
            {loading ? "..." : "OK"}
          </button>
        </form>

        <div className="w-full space-y-3">
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
              <p className="text-xs text-white/50 mt-1">
                {item.role === "user" ? "Vous" : item.role === "assistant" ? "IA" : "Erreur"}
                {" • "}
                {new Date(item.time).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <RgpdBanner />
    </div>
  );
}
