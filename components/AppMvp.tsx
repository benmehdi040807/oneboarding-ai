// components/AppMvp.tsx
"use client";
import { useEffect, useState } from "react";

type Item = {
  role: "user" | "assistant" | "error";
  text: string;
  time: string;
};

export default function AppMvp() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("(prêt)");

  // Charger l'historique local
  useEffect(() => {
    try {
      const saved = localStorage.getItem("oneboarding.history");
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      setDebug(`Erreur lecture localStorage: ${(e as Error).message}`);
    }
  }, []);

  // Sauver l'historique local
  useEffect(() => {
    try {
      localStorage.setItem("oneboarding.history", JSON.stringify(history));
    } catch (e) {
      setDebug(`Erreur écriture localStorage: ${(e as Error).message}`);
    }
  }, [history]);

  // ⭐️ ENVOI + AFFICHAGE RÉPONSE
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    const now = new Date().toISOString();

    // 1) Afficher le message utilisateur
    setHistory((h) => [{ role: "user", text: q, time: now }, ...h]);
    setInput("");
    setLoading(true);
    setDebug("Appel /api/generate…");

    try {
      // 2) Appel API (POST)
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });

      // 3) Lire le JSON
      const data = await res.json();

      // 4) Gestion des erreurs côté API
      if (!res.ok || !data?.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        setHistory((h) => [
          {
            role: "error",
            text: `Erreur: ${msg}`,
            time: new Date().toISOString(),
          },
          ...h,
        ]);
        setDebug(`Erreur API: ${msg}`);
        return;
      }

      // 5) Afficher la réponse IA (data.text)
      const aiText: string =
        (data.text && String(data.text)) || "Réponse vide.";
      setHistory((h) => [
        { role: "assistant", text: aiText, time: new Date().toISOString() },
        ...h,
      ]);
      setDebug(`OK (${data.model || "modèle inconnu"})`);
    } catch (err: any) {
      // 6) Erreur réseau/JS
      setHistory((h) => [
        {
          role: "error",
          text: `Erreur: ${err?.message || "réseau"}`,
          time: new Date().toISOString(),
        },
        ...h,
      ]);
      setDebug(`Erreur JS: ${err?.message || "réseau"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-screen-sm px-4 py-6 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-center">OneBoarding AI ✨</h1>

        {/* Champ + bouton */}
        <form onSubmit={handleSubmit} className="w-full flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Décrivez votre besoin…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl px-4 py-2 text-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-60"
          >
            {loading ? "…" : "OK"}
          </button>
        </form>

        {/* Petit panneau debug (optionnel) */}
        <div className="w-full text-xs text-white/60 mb-4">
          État : {debug}
        </div>

        {/* Historique */}
        <div className="w-full space-y-3">
          {history.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-3 ${
                item.role === "user"
                  ? "border-white/10 bg-white/5"
                  : item.role === "assistant"
                  ? "border-emerald-300/20 bg-emerald-500/10"
                  : "border-red-400/30 bg-red-500/10"
              }`}
            >
              <p className="whitespace-pre-wrap">{item.text}</p>
              <p className="text-xs text-white/50 mt-1">
                {item.role === "user"
                  ? "Vous"
                  : item.role === "assistant"
                  ? "IA"
                  : "Erreur"}{" "}
                • {new Date(item.time).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
