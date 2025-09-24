"use client";
export const runtime = "nodejs";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import OcrUploader from "@/components/OcrUploader";

/* =================== Modal Légal (Préambule + CGU + Confidentialité) =================== */
function LegalModal({
  open,
  onAccept,
  onClose,
}: {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [canAccept, setCanAccept] = useState(false);

  useEffect(() => {
    if (!open) return;
    const el = boxRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
      setCanAccept(atBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-white shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-semibold">Informations légales</h2>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15">
            Fermer
          </button>
        </div>

        {/* Contenu compact */}
        <div
          ref={boxRef}
          className="px-5 py-4 max-h-[70vh] overflow-y-auto text-[13.5px] leading-[1.35rem] space-y-5"
        >
          {/* Préambule */}
          <section>
            <h3 className="font-semibold mb-1.5">Préambule</h3>
            <p className="opacity-90">
              OneBoarding AI est une plateforme d’intelligence artificielle interactive éditée par{" "}
              <strong>Benmehdi Mohamed Rida</strong>. Elle permet d’obtenir des informations à valeur
              pédagogique et pratique — y compris via un module d’OCR. L’usage est actuellement gratuit ;
              des évolutions pourront être notifiées.
            </p>
          </section>

          {/* CGU (synthèse) */}
          <section>
            <h3 className="font-semibold mb-1.5">Conditions Générales d’Utilisation</h3>
            <ul className="list-disc pl-5 space-y-1.5 opacity-90">
              <li>
                L’utilisateur reste seul responsable de ses décisions et actes ; les contenus générés par
                l’IA sont fournis “en l’état”, sans garantie d’exactitude/exhaustivité.
              </li>
              <li>
                L’éditeur peut modifier, suspendre ou interrompre le service à tout moment ; aucune
                responsabilité ne saurait être engagée pour indisponibilités ou pertes indirectes.
              </li>
              <li>
                Sont interdits les usages illicites/abusifs ; en cas d’abus, l’accès peut être restreint.
              </li>
              <li>
                Compétence : juridiction du lieu de résidence de l’éditeur, sous réserve des règles d’ordre
                public applicables à l’utilisateur.
              </li>
            </ul>
          </section>

          {/* Confidentialité (synthèse) */}
          <section>
            <h3 className="font-semibold mb-1.5">Confidentialité</h3>
            <ul className="list-disc pl-5 space-y-1.5 opacity-90">
              <li>Stockage local sur votre appareil (historique, consentements).</li>
              <li>
                Les requêtes IA transitent par des prestataires techniques, aux seules fins de
                fonctionnement ; aucune vente de données.
              </li>
              <li>Vous pouvez effacer vos données locales depuis l’interface (bouton dédié).</li>
            </ul>
          </section>

          <p className="text-xs opacity-70">
            En acceptant, vous reconnaissez avoir lu ces informations. Les règles d’ordre public du pays de
            l’utilisateur restent applicables en toute hypothèse.
          </p>
        </div>

        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15"
          >
            Plus tard
          </button>
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className={`px-4 py-2 rounded-xl text-white transition ${
              canAccept ? "bg-[var(--accent)] hover:brightness-110" : "bg-white/10 cursor-not-allowed"
            }`}
            title={canAccept ? "Accepter et continuer" : "Faites défiler jusqu’en bas pour activer"}
          >
            J’accepte
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== Bandeau RGPD (version “Lire & accepter” en modal) =================== */
function RgpdBanner() {
  const CONSENT_KEY = "oneboarding.legalAccepted";
  const [show, setShow] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {}
    setOpenModal(false);
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto max-w-xl px-4">
          <div className="m-3 rounded-2xl border bg-[var(--chip-bg)] border-[var(--border)] backdrop-blur p-3 text-sm text-[var(--fg)]">
            <p className="mb-2">Vos données restent privées sur cet appareil.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setOpenModal(true)}
                className="px-3 py-2 rounded-xl bg-[var(--panel)] text-white font-medium"
              >
                Lire & accepter
              </button>
              <button
                onClick={() => setShow(false)}
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)]"
                title="Masquer et décider plus tard"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>

      <LegalModal open={openModal} onAccept={accept} onClose={() => setOpenModal(false)} />
    </>
  );
}

/* =================== Modal de confirmation (Effacer historique) =================== */
function ConfirmDialog({
  open,
  title = "Confirmer",
  description = "",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      const btn = dialogRef.current?.querySelector<HTMLButtonElement>(
        "button[data-autofocus='true']"
      );
      btn?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white"
      >
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {description ? <p className="text-sm opacity-90 mb-4">{description}</p> : null}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            data-autofocus="true"
            className="px-4 py-2 rounded-xl bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]"
          >
            {confirmLabel}
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
  try {
    navigator.clipboard.writeText(text);
  } catch {}
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

  // Textarea auto-expansion + scroll
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 3,
      lineHeight = 24,
      maxHeight = max * lineHeight + 16;
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + "px";
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

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

    r.onstart = () => {
      baseInputRef.current = input;
      setListening(true);
    };
    r.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++)
        final += " " + e.results[i][0].transcript;
      setInput(cleanText([baseInputRef.current, final].join(" ")));
    };
    const stopUI = () => setListening(false);
    r.onend = stopUI;
    r.onspeechend = stopUI;
    r.onaudioend = stopUI;
    r.onnomatch = stopUI;
    r.onerror = stopUI;

    recogRef.current = r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMic() {
    const r = recogRef.current;
    if (!r) return;
    if (!listening) {
      try {
        r.start();
      } catch {}
      return;
    }
    try {
      r.stop();
    } catch {}
    setTimeout(() => {
      if (listening) {
        try {
          r.abort?.();
        } catch {}
        setListening(false);
      }
    }, 600);
  }

  // historique persist
  useEffect(() => {
    try {
      const s = localStorage.getItem("oneboarding.history");
      if (s) setHistory(JSON.parse(s));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("oneboarding.history", JSON.stringify(history));
    } catch {}
  }, [history]);

  // Auto-scroll vers le haut à la fin de génération
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading)
      window.scrollTo({ top: 0, behavior: "smooth" });
    prevLoadingRef.current = loading;
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    const hasOcr = Boolean(ocrText.trim());
    if (!q && !hasOcr) return;
    if (loading) return;

    const now = new Date().toISOString();
    const userShown =
      q || (hasOcr ? "(Question vide — envoi du texte OCR uniquement)" : "");
    if (userShown)
      setHistory((h) => [{ role: "user", text: userShown, time: now }, ...h]);

    setInput("");
    setLoading(true);

    const composedPrompt = hasOcr
      ? `Voici le texte extrait d’un document (OCR) :\n\n"""${ocrText}"""\n\nConsigne de l’utilisateur : ${
          q || "(aucune)"
        }\n\nConsigne pour l’IA : Résume/explique et réponds clairement, en conservant la langue du texte OCR si possible.`
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
        if (raw.includes("GROQ_API_KEY"))
          msg = "Service temporairement indisponible. (Configuration serveur requise)";
        setHistory((h) => [
          { role: "error", text: msg, time: new Date().toISOString() },
          ...h,
        ]);
      } else {
        setHistory((h) => [
          {
            role: "assistant",
            text: String(data.text || "Réponse vide."),
            time: new Date().toISOString(),
          },
          ...h,
        ]);
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
    } finally {
      setLoading(false);
    }
  }

  // Déclenche file input d’OcrUploader
  function triggerHiddenFileInput() {
    const container = ocrContainerRef.current;
    if (!container) return;
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement | null;
    input?.click();
  }

  // Effacement de l’historique (après confirmation)
  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem("oneboarding.history");
    } catch {}
    setShowClearModal(false);
  }

  return (
    <div className="fixed inset-0 overflow-y-auto text-[var(--fg)] flex flex-col items-center p-6 selection:bg-[var(--accent)/30] selection:text-[var(--fg)]">
      <StyleGlobals />
      <div className="halo" aria-hidden />

      {/* ===== Logo (pictogramme) — redescendu légèrement ===== */}
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

      {/* ===== Barre : textarea auto + OK ===== */}
      <form onSubmit={handleSubmit} className="w-full max-w-md mb-2 z-[1]">
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

        {/* rangée d’actions sous la barre */}
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => setShowOcr((v) => !v)}
            className="h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] grid place-items-center transition"
            title="Joindre un document (OCR)"
            aria-label="Joindre un document"
          >
            <svg
              className="h-6 w-6 text-[var(--fg)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l8.49-8.49a4 4 0 015.66 5.66L10 16.83a2 2 0 11-2.83-2.83l7.78-7.78" />
            </svg>
          </button>

          <button
            type="button"
            disabled={!speechSupported}
            onClick={toggleMic}
            className={`h-12 w-12 rounded-xl border grid place-items-center transition
              ${
                listening
                  ? "border-[var(--accent)] bg-[color:var(--accent-tint)] mic-pulse"
                  : "border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]"
              }
              disabled:opacity-50`}
            aria-label={
              speechSupported ? (listening ? "Arrêter le micro" : "Parler") : "Micro non supporté"
            }
            title={speechSupported ? "Saisie vocale" : "Micro non supporté"}
          >
            <svg
              className="h-6 w-6 text-[var(--fg)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
      <div className="w-full max-w-md space-y-3 pb-40 z-[1]">
        {loading && (
          <div className="msg-appear rounded-xl border border-[var(--border)] bg-[var(--assistant-bg)] p-3 relative">
            <p className="text-[var(--fg)]">
              <span className="typing-dots" aria-live="polite">
                •••
              </span>
            </p>
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

      {/* Bouton danger effacer historique */}
      {history.length > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-[55] flex justify-center pointer-events-none">
          <button
            onClick={() => setShowClearModal(true)}
            className="pointer-events-auto px-5 py-3 rounded-2xl bg-[var(--danger)] hover:bg-[var(--danger-strong)] text-white font-semibold shadow-lg"
          >
            Effacer l’historique
          </button>
        </div>
      )}

      {/* Modal Effacer */}
      <ConfirmDialog
        open={showClearModal}
        title="Effacer l’historique ?"
        description="Souhaitez-vous vraiment supprimer l’historique de la conversation ? Cette action est irréversible. Pensez à sauvegarder ce qui vous est utile avant d’effacer."
        confirmLabel="Effacer"
        cancelLabel="Annuler"
        onConfirm={clearHistory}
        onCancel={() => setShowClearModal(false)}
      />

      {/* Bandeau RGPD / Légal */}
      <RgpdBanner />
    </div>
  );
}

/* =================== Styles globaux =================== */
function StyleGlobals() {
  return (
    <style jsx global>{`
      html,
      body,
      #__next {
        min-height: 100dvh;
        width: 100%;
        margin: 0;
        padding: 0;
        color: var(--fg);
        background: linear-gradient(180deg, #b3e5fc 0%, #e0f7fa 100%) fixed !important;
      }

      :root {
        --fg: #0b1b2b;
        --panel: rgba(12, 16, 28, 0.86);
        --panel-strong: rgba(12, 16, 28, 0.92);
        --panel-stronger: rgba(12, 16, 28, 0.98);
        --user-bg: rgba(255, 255, 255, 0.55);
        --assistant-bg: rgba(255, 255, 255, 0.38);
        --assistant-border: rgba(11, 27, 43, 0.18);
        --error-bg: rgba(220, 38, 38, 0.1);
        --error-border: rgba(220, 38, 38, 0.35);
        --chip-bg: rgba(255, 255, 255, 0.6);
        --chip-hover: rgba(255, 255, 255, 0.78);
        --border: rgba(11, 27, 43, 0.12);
        --accent: #22d3ee;
        --accent-tint: rgba(34, 211, 238, 0.18);

        --danger: #ef4444;
        --danger-strong: #dc2626;
      }

      .halo {
        position: fixed;
        left: 50%;
        top: 96px;
        transform: translateX(-50%) translateZ(0);
        width: 34rem;
        height: 34rem;
        z-index: 0;
        pointer-events: none;
        background: radial-gradient(
          closest-side,
          rgba(56, 189, 248, 0.28),
          rgba(56, 189, 248, 0)
        );
      }
      body > * {
        position: relative;
        z-index: 1;
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .msg-appear {
        animation: fadeUp 0.28s ease-out both;
      }
      .animate-fadeUp {
        animation: fadeUp 0.28s ease-out both;
      }

      @keyframes dots {
        0% {
          opacity: 0.2;
        }
        20% {
          opacity: 1;
        }
        100% {
          opacity: 0.2;
        }
      }
      .typing-dots {
        letter-spacing: 0.25em;
        display: inline-block;
        animation: dots 1.2s ease-in-out infinite;
      }

      @keyframes micPulse {
        0% {
          box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.25);
          transform: scale(1);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(34, 211, 238, 0);
          transform: scale(1.02);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(34, 211, 238, 0);
          transform: scale(1);
        }
      }
      .mic-pulse {
        animation: micPulse 1.6s ease-out infinite;
      }

      .ocr-skin,
      .ocr-skin * {
        color: var(--fg) !important;
      }
      .ocr-skin input[type="file"] {
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        opacity: 0 !important;
        pointer-events: none !important;
        display: none !important;
      }
      .ocr-skin input[type="file"]::file-selector-button,
      .ocr-skin input[type="file"] + *,
      .ocr-skin input[type="file"] ~ span,
      .ocr-skin input[type="file"] ~ small {
        display: none !important;
      }
      .ocr-skin .truncate,
      .ocr-skin [class*="file-name"],
      .ocr-skin [class*="filename"],
      .ocr-skin [class*="fileName"],
      .ocr-skin [class*="name"] {
        display: none !important;
      }
    `}</style>
  );
}
