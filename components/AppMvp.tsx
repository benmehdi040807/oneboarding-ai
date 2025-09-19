"use client";

import { useEffect, useState } from "react";
import RgpdBanner from "./RgpdBanner";

export default function AppMvp() {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const entry = { text: input.trim(), time: new Date().toISOString() };
    setHistory([entry, ...history]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-lg px-4 py-6 flex flex-col items-center">
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

      {/* Bandeau RGPD (fixe en bas) */}
      <RgpdBanner />
    </div>
  );
}
