// components/AppMvp.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Menu from "@/components/Menu";

// 🔔 Bannière quota + i18n (même logique que app/page.tsx)
import QuotaPromoBanner from "@/components/QuotaPromoBanner";
import FR from "@/i18n/fr";
import EN from "@/i18n/en";
import AR from "@/i18n/ar";
import { noteInteractionAndMaybeLock, resetIfNewDay } from "@/lib/quota";

type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

export default function AppMvp() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // i18n pour la bannière
  const lang = useMemo<"fr" | "en" | "ar">(() => {
    if (typeof window === "undefined") return "fr";
    return (localStorage.getItem("oneboarding.lang") as "fr" | "en" | "ar") || "fr";
  }, []);
  const promoI18N = useMemo(() => (lang === "ar" ? AR.PROMO : lang === "en" ? EN.PROMO : FR.PROMO), [lang]);

  // Reset quota à minuit si la page reste ouverte
  useEffect(() => {
    resetIfNewDay();
  }, []);

  // Charger / Sauver l'historique local
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

    // 🧮 Quota gratuit (non-membres) — comptage “au clic OK”
    const plan = localStorage.getItem("oneboarding.plan"); // null si non-membre
    if (!plan) {
      const { reached } = noteInteractionAndMaybeLock();
      if (reached) {
        // On bloque l’envoi et on laisse le Menu prendre le relais (activation)
        window.dispatchEvent(new CustomEvent("ob:open-activate"));
        return;
      }
    }

    const now = new Date().toISOString();
    setHistory((h) => [{ role: "user", text: q, time: now }, ...h]);
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
        const raw = String(data?.error || `HTTP ${res.status}`);
        const msg = raw.includes("GROQ_API_KEY")
          ? "Service temporairement indisponible. (Configuration serveur requise)"
          : `Erreur: ${raw}`;
        setHistory((h) => [{ role: "error", text: msg, time: new Date().toISOString() }, ...h]);
      } else {
        setHistory((h) => [
          { role: "assistant", text: String(data.text || "Réponse vide."), time: new Date().toISOString() },
          ...h,
        ]);
      }
    } catch (err: any) {
      setHistory((h) => [
        { role: "error", text: `Erreur: ${err?.message || "réseau"}`, time: new Date().toISOString() },
        ...h,
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-screen-sm px-4 py-6 flex flex-col items-center">
        {/* Menu (pilote auth/activation/paiement en natif) */}
        <div className="w-full mb-4">
          <Menu />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-center">OneBoarding AI ✨</h1>

        {/* Champ + bouton — mobile-first */}
        <form onSubmit={handleSubmit} className="w-full flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Décrivez votre besoin…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl px-4 py-3 text-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-3 rounded-xl font-semibold bg-white text-black hover:bg-gray-100 active:scale-[.985] transition disabled:opacity-60"
          >
            {loading ? "…" : "OK"}
          </button>
        </form>

        {/* 🔔 Bannière quota (apparaît si non-membre et quota atteint / flag actif) */}
        <div className="w-full mb-4">
          <QuotaPromoBanner i18nPromo={promoI18N} />
        </div>

        {/* Historique */}
        <div className="w-full space-y-3">
          {loading && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="opacity-90">
                <span className="inline-block animate-pulse">•••</span>
              </p>
              <p className="text-xs opacity-60 mt-2">IA • {new Date().toLocaleString()}</p>
            </div>
          )}

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
              <p className="text-xs text-white/60 mt-2">
                {item.role === "user" ? "Vous" : item.role === "assistant" ? "IA" : "Erreur"} •{" "}
                {new Date(item.time).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
