// components/AppMvp.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Menu from "@/components/Menu";
import SubscribeModal from "@/components/SubscribeModal";
import CodeAccessDialog from "@/components/CodeAccessDialog";
import PaymentModal from "@/components/PaymentModal";
import RenewalNag from "@/components/RenewalNag";
import { attachAutoTokenGuard } from "@/lib/validateToken";

type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

export default function AppMvp() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("(prêt)");

  // Modals contrôlés par la page
  const [openSubscribe, setOpenSubscribe] = useState(false);
  const [openCodeDialog, setOpenCodeDialog] = useState(false);

  // ✅ Garde auto: revalide le token au chargement et à chaque changement de connexion
  useEffect(() => {
    const dispose = attachAutoTokenGuard();
    return dispose;
  }, []);

  // ---------- helpers état d’accès ----------
  const isSpaceActive = useMemo(() => {
    try {
      const active = localStorage.getItem("oneboarding.spaceActive") === "1";
      const plan = localStorage.getItem("oneboarding.plan") as
        | "subscription"
        | "one-month"
        | null;
      if (!active || !plan) return false;
      if (plan === "subscription") return true;
      const until = Number(localStorage.getItem("oneboarding.activeUntil") || 0);
      return until > Date.now();
    } catch {
      return false;
    }
  }, [history.length]);

  const freeUsedRef = useRef<number>(0);
  useEffect(() => {
    try {
      const s = localStorage.getItem("oneboarding.freeUsed");
      freeUsedRef.current = s ? parseInt(s) || 0 : 0;
    } catch {
      freeUsedRef.current = 0;
    }
  }, []);
  function incFreeCount() {
    try {
      freeUsedRef.current += 1;
      localStorage.setItem("oneboarding.freeUsed", String(freeUsedRef.current));
    } catch {}
  }

  // Charger / Sauver l'historique local
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

  // ---------- Raccordement aux événements Menu ----------
  useEffect(() => {
    const openConnect = () => setOpenCodeDialog(true);
    const openActivate = () => setOpenSubscribe(true);
    const openPayment = (e: Event) => {
      const custom = e as CustomEvent<{ phoneE164?: string }>;
      window.dispatchEvent(new CustomEvent("ob:open-payment", { detail: custom?.detail || {} }));
      // NB: PaymentModal écoute déjà "ob:open-payment" pour s'ouvrir côté composant.
    };
    window.addEventListener("ob:open-connect", openConnect);
    window.addEventListener("ob:open-activate", openActivate);
    window.addEventListener("ob:open-payment", openPayment);
    return () => {
      window.removeEventListener("ob:open-connect", openConnect);
      window.removeEventListener("ob:open-activate", openActivate);
      window.removeEventListener("ob:open-payment", openPayment);
    };
  }, []);

  // Connexion OTP → ouvrir Paiement automatiquement
  useEffect(() => {
    const onConnectedChanged = () => {
      const connected = localStorage.getItem("ob_connected") === "1";
      if (connected) {
        const phoneE164 = localStorage.getItem("oneboarding.phoneE164") || undefined;
        window.dispatchEvent(new CustomEvent("ob:open-payment", { detail: { phoneE164 } }));
      }
    };
    window.addEventListener("ob:connected-changed", onConnectedChanged);
    return () => window.removeEventListener("ob:connected-changed", onConnectedChanged);
  }, []);

  // ENVOI + AFFICHAGE RÉPONSE (avec gating 3 gratuites)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    // Gate: si pas actif et déjà 3 réponses, on bloque et on lance le flux d’activation
    if (!isSpaceActive && freeUsedRef.current >= 3) {
      setOpenSubscribe(true); // OTP
      setDebug("Limite atteinte → OTP requis avant paiement");
      return;
    }

    const now = new Date().toISOString();
    setHistory((h) => [{ role: "user", text: q, time: now }, ...h]);
    setInput("");
    setLoading(true);
    setDebug("Appel /api/generate…");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        setHistory((h) => [
          { role: "error", text: `Erreur: ${msg}`, time: new Date().toISOString() },
          ...h,
        ]);
        setDebug(`Erreur API: ${msg}`);
        return;
      }

      const aiText = String(data.text || "Réponse vide.");
      setHistory((h) => [
        { role: "assistant", text: aiText, time: new Date().toISOString() },
        ...h,
      ]);
      setDebug(`OK (${data.model || "modèle inconnu"})`);

      // Si l’espace n’est pas actif, on compte cette réponse offerte
      if (!isSpaceActive) incFreeCount();
    } catch (err: any) {
      setHistory((h) => [
        { role: "error", text: `Erreur: ${err?.message || "réseau"}`, time: new Date().toISOString() },
        ...h,
      ]);
      setDebug(`Erreur JS: ${err?.message || "réseau"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Modals “globaux” */}
      <PaymentModal />
      <RenewalNag />
      <SubscribeModal
        open={openSubscribe}
        onClose={() => {
          setOpenSubscribe(false);
          // Enchaînement fluide vers la saisie du code OTP
          setTimeout(() => setOpenCodeDialog(true), 80);
        }}
      />
      <CodeAccessDialog
        open={openCodeDialog}
        onClose={() => setOpenCodeDialog(false)}
      />

      <div className="mx-auto max-w-screen-sm px-4 py-6 flex flex-col items-center">
        <div className="w-full mb-4">
          <Menu />
        </div>

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

        {/* Petit panneau debug (sans compteur visuel) */}
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
