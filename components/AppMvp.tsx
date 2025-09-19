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

  // 🔎 Panneau de debug (utile sans console)
  const [debug, setDebug] = useState<string>("(prêt)");
  const [openDebug, setOpenDebug] = useState(false);

  // Charger l'historique
  useEffect(() => {
    try {
      const saved = localStorage.getItem("oneboarding.history");
      if (saved) setHistory(JSON.parse(saved));
      setDebug("Historique chargé.");
    } catch (e) {
      setDebug(`Erreur lecture localStorage: ${(e as Error).message}`);
    }
  }, []);

  // Sauvegarder l'historique
  useEffect(() => {
    try {
      localStorage.setItem("oneboarding.history", JSON.stringify(history));
    } catch (e) {
      setDebug(`Erreur écriture localStorage: ${(e as Error).message}`);
    }
  }, [history]);

  // Test rapide de l’API (GET /api/generate)
  async function checkApi() {
    try {
      setDebug("Test API…");
      const r = await fetch("/api/generate");
      const j = await r.json();
      setDebug(
        j?.ready
          ? "API OK ✅ (clé détectée)"
          : "API NOK ❌ (clé manquante ou invalide)"
      );
    } catch (e: any) {
      setDebug(`API erreur: ${e?.message || "réseau"}`);
    }
  }

  // Vider l'historique
  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem("oneboarding.history");
    } catch {}
    setDebug("Historique vidé.");
  }

  // Soumission du besoin
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    const now = new Date().toISOString();
    const userItem: Item = { role: "user", text: q, time: now };
    setHistory((h) => [userItem, ...h]);
    setInput("");
    setLoading(true);
    setDebug("Envoi à l’API…");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });

      const data = await res.json();

      if (!data?.ok) {
        const msg = data?.error || "échec appel API";
        setHistory((h) => [
          {
            role: "error",
            text: `Erreur: ${msg}`,
            time: new Date().toISOString(),
          },
          ...h,
        ]);
        setDebug(`Réponse API en erreur ❌ : ${msg}`);
      } else {
        setHistory((h) => [
          {
            role: "assistant",
            text: data.text,
            time: new Date().toISOString(),
          },
          ...h,
        ]);
        setDebug("Réponse IA reçue ✅");
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
      setDebug(`Exception ❌ : ${err?.message || "réseau"}`);
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

        <form onSubmit={handleSubmit} className="w-full flex gap-2 mb-3">
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

        {/* Petite barre d’actions */}
        <div className="w-full mb-5 flex items-center justify-between text-xs text-white/70">
          <button
            onClick={checkApi}
            className="underline underline-offset-2 hover:text-white"
          >
            Tester l’API
          </button>
          <button
            onClick={() => setOpenDebug((v) => !v)}
            className="underline underline-offset-2 hover:text-white"
          >
            {openDebug ? "Masquer debug" : "Afficher debug"}
          </button>
          <button
            onClick={clearHistory}
            className="underline underline-offset-2 hover:text-white"
          >
            Vider l’historique
          </button>
        </div>

        {/* Zone debug (affichée/masquée) */}
        {openDebug && (
          <div className="w-full mb-5 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
            <span className="font-medium text-white/80">Debug :</span>{" "}
            <span className="text-white/70">{debug}</span>
          </div>
        )}

        {/* Liste des messages */}
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
                {item.role === "user"
                  ? "Vous"
                  : item.role === "assistant"
                  ? "IA"
                  : "Erreur"}
                {" • "}
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
