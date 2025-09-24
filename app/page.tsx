"use client";
export const runtime = "nodejs";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import OcrUploader from "@/components/OcrUploader";

/* =================== Bandeau RGPD =================== */
function RgpdBanner() {
  const CONSENT_KEY = "oneboarding.rgpdConsent";
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  const accept = () => {
    try { localStorage.setItem(CONSENT_KEY, "1"); } catch {}
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-xl px-4">
        <div className="m-3 rounded-2xl border bg-[var(--chip-bg)] border-[var(--border)] backdrop-blur p-3 text-sm text-[var(--fg)]">
          <p className="mb-2">
            Vos données restent privées sur cet appareil.{" "}
            <a href="/legal" className="underline">En savoir plus</a>
          </p>
          <button
            onClick={accept}
            className="px-3 py-2 rounded-xl bg-[var(--panel)] text-white font-medium"
          >
            D’accord
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== Types & utils =================== */
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

const cleanText = (s: string) =>
  s.replace(/\s+/g, " ").replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1").trim();

function copyToClipboard(text: string) {
  try { navigator.clipboard.writeText(text); } catch {}
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

  // Textarea autosize + scroll
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_ROWS = 3; // hauteur max (après, scroll interne)

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
      const next = cleanText([baseInputRef.current, final].join(" "));
      setInput(next);
      queueMicrotask(autoGrow);
    };
    const stopUI = () => setListening(false);
    r.onend = stopUI; r.onspeechend = stopUI; r.onaudioend = stopUI; r.onnomatch = stopUI; r.onerror = stopUI;

    recogRef.current = r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMic() {
    const r = recogRef.current;
    if (!r) return;
    if (!listening) { try { r.start(); } catch {} return; }
    try { r.stop(); } catch {}
    setTimeout(() => { if (listening) { try { r.abort?.(); } catch {} setListening(false); } }, 600);
  }

  // historique persist
  useEffect(() => { try { const s = localStorage.getItem("oneboarding.history"); if (s) setHistory(JSON.parse(s)); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("oneboarding.history", JSON.stringify(history)); } catch {} }, [history]);

  // Auto-scroll vers le haut à la fin de génération
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) window.scrollTo({ top: 0, behavior: "smooth" });
    prevLoadingRef.current = loading;
  }, [loading]);

  function autoGrow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const lineHeight = 24; // cohérent avec leading-6
    const maxHeight = MAX_ROWS * lineHeight + 12; // + padding approx.
    const nextHeight = Math.min(ta.scrollHeight, maxHeight);
    ta.style.height = nextHeight + "px";
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    const hasOcr = Boolean(ocrText.trim());
    if ((!q && !hasOcr) || loading) return;

    const now = new Date().toISOString();
    const userShown = q || (hasOcr ? "(Question vide — envoi du texte OCR uniquement)" : "");
    if (userShown) setHistory(h => [{ role: "user", text: userShown, time: now }, ...h]);

    setInput("");
    queueMicrotask(autoGrow);
    setLoading(true);

    const composedPrompt = hasOcr
      ? `Voici le texte extrait d’un document (OCR) :\n\n"""${ocrText}"""\n\nConsigne de l’utilisateur : ${q || "(aucune)"}\n\nConsigne pour l’IA : Résume/explique et réponds clairement, en conservant la langue du texte OCR si possible.`
      : q;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: composedPrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const raw = String(data?.error || `HTTP ${res.status}`);
        let msg = `Erreur: ${raw}`;
        if (raw.includes("GROQ_API_KEY")) {
          msg = "Service temporairement indisponible. (Configuration serveur requise)";
        }
        setHistory(h => [{ role: "error", text: msg, time: new Date().toISOString() }, ...h]);
      } else {
        setHistory(h => [{ role: "assistant", text: String(data.text || "Réponse vide."), time: new Date().toISOString() }, ...h]);
      }
    } catch (err: any) {
      setHistory(h => [{ role: "error", text: `Erreur: ${err?.message || "réseau"}`, time: new Date().toISOString() }, ...h]);
    } finally {
      setLoading(false);
    }
  }

  // Déclenche le file input caché à l’intérieur d’OcrUploader
  function triggerHiddenFileInput() {
    const container = ocrContainerRef.current;
    if (!container) return;
    const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    input?.click();
  }

  // Effacer historique (+ localStorage) avec confirmation
  function clearHistory() {
    const ok = window.confirm("Effacer tout l’historique de cette conversation ?");
    if (!ok) return;
    setHistory([]);
    try { localStorage.removeItem("oneboarding.history"); } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="fixed inset-0 overflow-y-auto text-[var(--fg)] flex flex-col items-center px-6 pt-0 pb-6 selection:bg-[var(--accent)/30] selection:text-[var(--fg)]">
      <StyleGlobals />
      <div className="halo" aria-hidden />

      {/* ===== Hero compact (logo encore plus haut + écart mini) ===== */}
      <div className="w-full max-w-md flex flex-col items-center mt-0">
        {/* Logo */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 -mt-3">
          <Image
            src="/brand/oneboardingai-logo.png"
            alt="OneBoarding AI — logo"
            fill
            priority
            className="object-contain drop-shadow-[0_0_42px_rgba(56,189,248,0.35)]"
          />
        </div>

        {/* Barre : textarea auto-grow + scroll + OK */}
        <form onSubmit={handleSubmit} className="w-full mt-0.5 mb-2 z-[1]">
          <div className="flex items-stretch shadow-[0_6px_26px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden border border-[var(--border)]">
            <textarea
              ref={taRef}
              rows={1}
              onInput={autoGrow}
              placeholder="Votre question…"
              value={input}
              onChange={(e) => { setInput(e.target.value); }}
              className="flex-1 min-w-0 px-4 py-3 text-white bg-[var(--panel)] outline-none resize-none overflow-hidden leading-6"
              aria-label="Votre question"
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

          {/* rangée d’actions sous la barre */}
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setShowOcr(v => !v)}
              className="h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] grid place-items-center transition"
              title="Joindre un document (OCR)"
              aria-label="Joindre un document"
            >
              <svg className="h-6 w-6 text-[var(--fg)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l8.49-8.49a4 4 0 015.66 5.66L10 16.83a2 2 0 11-2.83-2.83l7.78-7.78"/>
              </svg>
            </button>

            <button
              type="button"
              disabled={!speechSupported}
              onClick={toggleMic}
              className={`h-12 w-12 rounded-xl border grid place-items-center transition
                ${listening
                  ? "border-[var(--accent)] bg-[color:var(--accent-tint)] mic-pulse"
                  : "border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]"}
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
          </div>
        </form>
      </div>

      {/* Tiroir OCR */}
      {showOcr && (
        <div ref={ocrContainerRef} className="w-full max-w-md mb-6 animate-fadeUp ocr-skin z-[1]">
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
      <div className="w-full max-w-md space-y-3 pb-40 z-[1]">
        {loading && (
          <div className="msg-appear rounded-xl border border-[var(--border)] bg-[var(--assistant-bg)] p-3 relative">
            <p className="text-[var(--fg)]">
              <span className="typing-dots" aria-live="polite" aria-label="L’IA écrit">•••</span>
            </p>
            <p className="text-xs opacity-70 mt-4">IA • {new Date().toLocaleString()}</p>
          </div>
        )}

        {history.map((item, idx) => (
          <div
            key={idx}
            className={`msg-appear rounded-xl border p-3 relative
              ${item.role === "user"
                ? "border-[var(--border)] bg-[var(--user-bg)]"
                : item.role === "assistant"
                ? "border-[var(--assistant-border)] bg-[var(--assistant-bg)]"
                : "border-[var(--error-border)] bg-[var(--error-bg)]"
              }`}
          >
            <p className="whitespace-pre-wrap">{item.text}</p>

            {item.role === "assistant" && (
              <button
                onClick={() => copyToClipboard(item.text)}
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

      {/* ===== Bouton effacer l'historique (affiché seulement si contenu) ===== */}
      {history.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 pointer-events-none">
          <div className="mx-auto max-w-md px-6">
            <button
              onClick={clearHistory}
              className="pointer-events-auto w-full py-3 rounded-2xl font-semibold text-white
                         bg-gradient-to-r from-rose-500 to-red-500 shadow-lg
                         hover:brightness-110 active:scale-[.99] transition"
            >
              Effacer l’historique
            </button>
          </div>
        </div>
      )}

      <RgpdBanner />
    </div>
  );
}

/* =================== Styles globaux (dégradé + halo compact) =================== */
function StyleGlobals() {
  return (
    <style jsx global>{`
      html, body, #__next {
        min-height: 100dvh;
        width: 100%;
        margin: 0; padding: 0;
        color: var(--fg);
        background: linear-gradient(180deg, #B3E5FC 0%, #E0F7FA 100%) fixed !important;
      }

      :root{
        --fg:#0B1B2B;
        --panel:rgba(12,16,28,0.86);
        --panel-strong:rgba(12,16,28,0.92);
        --panel-stronger:rgba(12,16,28,0.98);
        --user-bg:rgba(255,255,255,0.55);
        --assistant-bg:rgba(255,255,255,0.38);
        --assistant-border:rgba(11,27,43,0.18);
        --error-bg:rgba(220,38,38,0.10);
        --error-border:rgba(220,38,38,0.35);
        --chip-bg:rgba(255,255,255,0.60);
        --chip-hover:rgba(255,255,255,0.78);
        --border:rgba(11,27,43,0.12);
        --accent:#22d3ee;
        --accent-tint:rgba(34,211,238,0.18);
      }

      .halo{
        position: fixed;
        left: 50%;
        top: 40px;              /* plus haut */
        transform: translateX(-50%) translateZ(0);
        width: 24rem; height: 24rem;  /* plus compact */
        z-index: 0;
        pointer-events: none;
        background: radial-gradient(closest-side, rgba(56,189,248,0.22), rgba(56,189,248,0));
      }
      body > * { position: relative; z-index: 1; }

      @keyframes fadeUp { from {opacity:0; transform:translateY(6px);} to {opacity:1; transform:none;} }
      .msg-appear { animation: fadeUp .28s ease-out both; }
      .animate-fadeUp { animation: fadeUp .28s ease-out both; }

      @keyframes dots { 0%{opacity:.2;} 20%{opacity:1;} 100%{opacity:.2;} }
      .typing-dots { letter-spacing:.25em; display:inline-block; animation:dots 1.2s ease-in-out infinite; }

      @keyframes micPulse {
        0%   { box-shadow:0 0 0 0 rgba(34,211,238,0.25); transform:scale(1); }
        70%  { box-shadow:0 0 0 10px rgba(34,211,238,0); transform:scale(1.02); }
        100% { box-shadow:0 0 0 0 rgba(34,211,238,0); transform:scale(1); }
      }
      .mic-pulse { animation: micPulse 1.6s ease-out infinite; }

      /* Skin OCR : masquage des UI natives */
      .ocr-skin, .ocr-skin * { color: var(--fg) !important; }
      .ocr-skin input[type="file"]{
        position:absolute !important; left:-10000px !important;
        width:1px !important; height:1px !important; opacity:0 !important; pointer-events:none !important; display:none !important;
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
    `}</style>
  );
      }
