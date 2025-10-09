// app/page.tsx
"use client";
export const runtime = "nodejs";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import OcrUploader from "@/components/OcrUploader";
import Menu from "@/components/Menu";
import CodeAccessDialog from "@/components/CodeAccessDialog";
import SubscribeModal from "@/components/SubscribeModal";

// Boutons (➕ / 🔑) à droite de la barre
const RightAuthButtons = dynamic(() => import("@/components/RightAuthButtons"), { ssr: false });

/* =================== Const =================== */
const CONSENT_KEY = "oneboarding.legalConsent.v1";

/* =================== Modal confirmation générique =================== */
function ConfirmDialog({
  open, title = "Confirmer", description = "", confirmLabel = "Confirmer", cancelLabel = "Annuler",
  onConfirm, onCancel,
}: {
  open: boolean; title?: string; description?: string; confirmLabel?: string; cancelLabel?: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector<HTMLButtonElement>("button[data-autofocus='true']")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white"
      >
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {description ? <p className="text-sm opacity-90 mb-4">{description}</p> : null}
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} data-autofocus="true" className="px-4 py-2 rounded-2xl bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== Modal légal (CGU / Privacy) =================== */
function LegalModal({
  open, onClose,
}: {
  open: boolean; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConsented(localStorage.getItem(CONSENT_KEY) === "1");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onPrimary = () => {
    if (!consented) {
      try { localStorage.setItem(CONSENT_KEY, "1"); } catch {}
      setConsented(true);
      window.dispatchEvent(new Event("ob:consent-updated"));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">CGU / Privacy</h2>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <p className="text-sm opacity-90 mt-3">
          OneBoarding AI respecte votre confidentialité. Vos données restent locales sur votre appareil.
          En poursuivant, vous acceptez nos Conditions Générales d’Utilisation et notre Politique de Confidentialité.
        </p>

        <div className="mt-4 flex gap-2">
          <a
            href="/legal"
            className="flex-1 text-center px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
          >
            Lire le détail
          </a>
          <button
            onClick={onPrimary}
            className="flex-1 px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-gray-100"
          >
            Lu et approuvé
          </button>
        </div>

        {consented && (
          <p className="mt-2 text-xs opacity-80">
            Consentement déjà enregistré. Cliquer sur « Lu et approuvé » ferme simplement cette fenêtre.
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-2 w-full text-center text-sm opacity-80 hover:opacity-100 underline underline-offset-4"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}

/* =================== Types & utils =================== */
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };
const cleanText = (s: string) => s.replace(/\s+/g, " ").replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1").trim();

// copie robuste (Clipboard API + fallback execCommand)
async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/* =================== Page =================== */
export default function Page() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // OCR
  const [showOcr, setShowOcr] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const ocrContainerRef = useRef<HTMLDivElement | null>(null);

  // 🎙️ Micro
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  const baseInputRef = useRef<string>("");

  // 🧹 Modal Effacer
  const [showClearModal, setShowClearModal] = useState(false);

  // ⚖️ Modal légal (ouvert si Menu émet ob:open-legal et qu’aucun consentement)
  const [showLegal, setShowLegal] = useState(false);
  useEffect(() => {
    const onOpenLegal = () => {
      const consented = localStorage.getItem(CONSENT_KEY) === "1";
      if (!consented) setShowLegal(true);
    };
    window.addEventListener("ob:open-legal", onOpenLegal as EventListener);
    return () => window.removeEventListener("ob:open-legal", onOpenLegal as EventListener);
  }, []);

  // 🔐 Modals natifs: connexion / activation espace
  const [showConnect, setShowConnect] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  useEffect(() => {
    const onOpenConnect = () => setShowConnect(true);
    const onOpenActivate = () => setShowSubscribe(true);
    window.addEventListener("ob:open-connect", onOpenConnect as EventListener);
    window.addEventListener("ob:open-activate", onOpenActivate as EventListener);
    return () => {
      window.removeEventListener("ob:open-connect", onOpenConnect as EventListener);
      window.removeEventListener("ob:open-activate", onOpenActivate as EventListener);
    };
  }, []);

  // Textarea auto-expansion (×3 lignes)
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = "auto";
    const max = 3, lineHeight = 24, maxHeight = max * lineHeight + 16;
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + "px";
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  // SpeechRec init
  useEffect(() => {
    const SR: any =
      (typeof window !== "undefined" && (window as any).SpeechRecognition) ||
      (typeof window !== "undefined" && (window as any).webkitSpeechRecognition);
    if (!SR) return;

    setSpeechSupported(true);
    const r = new SR();
    r.lang = "fr-FR";
    r.continuous = true;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onstart = () => { baseInputRef.current = input; setListening(true); };
    r.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) final += " " + e.results[i][0].transcript;
      setInput(cleanText([baseInputRef.current, final].join(" ")));
    };
    const stopUI = () => setListening(false);
    r.onend = r.onspeechend = r.onaudioend = r.onnomatch = r.onerror = stopUI;

    recogRef.current = r;
  }, []);

  function toggleMic() {
    const r = recogRef.current; if (!r) return;
    if (!listening) { try { r.start(); } catch {} return; }
    try { r.stop(); } catch {}
    setTimeout(() => { if (listening) { try { r.abort?.(); } catch {} setListening(false); } }, 600);
  }

  // historique persist
  useEffect(() => {
    try { const s = localStorage.getItem("oneboarding.history"); if (s) setHistory(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("oneboarding.history", JSON.stringify(history)); } catch {}
  }, [history]);

  // 🔄 réagir aux effacements/maj venant du Menu (sans refresh)
  useEffect(() => {
    const reload = () => {
      try {
        const s = localStorage.getItem("oneboarding.history");
        const arr = s ? (JSON.parse(s) as Item[]) : [];
        setHistory(arr);
      } catch {
        setHistory([]);
      }
    };
    const clear = () => setHistory([]);

    window.addEventListener("ob:history-cleared", clear as EventListener);
    window.addEventListener("ob:history-updated", reload as EventListener);

    return () => {
      window.removeEventListener("ob:history-cleared", clear as EventListener);
      window.removeEventListener("ob:history-updated", reload as EventListener);
    };
  }, []);

  // Auto-scroll top après génération
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) window.scrollTo({ top: 0, behavior: "smooth" });
    prevLoadingRef.current = loading;
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    const hasOcr = Boolean(ocrText.trim());
    if (!q && !hasOcr) return;
    if (loading) return;

    const now = new Date().toISOString();
    const userShown = q || (hasOcr ? "(Question vide — envoi du texte OCR uniquement)" : "");
    if (userShown) setHistory((h) => [{ role: "user", text: userShown, time: now }, ...h]);

    setInput(""); setLoading(true);

    const composedPrompt = hasOcr
      ? `Voici le texte extrait d’un document (OCR) :\n\n"""${ocrText}"""\n\nConsigne de l’utilisateur : ${
          q || "(aucune)"
        }\n\nConsigne pour l’IA : Résume/explique et réponds clairement, en conservant la langue du texte OCR si possible.`
      : q;

    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: composedPrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const raw = String(data?.error || `HTTP ${res.status}`);
        let msg = `Erreur: ${raw}`;
        if (raw.includes("GROQ_API_KEY")) msg = "Service temporairement indisponible. (Configuration serveur requise)";
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

  // Déclenche file input d’OcrUploader
  function triggerHiddenFileInput() {
    const container = ocrContainerRef.current;
    if (!container) return;
    const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    input?.click();
  }

  // Effacer (utilitaire)
  function clearHistory() {
    setHistory([]);
    try { localStorage.removeItem("oneboarding.history"); } catch {}
    setShowClearModal(false);
    // informer les autres (au cas où)
    window.dispatchEvent(new Event("ob:history-cleared"));
  }

  return (
    <div className="fixed inset-0 overflow-y-auto text-[var(--fg)] flex flex-col items-center p-6 pb-[120px] selection:bg-[var(--accent)/30] selection:text-[var(--fg)]">
      <StyleGlobals />
      <div className="halo" aria-hidden />

      {/* Logo */}
      <div className="mb-1 -mt-1 flex justify-center">
        <div className="relative h-32 w-32 md:h-44 md:w-44 overflow-hidden">
          <Image
            src="/brand/oneboardingai-logo.png"
            alt="OneBoarding AI — logomark"
            fill
            priority
            className="object-contain -translate-y-3 md:-translate-y-4 drop-shadow-[0_0_40px_rgba(56,189,248,0.30)]"
          />
        </div>
      </div>

      {/* Barre d’entrée */}
      <form onSubmit={handleSubmit} className="w-full max-w-md mb-2 z-[10]">
        <div className="flex items-stretch shadow-[0_6px_26px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden border border-[var(--border)]">
          <textarea
            ref={taRef}
            placeholder="Votre question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 min-w-0 px-4 py-3 text-white bg-[var(--panel)] outline-none resize-none leading-6"
            rows={1}
            style={{ maxHeight: 96 }}
          />
          <div className="w-px bg-[var(--border)]" aria-hidden />
          <button
            type="submit"
            disabled={loading}
            className="px-5 md:px-6 font-medium bg-[var(--panel-strong)] text-white hover:bg-[var(--panel-stronger)] transition disabled:opacity-60"
          >
            {loading ? "…" : "OK"}
          </button>
        </div>

        {/* actions sous la barre : 2 à gauche + boutons à droite */}
        <div className="mt-3 flex gap-3 items-center">
          {/* 📎 OCR */}
          <button
            type="button"
            onClick={() => setShowOcr((v) => !v)}
            className="h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] grid place-items-center transition"
            title="Joindre un document (OCR)"
            aria-label="Joindre un document"
          >
            <svg className="h-6 w-6 text-[var(--fg)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l8.49-8.49a4 4 0 015.66 5.66L10 16.83a2 2 0 11-2.83-2.83l7.78-7.78" />
            </svg>
          </button>

          {/* 🎤 Micro */}
          <button
            type="button"
            disabled={!speechSupported}
            onClick={toggleMic}
            className={`h-12 w-12 rounded-xl border grid place-items-center transition
              ${listening ? "border-[var(--accent)] bg-[color:var(--accent-tint)] mic-pulse" : "border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]"}
              disabled:opacity-50`}
            aria-label={speechSupported ? (listening ? "Arrêter le micro" : "Parler") : "Micro non supporté"}
            title={speechSupported ? "Saisie vocale" : "Micro non supporté"}
          >
            <svg className="h-6 w-6 text-[var(--fg)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1.5a3 3 0 00-3 3v7a3 3 0 006 0v-7a3 3 0 00-3-3z" />
              <path d="M19 10.5a7 7 0 01-14 0" />
              <path d="M12 21v-3" />
            </svg>
          </button>

          {/* ➕ / 🔑 à droite */}
          <div className="ml-auto">
            <RightAuthButtons />
          </div>
        </div>
      </form>

      {/* Tiroir OCR */}
      {showOcr && (
        <div ref={ocrContainerRef} className="w-full max-w-md mb-6 animate-fadeUp ocr-skin z-[10]">
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={triggerHiddenFileInput}
              className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] text-[var(--fg)] font-medium"
            >
              Charger 1 fichier
            </button>
          </div>
          <OcrUploader onText={(t) => setOcrText(t)} onPreview={() => {}} />
        </div>
      )}

      {/* Historique */}
      <div className="w-full max-w-md space-y-3 pb-10 z-[1]">
        {loading && (
          <div className="msg-appear rounded-xl border border-[var(--border)] bg-[var(--assistant-bg)] p-3 relative">
            <p className="text-[var(--fg)]"><span className="typing-dots" aria-live="polite">•••</span></p>
            <p className="text-xs opacity-70 mt-4">IA • {new Date().toLocaleString()}</p>
          </div>
        )}

        {history.map((item, idx) => (
          <div
            key={idx}
            className={`msg-appear rounded-xl border p-3 relative
              ${
                item.role === "user"
                  ? "border-[var(--border)] bg-[var(--user-bg)]"
                  : item.role === "assistant"
                  ? "border-[var(--assistant-border)] bg-[var(--assistant-bg)]"
                  : "border-[var(--error-border)] bg-[var(--error-bg)]"
              }`}
          >
            <p className="whitespace-pre-wrap">{item.text}</p>

            {item.role === "assistant" && (
              <button
                onClick={async () => { await safeCopy(item.text); }}
                className="absolute right-3 bottom-3 text-xs px-3 py-1 rounded-lg bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] border border-[var(--border)]"
              >
                Copier
              </button>
            )}

            <p className="text-xs opacity-70 mt-6">
              {item.role === "user" ? "Vous" : item.role === "assistant" ? "IA" : "Erreur"} •{" "}
              {new Date(item.time).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Modals utilitaires */}
      <ConfirmDialog
        open={showClearModal}
        title="Effacer l’historique ?"
        description="Souhaitez-vous vraiment supprimer l’historique de la conversation ? Cette action est irréversible."
        confirmLabel="Effacer"
        cancelLabel="Annuler"
        onConfirm={clearHistory}
        onCancel={() => setShowClearModal(false)}
      />
      <LegalModal open={showLegal} onClose={() => setShowLegal(false)} />

      {/* 🔐 Modals connexion/abonnement ouverts via Menu */}
      <CodeAccessDialog open={showConnect} onClose={() => setShowConnect(false)} />
      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} />

      {/* Bouton Menu flottant */}
      <Menu />
    </div>
  );
}

/* =================== Styles globaux =================== */
function StyleGlobals() {
  return (
    <style jsx global>{`
      html, body, #__next {
        min-height: 100dvh; width: 100%; margin: 0; padding: 0;
        color: var(--fg);
        background: linear-gradient(180deg, #b3e5fc 0%, #e0f7fa 100%) fixed !important;
      }

      :root {
        --fg: #0b1b2b;
        --panel: rgba(12,16,28,0.86);
        --panel-strong: rgba(12,16,28,0.92);
        --panel-stronger: rgba(12,16,28,0.98);
        --user-bg: rgba(255,255,255,0.55);
        --assistant-bg: rgba(255,255,255,0.38);
        --assistant-border: rgba(11,27,43,0.18);
        --error-bg: rgba(220,38,38,0.10);
        --error-border: rgba(220,38,38,0.35);
        --chip-bg: rgba(255,255,255,0.60);
        --chip-hover: rgba(255,255,255,0.78);
        --border: rgba(11,27,43,0.12);
        --accent: #22d3ee;
        --accent-tint: rgba(34,211,238,0.18);
        --danger: #ef4444;
        --danger-strong: #dc2626;
      }

      .halo {
        position: fixed; left: 50%; top: 96px; transform: translateX(-50%) translateZ(0);
        width: 34rem; height: 34rem; z-index: 0; pointer-events: none;
        background: radial-gradient(closest-side, rgba(56,189,248,.28), rgba(56,189,248,0));
      }
      body > * { position: relative; z-index: 1; }

      @keyframes fadeUp { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform:none; } }
      .msg-appear { animation: fadeUp .28s ease-out both; }
      .animate-fadeUp { animation: fadeUp .28s ease-out both; }

      @keyframes dots { 0%{opacity:.2} 20%{opacity:1} 100%{opacity:.2} }
      .typing-dots { letter-spacing:.25em; display:inline-block; animation: dots 1.2s ease-in-out infinite; }

      @keyframes micPulse {
        0% { box-shadow:0 0 0 0 rgba(34,211,238,.25); transform:scale(1); }
        70% { box-shadow:0 0 0 10px rgba(34,211,238,0); transform:scale(1.02); }
        100% { box-shadow:0 0 0 0 rgba(34,211,238,0); transform:scale(1); }
      }
      .mic-pulse { animation: micPulse 1.6s ease-out infinite; }

      .ocr-skin, .ocr-skin * { color: var(--fg) !important; }
      .ocr-skin input[type="file"] {
        position:absolute !important; left:-10000px !important; width:1px !important; height:1px !important;
        opacity:0 !important; pointer-events:none !important; display:none !important;
      }
      .ocr-skin input[type="file"]::file-selector-button,
      .ocr-skin input[type="file"] + *,
      .ocr-skin input[type="file"] ~ span,
      .ocr-skin input[type="file"] ~ small { display:none !important; }
      .ocr-skin .truncate,
      .ocr-skin [class*="file-name"],
      .ocr-skin [class*="filename"],
      .ocr-skin [class*="fileName"],
      .ocr-skin [class*="name"] { display:none !important; }

      /* Safe area + micro-anim du bouton Menu */
      .safe-bottom { padding-bottom: calc(env(safe-area-inset-bottom) + 8px); }
      @keyframes float { 0%{transform:translateY(0)} 50%{transform:translateY(-2px)} 100%{transform:translateY(0)} }
      .menu-float:focus-visible { animation: float .9s ease-in-out; outline: none; }
    `}</style>
  );
}
