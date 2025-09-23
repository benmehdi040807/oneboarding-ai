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
            className="px-3 py-2 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-medium"
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

  // 🎙️ Micro (final only)
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  const baseInputRef = useRef<string>("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    const hasOcr = Boolean(ocrText.trim());
    if ((!q && !hasOcr) || loading) return;

    const now = new Date().toISOString();
    const userShown = q || (hasOcr ? "(Question vide — envoi du texte OCR uniquement)" : "");
    if (userShown) setHistory(h => [{ role: "user", text: userShown, time: now }, ...h]);

    setInput("");
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

  return (
    <div className="fixed inset-0 overflow-y-auto text-[var(--fg)] bg-[var(--bg)] space-bg flex flex-col items-center p-6 selection:bg-[var(--accent)/30] selection:text-[var(--fg)]">
      <StyleGlobals />

      {/* ===== Logo centré (agrandi + halo) ===== */}
      <div className="mb-6 flex justify-center">
        <Image
          src="/brand/oneboardingai-logo.png"
          alt="OneBoarding AI"
          width={288}
          height={288}
          priority
          className="h-44 w-44 md:h-56 md:w-56 drop-shadow-[0_0_40px_rgba(56,189,248,0.45)]"
        />
      </div>

      {/* ===== Barre : input + OK ===== */}
      <form onSubmit={handleSubmit} className="w-full max-w-md mb-2 z-[1]">
        <div className="flex items-stretch shadow-[0_6px_26px_rgba(0,0,0,0.35)] rounded-2xl overflow-hidden border border-[var(--border)]">
          <input
            type="text"
            placeholder="Votre question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 min-w-0 px-4 py-3 text-[var(--fg)] bg-[var(--panel)] outline-none"
          />
          <div className="w-px bg-[var(--border)]" aria-hidden />
          <button
            type="submit"
            disabled={loading}
            className="px-5 md:px-6 font-medium bg-[var(--panel-strong)] text-[var(--fg)] hover:bg-[var(--panel-stronger)] transition disabled:opacity-60"
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
      <div className="w-full max-w-md space-y-3 pb-28 z-[1]">
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

      <RgpdBanner />
    </div>
  );
}

/* =================== Styles globaux (thème + OCR + animations) =================== */
function StyleGlobals() {
  return (
    <style jsx global>{`
      /* Plein écran partout */
      html, body, #__next {
        background: var(--bg) !important;
        color: var(--fg);
        min-height: 100dvh;
        width: 100%;
        margin: 0; padding: 0;
      }

      /* ===== Thème "Espace" uniforme (premium) ===== */
      :root{
        --bg:#0a0d18;              /* bleu nuit uniforme */
        --fg:#ffffff;
        --panel:#0f1426;
        --panel-strong:#121a2c;
        --panel-stronger:#16203a;
        --user-bg:rgba(255,255,255,0.05);
        --assistant-bg:rgba(34,211,238,0.18);
        --assistant-border:rgba(34,211,238,0.35);
        --error-bg:rgba(220,38,38,0.12);
        --error-border:rgba(248,113,113,0.35);
        --chip-bg:rgba(255,255,255,0.08);
        --chip-hover:rgba(255,255,255,0.12);
        --border:rgba(255,255,255,0.12);
        --accent:#22d3ee;          /* cyan */
        --accent-tint:rgba(34,211,238,0.14);
      }

      /* Conteneur: fond uni + aura cosmique subtile
         -> pseudo-élément flouté pour éviter tout "découpage" */
      .space-bg{
        position: relative;
        background: var(--bg);
      }
      .space-bg::before{
        content:"";
        position: fixed;           /* couvre tout l'écran, même en scroll */
        inset: -25%;
        pointer-events: none;
        z-index: 0;
        background:
          radial-gradient(closest-side at 50% 18%,
            rgba(56,189,248,0.10) 0%,
            rgba(56,189,248,0.06) 28%,
            rgba(56,189,248,0.00) 60%);
        filter: blur(22px);
      }
      /* assure que le contenu passe au-dessus de l'aura */
      .space-bg > * { position: relative; z-index: 1; }

      /* Apparition des messages */
      @keyframes fadeUp { from {opacity:0; transform:translateY(6px);} to {opacity:1; transform:none;} }
      .msg-appear { animation: fadeUp .28s ease-out both; }
      .animate-fadeUp { animation: fadeUp .28s ease-out both; }

      /* Indicateur ( … ) */
      @keyframes dots { 0%{opacity:.2;} 20%{opacity:1;} 100%{opacity:.2;} }
      .typing-dots { letter-spacing:.25em; display:inline-block; animation:dots 1.2s ease-in-out infinite; }

      /* Pulsation micro */
      @keyframes micPulse {
        0%   { box-shadow:0 0 0 0 rgba(34,211,238,0.25); transform:scale(1); }
        70%  { box-shadow:0 0 0 10px rgba(34,211,238,0); transform:scale(1.02); }
        100% { box-shadow:0 0 0 0 rgba(34,211,238,0); transform:scale(1); }
      }
      .mic-pulse { animation: micPulse 1.6s ease-out infinite; }

      /* ====== Skin OCR ====== */
      .ocr-skin, .ocr-skin * { color: var(--fg) !important; }
      .ocr-skin input[type="file"]{
        position:absolute !important; inset:auto !important; left:-10000px !important;
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
