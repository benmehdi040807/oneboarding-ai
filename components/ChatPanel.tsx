// components/ChatPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import WelcomeLimitDialog from "@/components/WelcomeLimitDialog";
import { consumeOne } from "@/lib/quotaClient";

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

export default function ChatPanel() {
  const [lang, setLang] = useState<Lang>(getInitialLang());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  const taRef = useRef<HTMLTextAreaElement | null>(null);

  /* ====== Lang sync (écoute le Menu et, si besoin, l’URL) ====== */
  useEffect(() => {
    const onLang = (e: Event) => {
      const detail = (e as CustomEvent).detail as { lang?: string } | undefined;
      const next =
        (detail?.lang as Lang) ||
        (localStorage.getItem("oneboarding.lang") as Lang) ||
        document.documentElement.lang ||
        "fr";
      const v = (["fr", "en", "ar"].includes(next) ? (next as Lang) : "fr");
      setLang(v);
    };
    window.addEventListener("ob:lang-changed", onLang as EventListener);

    const onUrl = () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const q = (sp.get("lang") || "").toLowerCase();
        if (q && (["fr", "en", "ar"] as const).includes(q as Lang)) {
          setLang(q as Lang);
        }
      } catch {}
    };
    window.addEventListener("ob:url-changed", onUrl);

    return () => {
      window.removeEventListener("ob:lang-changed", onLang as EventListener);
      window.removeEventListener("ob:url-changed", onUrl);
    };
  }, []);

  /* ====== Petit utilitaire focus externe (optionnel) ====== */
  useEffect(() => {
    const onFocusReq = () => taRef.current?.focus();
    window.addEventListener("ob:focus-input", onFocusReq);
    return () => window.removeEventListener("ob:focus-input", onFocusReq);
  }, []);

  /* ====== 🔊 Injection micro → synchronisation React (Option A) ====== */
  useEffect(() => {
    const syncFromDom = (ev: Event) => {
      const ta = taRef.current;
      if (!ta) return;
      // Ne réagit que si l'input vient de notre textarea contrôlé
      if (ev.target === ta) {
        // Met à jour le state pour que React reflète la valeur DOM
        setInput(ta.value);
      }
    };
    // Capture pour attraper aussi les events natifs dispatchés
    window.addEventListener("input", syncFromDom, true);
    return () => window.removeEventListener("input", syncFromDom, true);
  }, []);

  /* ====== Gestion envoi ====== */
  async function onSend() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await consumeOne();

      if (res.ok) {
        // Notifie la page (pipeline IA principal)
        window.dispatchEvent(
          new CustomEvent("ob:chat-submit", { detail: { text, lang } })
        );
        setInput("");
        requestAnimationFrame(() => taRef.current?.focus());
        return;
      }

      if (!res.ok && res.code === "LIMIT_REACHED") {
        setWelcomeOpen(true);
        return;
      }

      console.warn("Unexpected quota response:", res);
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  }

  /* ====== UI minimaliste et premium ====== */
  const isRTL = lang === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const align = isRTL ? "text-right" : "text-left";

  const LABELS: Record<Lang, { placeholder: string; send: string }> = {
    fr: { placeholder: "Écrivez ici…", send: "Envoyer" },
    en: { placeholder: "Type here…", send: "Send" },
    ar: { placeholder: "اكتب هنا…", send: "إرسال" },
  };

  const t = LABELS[lang];

  return (
    <section dir={dir} className={`w-full max-w-3xl mx-auto ${align}`}>
      {/* Zone de saisie */}
      <div
        className={`
          rounded-2xl border border-black/10 bg-white text-black shadow-sm
          p-3 sm:p-4
        `}
      >
        <textarea
          ref={taRef}
          data-ob-chat-input
          className={`
            w-full resize-none outline-none
            leading-6 text-[15px] placeholder-black/40
            ${isRTL ? "text-right" : "text-left"}
          `}
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          dir={dir}
          aria-label="Zone de saisie du message"
        />

        <div className={`mt-3 flex ${isRTL ? "justify-start" : "justify-end"}`}>
          <button
            onClick={onSend}
            disabled={sending || !input.trim()}
            className={`
              inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold
              text-white transition
              ${sending || !input.trim()
                ? "opacity-60 cursor-not-allowed"
                : "hover:opacity-90"
              }
            `}
            style={{ background: "linear-gradient(135deg,#111827,#374151)" }}
          >
            {sending
              ? (lang === "ar" ? "جارٍ الإرسال…" : lang === "en" ? "Sending…" : "Envoi…")
              : t.send}
          </button>
        </div>
      </div>

      {/* Modale de bienvenue (quota atteint) */}
      <WelcomeLimitDialog
        open={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        lang={lang}
      />
    </section>
  );
}
