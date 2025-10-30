// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import OcrUploader from "@/components/OcrUploader";
import Menu from "@/components/Menu";
import ChatPanel from "@/components/ChatPanel";

// 🧠 Réponses premium (texte/audio/ocr) — moteur universel
import { formatResponse } from "@/lib/txtPhrases";

// Boutons (➕ / 🔑) à droite
const RightAuthButtons = dynamic(() => import("@/components/RightAuthButtons"), { ssr: false });

/* =================== Const =================== */
const CONSENT_KEY = "oneboarding.legalConsent.v1";
const PLAN_KEY = "oneboarding.plan"; // null (non-membre) | "subscription" | "one-month"

// Bridges: clés utilisées pour l’auto-connect après retour PayPal
const PHONE_KEY = "oneboarding.phoneE164";
const PENDING_PLAN_KEY_A = "oneboarding.pendingPlanKind";   // ancien nom
const PENDING_PLAN_KEY_B = "oneboarding.planCandidate";     // autre alias
const DEVICE_ID_KEY = "oneboarding.deviceId";

/* =================== Modal confirmation générique =================== */
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
    if (!open) return;
    dialogRef.current
      ?.querySelector<HTMLButtonElement>("button[data-autofocus='true']")
      ?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white"
      >
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {description ? (
          <p className="text-sm opacity-90 mb-4">{description}</p>
        ) : null}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            data-autofocus={true}
            className="px-4 py-2 rounded-2xl bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== Mini-modal CGU / Privacy =================== */
function CguPrivacyModal({
  open,
  onRequestClose,
}: {
  open: boolean;
  onRequestClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [consented, setConsented] = useState(false);
  const didPushRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    try {
      setConsented(localStorage.getItem(CONSENT_KEY) === "1");
    } catch {}

    const onPop = () => {
      cleanupListeners();
      didPushRef.current = false;
      onRequestClose();
    };

    if (!didPushRef.current) {
      history.pushState(
        { obModal: "legal" },
        "",
        typeof window !== "undefined" ? window.location.href : undefined
      );
      didPushRef.current = true;
    }
    window.addEventListener("popstate", onPop);

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseViaUI();
    };
    window.addEventListener("keydown", onEsc);

    function cleanupListeners() {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onEsc);
    }
    function handleCloseViaUI() {
      cleanupListeners();
      if (didPushRef.current) {
        didPushRef.current = false;
        history.back();
      } else {
        onRequestClose();
      }
    }
    (ref as any).currentClose = handleCloseViaUI;

    return () => cleanupListeners();
  }, [open, onRequestClose]);

  if (!open) return null;

  const accept = () => {
    if (!consented) {
      try {
        localStorage.setItem(CONSENT_KEY, "1");
      } catch {}
      setConsented(true);
      window.dispatchEvent(new Event("ob:consent-updated"));
    }
    (ref as any).currentClose?.();
  };

  const close = () => (ref as any).currentClose?.();

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={close}
      />
      <div
        ref={ref}
        className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">CGU / Privacy</h2>
          <button
            onClick={close}
            className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <p className="text-sm opacity-90 mt-3">
          OneBoarding AI respecte votre confidentialité. Vos données restent
          locales sur votre appareil.
        </p>

        <div className="mt-4 flex gap-2">
          <a
            href="/legal"
            className="flex-1 text-center px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
          >
            Lire le détail
          </a>
          <button
            onClick={accept}
            className="flex-1 px-4 py-2 rounded-2xl bg-white text-black font-semibold hover:bg-gray-100"
          >
            Lu et approuvé
          </button>
        </div>

        <p className="mt-2 text-xs opacity-80">
          {consented
            ? "Consentement enregistré."
            : "En cliquant sur « Lu et approuvé », vous confirmez avoir pris connaissance de ces informations."}
        </p>

        {!consented && (
          <button
            onClick={close}
            className="mt-2 w-full text-center text-sm opacity-80 hover:opacity-100 underline underline-offset-4"
          >
            Plus tard
          </button>
        )}
      </div>
    </div>
  );
}

/* =================== PaymentReturnBridge (abonnements) =================== */
function PaymentReturnBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let url: URL | null = null;
    try {
      url = new URL(window.location.href);
    } catch {
      return;
    }

    const paid = url.searchParams.get("paid");
    const cancel = url.searchParams.get("cancel");
    const paidError = url.searchParams.get("paid_error");

    if (!paid && !cancel && !paidError) return;

    const clean = () => {
      if (!url) return;
      url.searchParams.delete("paid");
      url.searchParams.delete("cancel");
      url.searchParams.delete("paid_error");
      window.history.replaceState({}, "", url.toString());
    };

    if (paid === "1") {
      // Devine le plan choisi (tolère 2 noms de clé)
      let plan: "subscription" | "one-month" = "subscription";
      try {
        const storedA = localStorage.getItem(PENDING_PLAN_KEY_A);
        const storedB = localStorage.getItem(PENDING_PLAN_KEY_B);
        const stored =
          (storedA || storedB) as "subscription" | "one-month" | null;

        if (stored === "subscription" || stored === "one-month") plan = stored;

        // Persiste le plan, nettoie les clés tampon
        localStorage.setItem(PLAN_KEY, plan);
        localStorage.removeItem(PENDING_PLAN_KEY_A);
        localStorage.removeItem(PENDING_PLAN_KEY_B);
      } catch {}

      // Phone (si PaymentModal l’a posé avant redirection)
      let phoneE164 = "";
      try {
        phoneE164 = localStorage.getItem(PHONE_KEY) || "";
      } catch {}

      // Émettre l’event standard (auto-connect UI)
      window.dispatchEvent(
        new CustomEvent("ob:subscription-active", {
          detail: {
            status: "active",
            plan,
            deviceId: undefined,
            customerId: undefined,
            paymentRef: undefined,
            phoneE164,
            source: "PaymentReturnBridge",
          },
        })
      );

      clean();
      return;
    }

    if (cancel === "1") {
      clean();
      return;
    }

    if (paidError) {
      clean();
      return;
    }
  }, []);

  return null;
}

/* =================== AuthorizeReturnBridge (1 € : URL + cookie) =================== */
function AuthorizeReturnBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let url: URL | null = null;
    try {
      url = new URL(window.location.href);
    } catch {
      /* Safari weird href */
    }

    const ok = url?.searchParams.get("device_authorized");
    const phoneQS = url?.searchParams.get("phone") || "";
    const deviceQS = url?.searchParams.get("device") || "";
    const payref = url?.searchParams.get("payref") || "";
    const err = url?.searchParams.get("device_error");

    const emitAndClean = (phoneE164: string, deviceId?: string) => {
      // normaliser deviceId: si non fourni en QS, tente LS
      if (!deviceId) {
        try {
          deviceId = localStorage.getItem(DEVICE_ID_KEY) || undefined;
        } catch {}
      }
      // mémoriser le phone localement
      try {
        if (phoneE164) localStorage.setItem(PHONE_KEY, phoneE164);
      } catch {}
      window.dispatchEvent(
        new CustomEvent("ob:device-authorized", {
          detail: {
            status: "active",
            phoneE164,
            deviceId,
            planActive: true,
            paymentRef: payref || undefined,
            source: "AuthorizeReturnBridge",
          },
        })
      );
      // nettoie QS
      if (url) {
        ["device_authorized", "phone", "device", "payref", "device_error"].forEach(
          (k) => url!.searchParams.delete(k)
        );
        window.history.replaceState({}, "", url.toString());
      }
    };

    // 1) Chemin “params d’URL”
    if (ok === "1") {
      const phone =
        phoneQS ||
        (() => {
          try {
            return localStorage.getItem(PHONE_KEY) || "";
          } catch {
            return "";
          }
        })();
      emitAndClean(phone, deviceQS || undefined);
      return;
    }
    if (err) {
      // Erreur → juste nettoyer l’URL
      if (url) {
        ["device_authorized", "phone", "device", "payref", "device_error"].forEach(
          (k) => url!.searchParams.delete(k)
        );
        window.history.replaceState({}, "", url.toString());
      }
      return;
    }

    // 2) Fallback “cookie”
    try {
      const ck = document.cookie
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("ob.deviceAuth="));
      if (!ck) return;

      // Effacer immédiatement pour éviter re-trigger
      document.cookie =
        "ob.deviceAuth=; Path=/; Max-Age=0; SameSite=Lax";
      try {
        document.cookie =
          "ob.deviceAuth=; Path=/; Max-Age=0; SameSite=Lax; Secure";
      } catch {}

      const val = ck.split("=")[1];
      if (val === "ok") {
        const phone = (() => {
          try {
            return localStorage.getItem(PHONE_KEY) || "";
          } catch {
            return "";
          }
        })();
        const deviceId = (() => {
          try {
            return localStorage.getItem(DEVICE_ID_KEY) || undefined;
          } catch {
            return undefined;
          }
        })();
        emitAndClean(phone, deviceId);
      }
    } catch {
      /* noop */
    }
  }, []);
  return null;
}

/* =================== Types & utils =================== */
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

const cleanText = (s: string) =>
  s
    .replace(/\s+/g, " ")
    .replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1")
    .trim();

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

// Heuristique simple pour estimer la confiance d’une réponse texte
function assessConfidence(text: string): "high" | "medium" | "low" {
  const len = text.length;
  const lines = (text.match(/\n/g) || []).length;
  const bullets = (text.match(/(^|\n)\s*(?:[-•]|\d+\.)/g) || []).length;
  if (len > 1200 || bullets >= 3 || lines >= 8) return "high";
  if (len > 300 || bullets >= 1 || lines >= 3) return "medium";
  return "low";
}

// Raccourci langue
function readLangLS(): "fr" | "en" | "ar" {
  try {
    return (
      (localStorage.getItem("oneboarding.lang") as "fr" | "en" | "ar") ||
      "fr"
    );
  } catch {
    return "fr";
  }
}

/* =================== Page =================== */
export default function Page() {
  // i18n réactive : état + écoute des changements (Menu → ob:lang-changed)
  const [lang, setLang] = useState<"fr" | "en" | "ar">(() => readLangLS());
  const recogRef = useRef<any>(null); // déplacé plus haut pour qu'on puisse le toucher dans onLangChanged

  useEffect(() => {
    const onLangChanged = () => {
      const next = readLangLS();
      setLang(next);
      // si reco vocale déjà initialisée, on met à jour sa langue live
      if (recogRef.current) {
        recogRef.current.lang =
          next === "ar" ? "ar-MA" : next === "en" ? "en-US" : "fr-FR";
      }
    };
    window.addEventListener("ob:lang-changed", onLangChanged as EventListener);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "oneboarding.lang") {
        const next = readLangLS();
        setLang(next);
        if (recogRef.current) {
          recogRef.current.lang =
            next === "ar" ? "ar-MA" : next === "en" ? "en-US" : "fr-FR";
        }
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(
        "ob:lang-changed",
        onLangChanged as EventListener
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", lang);
    root.classList.toggle("lang-ar", lang === "ar");
  }, [lang]);

  // OCR
  const [showOcr, setShowOcr] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const ocrContainerRef = useRef<HTMLDivElement | null>(null);

  // Historique & chargement
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // 🧹 Modal Effacer (côté page — c'est ELLE qui supprime vraiment)
  const [showClearModal, setShowClearModal] = useState(false);

  // ⚖️ CGU/Privacy (ouvert si Menu émet ob:open-legal ET pas de consentement)
  const [showLegal, setShowLegal] = useState(false);
  useEffect(() => {
    const onOpen = () => {
      const c = localStorage.getItem(CONSENT_KEY) === "1";
      if (!c) setShowLegal(true);
    };
    window.addEventListener("ob:open-legal", onOpen as EventListener);
    return () =>
      window.removeEventListener("ob:open-legal", onOpen as EventListener);
  }, []);

  // historique persist (chargement initial + sync LS)
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

  // ✨ NEW: écoute la demande de suppression venant du Menu
  useEffect(() => {
    const onRequestClear = () => {
      // on n'efface pas direct, on ouvre notre propre modal
      setShowClearModal(true);
    };
    window.addEventListener(
      "ob:request-clear-history",
      onRequestClear as EventListener
    );
    return () => {
      window.removeEventListener(
        "ob:request-clear-history",
        onRequestClear as EventListener
      );
    };
  }, []);

  // Auto-scroll top après génération
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading)
      window.scrollTo({ top: 0, behavior: "smooth" });
    prevLoadingRef.current = loading;
  }, [loading]);

  // === 🎙️ Micro (toujours visible) ===
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const SR: any =
      (typeof window !== "undefined" &&
        (window as any).SpeechRecognition) ||
      (typeof window !== "undefined" &&
        (window as any).webkitSpeechRecognition);
    if (!SR) {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);

    const r = new SR();
    r.lang =
      lang === "ar" ? "ar-MA" : lang === "en" ? "en-US" : "fr-FR";
    r.continuous = true;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onstart = () => setListening(true);

    // ⤵️ IMPORTANT : Insérer le texte dicté dans le <textarea data-ob-chat-input> du ChatPanel.
    r.onresult = (e: any) => {
      let finalTxt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        finalTxt += " " + e.results[i][0].transcript;
      }
      const text = cleanText(finalTxt);
      if (!text) return;

      const ta = document.querySelector<HTMLTextAreaElement>(
        "[data-ob-chat-input]"
      );
      if (ta) {
        const needsSpace = ta.value && !/\s$/.test(ta.value);
        ta.value = ta.value + (needsSpace ? " " : "") + text;
        // Notifier React (inputs contrôlés) + focus + curseur fin
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        ta.focus();
        const end = ta.value.length;
        try {
          ta.setSelectionRange(end, end);
        } catch {}
      } else {
        console.warn(
          "Input ChatPanel introuvable (data-ob-chat-input). Aucun envoi auto effectué."
        );
      }
    };

    const stopUI = () => setListening(false);
    r.onend = r.onspeechend = r.onaudioend = r.onnomatch = r.onerror = stopUI;

    recogRef.current = r;
  }, [lang]);

  function toggleMic() {
    const r = recogRef.current;
    if (!r) {
      console.warn("Micro non supporté par ce navigateur.");
      return;
    }
    try {
      if (!listening) {
        r.start();
      } else {
        r.stop();
      }
    } catch (e) {
      console.warn("Échec démarrage/arrêt micro:", e);
      setListening(false);
    }
  }

  // === Pipeline “event bridge” : reçoit le texte (ChatPanel → génération) ===
  useEffect(() => {
    const onSubmit = async (
      evt: Event
    ) => {
      const e = evt as CustomEvent<{
        text?: string;
        lang?: "fr" | "en" | "ar";
      }>;
      const text = (e.detail?.text || "").trim();
      const L = (e.detail?.lang as "fr" | "en" | "ar") || lang;
      if (!text || loading) return;

      // Push user
      const now = new Date().toISOString();
      const hasOcr = Boolean(ocrText.trim());
      const shown =
        text ||
        (hasOcr
          ? "(Question vide — envoi du texte OCR uniquement)"
          : "");
      if (shown)
        setHistory((h) => [
          { role: "user", text: shown, time: now },
          ...h,
        ]);

      setLoading(true);

      const composedPrompt = hasOcr
        ? `Voici le texte extrait d’un document (OCR) :\n\n"""${ocrText}"""\n\nConsigne de l’utilisateur : ${text || "(aucune)"}\n\nConsigne pour l’IA : Résume/explique et réponds clairement, en conservant la langue du texte OCR si possible.`
        : text;

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
            msg =
              "Service temporairement indisponible. (Configuration serveur requise)";
          setHistory((h) => [
            {
              role: "error",
              text: msg,
              time: new Date().toISOString(),
            },
            ...h,
          ]);
        } else {
          const modelTextRaw: string = String(data.text || "");
          const conf = assessConfidence(modelTextRaw);

          let finalText = formatResponse({
            lang: L,
            confidence: conf,
            summary: modelTextRaw,
            includeCta: false,
            seed: Date.now() % 100000,
            joiner: "\n\n",
          })
            .replace(/\n{3,}/g, "\n\n")
            .trim();

          setHistory((h) => [
            {
              role: "assistant",
              text: finalText,
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
    };

    window.addEventListener(
      "ob:chat-submit",
      onSubmit as EventListener
    );
    return () =>
      window.removeEventListener(
        "ob:chat-submit",
        onSubmit as EventListener
      );
  }, [lang, ocrText, loading]);

  // Déclenche file input d’OcrUploader
  function triggerHiddenFileInput() {
    const container = ocrContainerRef.current;
    if (!container) return;
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement | null;
    input?.click();
  }

  // Effacer définitivement (utilitaire central)
  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem("oneboarding.history");
    } catch {}
    setShowClearModal(false);
    window.dispatchEvent(new Event("ob:history-cleared"));
  }

  return (
    <div className="fixed inset-0 overflow-y-auto text-[var(--fg)] flex flex-col items-center p-6 pb-[120px] selection:bg-[var(--accent)/30] selection:text-[var(--fg)]">
      {/* Bridges auto-connect */}
      <PaymentReturnBridge />
      <AuthorizeReturnBridge />

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

      {/* Barre d’actions au-dessus du chat : OCR à gauche, Auth à droite */}
      <div className="w-full max-w-3xl mb-3 flex items-center gap-3">
        {/* OCR (icône seule) */}
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

        {/* Micro (toujours visible) */}
        <button
          type="button"
          onClick={toggleMic}
          disabled={!speechSupported}
          className={`h-12 w-12 rounded-xl border grid place-items-center transition
            ${
              listening
                ? "border-[var(--accent)] bg-[var(--accent-tint)] mic-pulse"
                : "border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]"
            }
            ${!speechSupported ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={
            speechSupported
              ? listening
                ? "Arrêter le micro"
                : "Parler"
              : "Micro non supporté"
          }
          title={
            speechSupported
              ? listening
                ? "Arrêter l’enregistrement"
                : "Saisie vocale"
              : "Micro non supporté"
          }
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

        <div className="ml-auto">
          <RightAuthButtons />
        </div>
      </div>

      {/* Tiroir OCR */}
      {showOcr && (
        <div
          ref={ocrContainerRef}
          className="w-full max-w-3xl mb-6 animate-fadeUp ocr-skin z-[10]"
        >
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={triggerHiddenFileInput}
              className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] text-[var(--fg)]"
            >
              Charger 1 fichier
            </button>
          </div>
          <OcrUploader onText={(t) => setOcrText(t)} onPreview={() => {}} />
        </div>
      )}

      {/* ChatPanel (gère input + quota + Welcome dialog) */}
      <div className="w-full max-w-3xl">
        <ChatPanel />
      </div>

      {/* Historique */}
      <div className="w-full max-w-3xl space-y-3 pb-10 z-[1] mt-3">
        {loading && (
          <div className="msg-appear rounded-xl border border-[var(--border)] bg-[var(--assistant-bg)] p-3 relative">
            <p className="text-[var(--fg)]">
              <span className="typing-dots" aria-live="polite">
                •••
              </span>
            </p>
            <p className="text-xs opacity-70 mt-4">
              IA • {new Date().toLocaleString()}
            </p>
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
            <p className="whitespace-pre-wrap" dir="auto">
              {item.text}
            </p>

            {item.role === "assistant" && (
              <button
                onClick={async () => {
                  await safeCopy(item.text);
                }}
                className="absolute right-3 bottom-3 text-xs px-3 py-1 rounded-lg bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] border border-[var(--border)]"
              >
                {lang === "ar"
                  ? "نسخ"
                  : lang === "en"
                  ? "Copy"
                  : "Copier"}
              </button>
            )}

            <p className="text-xs opacity-70 mt-6">
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

      {/* Modals utilitaires */}
      <ConfirmDialog
        open={showClearModal}
        title="Effacer l’histoire ?"
        description="Souhaitez-vous vraiment supprimer l’historique de la conversation ? Cette action est irréversible."
        confirmLabel="Effacer"
        cancelLabel="Annuler"
        onConfirm={clearHistory}
        onCancel={() => setShowClearModal(false)}
      />
      <CguPrivacyModal
        open={showLegal}
        onRequestClose={() => setShowLegal(false)}
      />

      {/* Bouton Menu flottant + modales natives gérées à l’intérieur */}
      <Menu />
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
        background: linear-gradient(
            180deg,
            #b3e5fc 0%,
            #e0f7fa 100%
          )
          fixed !important;
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

      /* Ajustements légers quand la langue active est l'arabe.
         Pas d'inversion de layout : uniquement confort de lecture. */
      .lang-ar textarea::placeholder {
        text-align: right;
      }
      .lang-ar .msg-appear p[dir="auto"] {
        text-align: right;
      }

      /* Safe area + micro-anim du bouton Menu */
      .safe-bottom {
        padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
      }
      @keyframes float {
        0% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-2px);
        }
        100% {
          transform: translateY(0);
        }
      }
      .menu-float:focus-visible {
        animation: float 0.9s ease-in-out;
        outline: none;
      }
    `}</style>
  );
        }
