// components/WelcomeLimitDialog.tsx
"use client";

import { useEffect, useRef } from "react";

export default function WelcomeLimitDialog({
  open,
  onClose,
  lang = "fr",
}: {
  open: boolean;
  onClose: () => void;
  lang?: "fr" | "en" | "ar";
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const t = TEXT[lang] || TEXT.fr;
  const rtl = lang === "ar";

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const d = ref.current;
    if (!d) return;
    const r = d.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) onClose();
  };

  function goSubscribe() {
    // Ouvre TA modale existante (Menu) d’activation/espace
    window.dispatchEvent(new CustomEvent("ob:open-activate"));
    onClose();
  }

  return (
    <>
      <style>{`dialog::backdrop{background:rgba(0,0,0,.45);-webkit-backdrop-filter:saturate(120%) blur(2px);backdrop-filter:saturate(120%) blur(2px);}`}</style>
      <dialog
        ref={ref}
        onMouseDown={onBackdropClick}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg"
        dir={rtl ? "rtl" : "ltr"}
      >
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div className={`flex items-center justify-between mb-3 ${rtl ? "text-right" : ""}`}>
            <h2 className="text-lg sm:text-xl font-semibold">{t.title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label={t.close}
            >
              ×
            </button>
          </div>

          <div className={`space-y-3 text-[15px] leading-6 ${rtl ? "text-right" : ""}`}>
            <p>{t.lead1}</p>
            <p>{t.lead2}</p>
            <p className="font-medium">{t.footer}</p>
          </div>

          <div className={`mt-5 flex gap-3 ${rtl ? "justify-start" : "justify-end"}`}>
            <button
              type="button"
              onClick={goSubscribe}
              className="px-4 py-2 rounded-2xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
            >
              {t.subscribe}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl border border-black/10 font-semibold"
            >
              {t.later}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

const TEXT = {
  fr: {
    title: "Bienvenue dans OneBoarding AI",
    close: "Fermer",
    lead1: "Vous avez profité de vos 3 interactions gratuites du jour.",
    lead2: "Activez votre espace personnel pour un accès illimité.",
    footer: "Activation en 30 secondes (paiement inclus).",
    subscribe: "Souscription",
    later: "Plus tard",
  },
  en: {
    title: "Welcome to OneBoarding AI",
    close: "Close",
    lead1: "You’ve used your 3 free daily interactions.",
    lead2: "Activate your personal space for unlimited access.",
    footer: "Activation in 30 seconds (payment included).",
    subscribe: "Subscribe",
    later: "Later",
  },
  ar: {
    title: "مرحبًا بك في OneBoarding AI",
    close: "إغلاق",
    lead1: "لقد استخدمت 3 تفاعلاتك المجانية لليوم.",
    lead2: "فعّل مساحتك الشخصية للوصول غير المحدود.",
    footer: "تفعيل خلال 30 ثانية (يشمل الدفع).",
    subscribe: "الاشتراك",
    later: "لاحقًا",
  },
} as const;
