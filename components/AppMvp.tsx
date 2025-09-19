// components/AppMvp.tsx
"use client";

/**
 * AppMvp v2 (debug visuel)
 * - Affiche la dernière réponse brute de l'API (panneau Debug)
 * - Ajoute systématiquement la réponse IA dans l'historique si ok === true
 * - Gestion claire des erreurs (elles apparaissent aussi dans l'historique)
 */

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

  // 👀 Panneau de debug à l’écran (utile sans console)
  const [debug, setDebug] = useState<string>("(prêt)");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("oneboarding.history");
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      setDebug(`Erreur lecture localStorage: ${(e as Error).message}`);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("oneboarding.history", JSON.stringify(history));
    } catch (e) {
      setDebug(`Erreur écriture localStorage: ${(e as Error).message}`);
    }
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
    setDebug("Envoi au serveur…");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });

      // Si le serveur ne renvoie pas du JSON valide, on gère proprement
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const raw = await res.text();
        data = { ok: false, error: `Réponse non-JSON: ${raw.slice(0, 200)}` };
      }

      setDebug(`Réponse API: ${JSON.stringify(data)}`);

      if (!data || data.ok !== true) {
        const errItem: Item = {
          role: "error",
          text:
            "Erreur: " +
            (data?.error ||
              `statut HTTP ${res.status} / ${res.statusText}`),
          time: new Date().toISOString(),
        };
        setHistory((h) => [errItem, ...h]);
        return;
      }

      // ✅ Ajout clair de la réponse IA
      const aiText =
        (typeof data.text === "string" && data.text.trim()) ||
        "Réponse vide reçue.";
      const aiItem: Item = {
        role: "assistant",
        text: aiText,
        time: new Date().toISOString(),
      };
      setHistory((h) => [aiItem, ...h]);
    } catch (err: any) {
      const errItem: Item = {
        role: "error",
        text: `Erreur réseau: ${err?.message || "inconnue"}`,
        time: new Date().toISOString(),
      };
      setHistory((h) => [errItem, ...h]);
      setDebug(`Catch: ${err?.message || String(err)}`);
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

        <form onSubmit={handleSubmit} className="w-full flex gap-2 mb-4">
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

        {/* 🧪 Panneau Debug visible (tu peux le supprimer quand tout est OK) */}
        <div className="w-full mb-6 text-xs text-white/70 bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="font-semibold mb-1">Debug</div>
          <pre className="whitespace-pre-wrap break-words">{debug}</pre>
        </div>

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
