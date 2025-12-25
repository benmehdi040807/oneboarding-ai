// components/AppMvp.tsx
"use client";

import { useEffect, useState } from "react";
import Menu from "@/components/Menu";
import WelcomeLimitDialog from "@/components/WelcomeLimitDialog";

type Item = { role: "user" | "assistant" | "error"; text: string; time: string };
type Lang = "fr" | "en" | "ar";

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "fr";
  try {
    const sp = new URLSearchParams(window.location.search);
    const q =
      (sp.get("lang") ||
        document.documentElement.lang ||
        localStorage.getItem("oneboarding.lang") ||
        "fr")
        .toLowerCase()
        .trim();
    return (["fr", "en", "ar"].includes(q) ? (q as Lang) : "fr");
  } catch {
    return "fr";
  }
}

export default function AppMvp() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // Lang pour la modale Welcome (labels)
  const [lang, setLang] = useState<Lang>(getInitialLang());
  useEffect(() => {
    const onLang = (e: Event) => {
      const detail = (e as CustomEvent).detail as { lang?: string } | undefined;
      const next =
        (detail?.lang as Lang) ||
        (localStorage.getItem("oneboarding.lang") as Lang) ||
        (document.documentElement.lang as Lang) ||
        "fr";
      setLang((["fr", "en", "ar"].includes(next) ? next : "fr") as Lang);
    };
    window.addEventListener("ob:lang-changed", onLang as EventListener);
    return () =>
      window.removeEventListener("ob:lang-changed", onLang as EventListener);
  }, []);

  // 🔔 Modale quota atteint (décision serveur)
  const [welcomeOpen, setWelcomeOpen] = useState(false);

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

      const data = await res.json().catch(() => ({} as any));

      // ✅ NOUVEAU : limite free -> modale Welcome (pas de message "Erreur: FREE_DAILY_LIMIT")
      if (res.status === 429 && data?.error === "FREE_DAILY_LIMIT") {
        setWelcomeOpen(true);
        return;
      }

      if (!res.ok || !data?.ok) {
        const raw = String(data?.error || `HTTP ${res.status}`);
        const msg = raw.includes("GROQ_API_KEY")
          ? "Service temporairement indisponible. (Configuration serveur requise)"
          : `Erreur: ${raw}`;
        setHistory((h) => [
          { role: "error", text: msg, time: new Date().toISOString() },
          ...h,
        ]);
        return;
      }

      setHistory((h) => [
        {
          role: "assistant",
          text: String(data.text || "Réponse vide."),
          time: new Date().toISOString(),
        },
        ...h,
      ]);
    } catch (err: any) {
      setHistory((h) => [
        {
          role: "error",
          text: `Erreur: ${err?.message || "réseau"}`,
          time: new Date().toISOString(),
        },
        ...h,
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-screen-sm px-4 py-6 flex flex-col items-center">
        <div className="w-full mb-4">
          <Menu />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-center">OneBoarding AI ✨</h1>

        <form onSubmit={handleSubmit} className="w-full flex gap-2 mb-3">
          <input
            type="text"
            placeholder={
              lang === "ar"
                ? "اكتب احتياجك…"
                : lang === "en"
                ? "Describe your need…"
                : "Décrivez votre besoin…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl px-4 py-3 text-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-3 rounded-xl font-semibold bg-white text-black hover:bg-gray-100 active:scale-[.985] transition disabled:opacity-60"
          >
            {loading ? "…" : lang === "ar" ? "موافق" : "OK"}
          </button>
        </form>

        <div className="w-full space-y-3">
          {loading && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="opacity-90">
                <span className="inline-block animate-pulse">•••</span>
              </p>
              <p className="text-xs opacity-60 mt-2">
                IA • {new Date().toLocaleString()}
              </p>
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
                {item.role === "user"
                  ? lang === "ar"
                    ? "أنت"
                    : lang === "en"
                    ? "You"
                    : "Vous"
                  : item.role === "assistant"
                  ? "IA"
                  : lang === "ar"
                  ? "خطأ"
                  : lang === "en"
                  ? "Error"
                  : "Erreur"}
                {" • "}
                {new Date(item.time).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <WelcomeLimitDialog
          open={welcomeOpen}
          onClose={() => setWelcomeOpen(false)}
          lang={lang}
        />
      </div>
    </div>
  );
            }
