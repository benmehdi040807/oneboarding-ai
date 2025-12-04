"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import Menu from "@/components/Menu";
import ChatPanel from "@/components/ChatPanel";

// 🧠 Réponses premium (texte) — moteur universel
import { formatResponse as formatTextResponse } from "@/lib/txtPhrases";

// 🧾 Réponses premium pour lecture d’images / documents (OCR local)
import {
  formatResponse as formatOcrResponse,
  type Lang as OcrLang,
  type Confidence as OcrConfidence,
} from "@/lib/ocrPhrases";

// 🔐 Accès / quota / membres
import { useAccessControl } from "@/lib/useAccessControl";
import WelcomeLimitDialog from "@/components/WelcomeLimitDialog";
import MemberLimitDialog from "@/components/MemberLimitDialog";

/* =================== Const =================== */
const CONSENT_KEY = "oneboarding.legalConsent.v1";
const PLAN_KEY = "oneboarding.plan"; // null (non-membre) | "subscription" | "one-month"

// Bridges: clés utilisées pour l’auto-connect après retour PayPal
const PHONE_KEY = "oneboarding.phoneE164";
const PENDING_PLAN_KEY_A = "oneboarding.pendingPlanKind"; // ancien nom
const PENDING_PLAN_KEY_B = "oneboarding.planCandidate"; // autre alias
const DEVICE_ID_KEY = "oneboarding.deviceId";

/**
 * 🌍 Pack OCR mondial (≈ 20 langues) – codes Tesseract officiels.
 * ⚠️ Il faut que les .traineddata correspondants soient disponibles côté Tesseract.js
 * (CDN/langPath), mais ton code n’a pas besoin de changer : tout est ici.
 */
const OCR_LANGS =
  "eng+fra+ara+spa+por+ita+deu+tur+rus+hin+urd+ben+ind+vie+tha+chi_sim+chi_tra+jpn+kor+nld";

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
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="mb-4 text-sm opacity-90">{description}</p>
        ) : null}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            data-autofocus={true}
            className="rounded-2xl bg-[var(--danger)] px-4 py-2 text-white hover:bg-[var(--danger-strong)]"
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
        className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-white shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">CGU / Privacy</h2>
          <button
            onClick={close}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 hover:bg-white/15"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-sm opacity-90">
          OneBoarding AI respecte votre confidentialité. Vos données restent
          locales sur votre appareil.
        </p>

        <div className="mt-4 flex gap-2">
          <a
            href="/legal"
            className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-center hover:bg-white/15"
          >
            Lire le détail
          </a>
          <button
            onClick={accept}
            className="flex-1 rounded-2xl bg-white px-4 py-2 font-semibold text-black hover:bg-gray-100"
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
            className="mt-2 w-full text-center text-sm underline underline-offset-4 opacity-80 hover:opacity-100"
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
      let plan: "subscription" | "one-month" = "subscription";
      try {
        const storedA = localStorage.getItem(PENDING_PLAN_KEY_A);
        const storedB = localStorage.getItem(PENDING_PLAN_KEY_B);
        const stored =
          (storedA || storedB) as "subscription" | "one-month" | null;

        if (stored === "subscription" || stored === "one-month") plan = stored;

        localStorage.setItem(PLAN_KEY, plan);
        localStorage.removeItem(PENDING_PLAN_KEY_A);
        localStorage.removeItem(PENDING_PLAN_KEY_B);
      } catch {}

      let phoneE164 = "";
      try {
        phoneE164 = localStorage.getItem(PHONE_KEY) || "";
      } catch {}

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

    if (cancel === "1" || paidError) {
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
    } catch {}

    const ok = url?.searchParams.get("device_authorized");
    const phoneQS = url?.searchParams.get("phone") || "";
    const deviceQS = url?.searchParams.get("device") || "";
    const payref = url?.searchParams.get("payref") || "";
    const err = url?.searchParams.get("device_error");

    const emitAndClean = (phoneE164: string, deviceId?: string) => {
      if (!deviceId) {
        try {
          deviceId = localStorage.getItem(DEVICE_ID_KEY) || undefined;
        } catch {}
      }
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
      if (url) {
        ["device_authorized", "phone", "device", "payref", "device_error"].forEach(
          (k) => url!.searchParams.delete(k)
        );
        window.history.replaceState({}, "", url.toString());
      }
    };

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
      if (url) {
        ["device_authorized", "phone", "device", "payref", "device_error"].forEach(
          (k) => url!.searchParams.delete(k)
        );
        window.history.replaceState({}, "", url.toString());
      }
      return;
    }

    try {
      const ck = document.cookie
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("ob.deviceAuth="));
      if (!ck) return;

      document.cookie = "ob.deviceAuth=; Path=/; Max-Age=0; SameSite=Lax";
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
    } catch {}
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

function assessConfidence(text: string): "high" | "medium" | "low" {
  const len = text.length;
  const lines = (text.match(/\n/g) || []).length;
  const bullets = (text.match(/(^|\n)\s*(?:[-•]|\d+\.)/g) || []).length;
  if (len > 1200 || bullets >= 3 || lines >= 8) return "high";
  if (len > 300 || bullets >= 1 || lines >= 3) return "medium";
  return "low";
}

// 🧾 Tips spécifiques pour les réponses OCR (selon la langue)
function ocrTipsFor(lang: "fr" | "en" | "ar"): string {
  if (lang === "ar") {
    return "إن أمكن، التقط صفحة واحدة فقط، بإطار واضح وإضاءة جيدة.";
  }
  if (lang === "en") {
    return "If possible, capture a single page with clear framing and good lighting.";
  }
  return "Si possible, capturez une page bien cadrée et lumineuse.";
}

function readLangLS(): "fr" | "en" | "ar" {
  try {
    return (
      (localStorage.getItem("oneboarding.lang") as "fr" | "en" | "ar") || "fr"
    );
  } catch {
    return "fr";
  }
}

/* =================== Page =================== */
export default function Page() {
  const [lang, setLang] = useState<"fr" | "en" | "ar">(() => readLangLS());

  // Micro
  const recogRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const [, setSpeechSupported] = useState(false);
  const [, setListening] = useState(false);

  const { snapshot: access, checkAndConsume } = useAccessControl();
  const [welcomeLimitOpen, setWelcomeLimitOpen] = useState(false);
  const [memberLimitOpen, setMemberLimitOpen] = useState(false);

  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const [showClearModal, setShowClearModal] = useState(false);
  const [clearLang, setClearLang] = useState<"fr" | "en" | "ar">("fr");

  const [showLegal, setShowLegal] = useState(false);

  // 🧾 Texte OCR global (1–3 fichiers)
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);

  /* === Langue globale (placeholder + direction) === */
  useEffect(() => {
    const onLangChanged = () => {
      const next = readLangLS();
      setLang(next);
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

  /* === CGU / Privacy auto au premier lancement === */
  useEffect(() => {
    const onOpen = () => {
      const c = localStorage.getItem(CONSENT_KEY) === "1";
      if (!c) setShowLegal(true);
    };
    window.addEventListener("ob:open-legal", onOpen as EventListener);
    return () =>
      window.removeEventListener("ob:open-legal", onOpen as EventListener);
  }, []);

  /* === Historique local === */
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

  /* === Demande de clear depuis le Menu === */
  useEffect(() => {
    const onRequestClear = (evt: Event) => {
      const e = evt as CustomEvent<{ lang?: "fr" | "en" | "ar" }>;
      const requestedLang =
        e.detail?.lang === "en" || e.detail?.lang === "ar"
          ? e.detail.lang
          : "fr";

      setClearLang(requestedLang);
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

  /* === Scroll vers le haut quand la réponse arrive === */
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading)
      window.scrollTo({ top: 0, behavior: "smooth" });
    prevLoadingRef.current = loading;
  }, [loading]);

  /* === Initialisation WebSpeech (micro) === */
  useEffect(() => {
    const SR: any =
      (typeof window !== "undefined" && (window as any).SpeechRecognition) ||
      (typeof window !== "undefined" &&
        (window as any).webkitSpeechRecognition);
    if (!SR) {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);

    const r = new SR();
    r.lang = lang === "ar" ? "ar-MA" : lang === "en" ? "en-US" : "fr-FR";
    r.continuous = true;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setListening(true);
      listeningRef.current = true;
    };

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

    const stopUI = () => {
      setListening(false);
      listeningRef.current = false;
    };
    r.onend =
      r.onspeechend =
      r.onaudioend =
      r.onnomatch =
      r.onerror =
        stopUI;

    recogRef.current = r;
  }, [lang]);

  function toggleMic() {
    const r = recogRef.current;
    if (!r) {
      console.warn("Micro non supporté par ce navigateur.");
      return;
    }
    try {
      if (!listeningRef.current) {
        r.start();
      } else {
        r.stop();
      }
    } catch (e) {
      console.warn("Échec démarrage/arrêt micro:", e);
      listeningRef.current = false;
      setListening(false);
    }
  }

  /* === OCR local : écoute des fichiers sélectionnés (ChatPanel) === */
  useEffect(() => {
    let cancelled = false;

    const handleFilesSelected = async (evt: Event) => {
      const e = evt as CustomEvent<{ files?: File[] }>;
      const files = (e.detail?.files || []).slice(0, 3);

      if (!files.length) {
        setOcrText("");
        return;
      }

      setOcrLoading(true);
      setOcrText("");

      try {
        // Import dynamique pour ne pas alourdir le bundle initial
        const { createWorker } = await import("tesseract.js");

        // 👉 IMPORTANT : on force le type en `any` pour éviter le conflit
        // avec le type DOM Worker dans TypeScript.
        const worker = (await (createWorker as any)()) as any;

        // 🌍 Pack de langues mondial – 20 langues supportées
        await worker.loadLanguage(OCR_LANGS);
        await worker.initialize(OCR_LANGS);

        let combined = "";

        for (const file of files) {
          const url = URL.createObjectURL(file);
          const { data } = await worker.recognize(url);
          URL.revokeObjectURL(url);

          if (cancelled) {
            await worker.terminate();
            return;
          }

          const txt = (data.text || "").trim();
          if (txt) {
            combined += `\n\n===== ${file.name} =====\n${txt}`;
          }
        }

        await worker.terminate();

        if (!cancelled) {
          setOcrText(combined.trim());
        }
      } catch (err) {
        console.error("OCR error", err);
        if (!cancelled) setOcrText("");
      } finally {
        if (!cancelled) setOcrLoading(false);
      }
    };

    window.addEventListener(
      "ob:files-selected",
      handleFilesSelected as EventListener
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "ob:files-selected",
        handleFilesSelected as EventListener
      );
    };
  }, []);

  /* === Écoute des événements venant de ChatPanel === */
  useEffect(() => {
    const onMic = () => toggleMic();

    window.addEventListener("ob:toggle-mic", onMic as EventListener);

    return () => {
      window.removeEventListener("ob:toggle-mic", onMic as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onSubmit = async (evt: Event) => {
      const e = evt as CustomEvent<{
        text?: string;
        lang?: "fr" | "en" | "ar";
      }>;
      const text = (e.detail?.text || "").trim();
      const L = (e.detail?.lang as "fr" | "en" | "ar") || lang;
      if (!text || loading) return;

      const res = await checkAndConsume();
      if (!res.allowed) {
        if (res.reason === "NEED_SUB") {
          setWelcomeLimitOpen(true);
        } else if (res.reason === "NEED_CONNECT") {
          setMemberLimitOpen(true);
        }
        return;
      }

      const now = new Date().toISOString();
      setHistory((h) => [{ role: "user", text, time: now }, ...h]);
      setLoading(true);

      // 🧩 Composition finale du prompt : texte user + OCR (si présent)
      const promptPayload = ocrText
        ? `${text}\n\n[CONTENU EXTRAIT DES DOCUMENTS FOURNIS]\n${ocrText}`
        : text;

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptPayload }),
        });
        const data = await response.json();
        if (!response.ok || !data?.ok) {
          const raw = String(data?.error || `HTTP ${response.status}`);
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

          const isOcrMode = Boolean(ocrText);
          let finalText: string;

          if (isOcrMode) {
            // 🔎 Lecture d’images / documents → pool OCR dédié
            finalText = formatOcrResponse({
              lang: L as OcrLang,
              confidence: conf as OcrConfidence,
              summary: modelTextRaw,
              tips: ocrTipsFor(L),
              seed: Date.now() % 100000,
              joiner: " ",
            }).trim();
          } else {
            // 💬 Réponse texte classique → moteur universel
            finalText = formatTextResponse({
              lang: L,
              confidence: conf,
              summary: modelTextRaw,
              includeCta: false,
              seed: Date.now() % 100000,
              joiner: "\n\n",
            })
              .replace(/\n{3,}/g, "\n\n")
              .trim();
          }

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

    window.addEventListener("ob:chat-submit", onSubmit as EventListener);
    return () =>
      window.removeEventListener("ob:chat-submit", onSubmit as EventListener);
  }, [lang, loading, checkAndConsume, ocrText]);

  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem("oneboarding.history");
    } catch {}
    setShowClearModal(false);
    window.dispatchEvent(new Event("ob:history-cleared"));
  }

  const CLEAR_I18N: Record<
    "fr" | "en" | "ar",
    { title: string; desc: string; confirm: string; cancel: string }
  > = {
    fr: {
      title: "Effacer l’historique ?",
      desc:
        "Souhaitez-vous vraiment supprimer l’historique de la conversation ? Cette action est irréversible.",
      confirm: "Effacer",
      cancel: "Annuler",
    },
    en: {
      title: "Clear history?",
      desc:
        "Do you really want to delete the conversation history? This action cannot be undone.",
      confirm: "Delete",
      cancel: "Cancel",
    },
    ar: {
      title: "حذف السجل؟",
      desc: "هل تريد حقاً حذف سجل المحادثة؟ هذا الإجراء لا رجوع فيه.",
      confirm: "حذف",
      cancel: "إلغاء",
    },
  };

  const modalCopy = CLEAR_I18N[clearLang] || CLEAR_I18N.fr;

  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-y-auto p-6 pb-[120px] text-[var(--fg)] selection:bg-[var(--accent)/30] selection:text-[var(--fg)]">
      <PaymentReturnBridge />
      <AuthorizeReturnBridge />

      <StyleGlobals />
      <div className="halo" aria-hidden />

      <div className="mb-1 -mt-1 flex justify-center">
        <div className="relative h-32 w-32 overflow-hidden md:h-44 md:w-44">
          <Image
            src="/brand/oneboardingai-logo.png"
            alt="OneBoarding AI — logomark"
            fill
            priority
            className="drop-shadow-[0_0_40px_rgba(56,189,248,0.30)] object-contain -translate-y-3 md:-translate-y-4"
          />
        </div>
      </div>

      {/* ChatPanel (input + boutons internes 📎 / 🎙️) */}
      <div className="w-full max-w-3xl">
        <ChatPanel />
      </div>

      {/* Historique */}
      <div className="z-[1] mt-3 w-full max-w-3xl space-y-3 pb-10">
        {loading && (
          <div className="msg-appear relative rounded-xl border border-[var(--border)] bg-[var(--assistant-bg)] p-3">
            <p className="text-[var(--fg)]">
              <span className="typing-dots" aria-live="polite">
                •••
              </span>
            </p>
            <p className="mt-4 text-xs opacity-70">
              IA • {new Date().toLocaleString()}
            </p>
          </div>
        )}

        {history.map((item, idx) => (
          <div
            key={idx}
            className={`msg-appear relative rounded-xl border p-3
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
                className="absolute bottom-3 right-3 rounded-lg border border-[var(--border)] bg-[var(--chip-bg)] px-3 py-1 text-xs hover:bg-[var(--chip-hover)]"
              >
                {lang === "ar" ? "نسخ" : lang === "en" ? "Copy" : "Copier"}
              </button>
            )}

            <p className="mt-6 text-xs opacity-70">
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

      <ConfirmDialog
        open={showClearModal}
        title={modalCopy.title}
        description={modalCopy.desc}
        confirmLabel={modalCopy.confirm}
        cancelLabel={modalCopy.cancel}
        onConfirm={clearHistory}
        onCancel={() => setShowClearModal(false)}
      />
      <CguPrivacyModal
        open={showLegal}
        onRequestClose={() => setShowLegal(false)}
      />

      <WelcomeLimitDialog
        open={welcomeLimitOpen}
        onClose={() => setWelcomeLimitOpen(false)}
        lang={lang}
      />
      <MemberLimitDialog
        open={memberLimitOpen}
        onClose={() => setMemberLimitOpen(false)}
        lang={lang}
      />

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
            #cfe8ff 0%,
            #f3f4ff 100%
          ) fixed !important;
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
          rgba(56, 189, 248, 0.24),
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

      .lang-ar textarea::placeholder {
        text-align: right;
      }
      .lang-ar .msg-appear p[dir="auto"] {
        text-align: right;
      }

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
