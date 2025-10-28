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
    const inside =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;
    if (!inside) onClose();
  };

  function goSubscribe() {
    // Ouvre ta modale d’activation/espace (déjà branchée côté Menu)
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
            <p className="font-medium">{t.headline}</p>

            <p>{t.instruction}</p>

            <div>
              <p className="font-medium">{t.plansTitle}</p>
              <ul className="opacity-90 list-none space-y-1">
                <li>{t.planA}</li>
                <li>{t.planB}</li>
              </ul>
            </div>

            <p className="opacity-90">{t.elseReturn}</p>

            <div className="pt-1">
              <p className="font-medium">{t.brandWelcome}</p>
              <p>{t.brandBul1}<br />{t.brandBul2}</p>
            </div>
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
  /** FR — texte fourni par toi (intégré tel quel, avec une structuration légère) */
  fr: {
    title: "Bienvenue dans OneBoarding AI",
    close: "Fermer",
    headline: "✨ Vos 3 interactions offertes pour aujourd’hui sont terminées.",
    instruction:
      "Pour continuer votre expérience OneBoarding AI en accès illimité : activez votre espace personnel en 30 secondes (paiement inclus).",
    plansTitle: "Choisissez librement votre forfait :",
    planA: "🔹 Abonnement 5 €/mois — accès continu, sans interruption.",
    planB: "🔸 Accès libre 5 € — un mois complet, sans engagement.",
    elseReturn:
      "Sinon : Vous pouvez aussi revenir demain pour profiter de 3 nouvelles interactions gratuites.",
    brandWelcome: "Bienvenue dans OneBoarding AI",
    brandBul1: "👉 Votre IA personnelle, à votre service.",
    brandBul2: "👉 Activez votre futur dès aujourd’hui.",
    subscribe: "Souscription",
    later: "Plus tard",
  },

  /** EN — traduction fidèle et premium */
  en: {
    title: "Welcome to OneBoarding AI",
    close: "Close",
    headline: "✨ Your 3 free interactions for today are finished.",
    instruction:
      "To continue your OneBoarding AI experience with unlimited access, activate your personal space in 30 seconds (payment included).",
    plansTitle: "Choose your plan:",
    planA: "🔹 Subscription €5/month — continuous access, no interruption.",
    planB: "🔸 One-month pass €5 — a full month, no commitment.",
    elseReturn:
      "Otherwise: you can come back tomorrow to enjoy 3 new free interactions.",
    brandWelcome: "Welcome to OneBoarding AI",
    brandBul1: "👉 Your personal AI, at your service.",
    brandBul2: "👉 Activate your future today.",
    subscribe: "Subscribe",
    later: "Later",
  },

  /** AR — ترجمة دقيقة بأسلوب مهني، مع الحفاظ على المعنى والهيكلة */
  ar: {
    title: "مرحبًا بك في OneBoarding AI",
    close: "إغلاق",
    headline: "✨ انتهت تفاعلاتك الثلاث المجانية لليوم.",
    instruction:
      "للاستمرار في تجربة OneBoarding AI بوصول غير محدود: فعِّل مساحتك الشخصية خلال 30 ثانية (يشمل الدفع).",
    plansTitle: "اختر الخطة المناسبة:",
    planA: "🔹 اشتراك 5€ شهريًا — وصول مستمر دون انقطاع.",
    planB: "🔸 وصول حر 5€ — شهر كامل دون التزام.",
    elseReturn:
      "بدلًا من ذلك: يمكنك العودة غدًا للاستفادة من 3 تفاعلات مجانية جديدة.",
    brandWelcome: "مرحبًا بك في OneBoarding AI",
    brandBul1: "👉 ذكاؤك الشخصي، في خدمتك.",
    brandBul2: "👉 فعِّل مستقبلك اليوم.",
    subscribe: "الاشتراك",
    later: "لاحقًا",
  },
} as const;
