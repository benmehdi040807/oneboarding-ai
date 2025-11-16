// components/MemberLimitDialog.tsx
"use client";

import { useEffect, useRef } from "react";

export default function MemberLimitDialog({
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

  return (
    <>
      <style>{`dialog::backdrop{background:rgba(0,0,0,.45);-webkit-backdrop-filter:saturate(120%) blur(2px);backdrop-filter:saturate(120%) blur(2px);}`}</style>
      <dialog
        ref={ref}
        onMouseDown={onBackdropClick}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-md"
        dir={rtl ? "rtl" : "ltr"}
      >
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div
            className={`flex items-center justify-between mb-3 ${
              rtl ? "text-right" : ""
            }`}
          >
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

          <div
            className={`space-y-3 text-[15px] leading-6 ${
              rtl ? "text-right" : ""
            }`}
          >
            <p className="font-medium">{t.headline}</p>
            <p className="opacity-90">{t.body}</p>
          </div>

          <div
            className={`mt-5 flex gap-3 ${
              rtl ? "justify-start" : "justify-end"
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl border border-black/10 font-semibold"
            >
              {t.ok}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

const TEXT = {
  fr: {
    title: "Information sur votre espace",
    close: "Fermer",
    headline:
      "Vous avez utilisé vos 3 interactions quotidiennes gratuites.",
    body: "Pour continuer avec un accès illimité, connectez-vous à votre espace depuis le Menu (bouton « Se connecter »).",
    ok: "OK",
  },
  en: {
    title: "Information about your space",
    close: "Close",
    headline: "You have used your 3 free daily interactions.",
    body: 'To continue with unlimited access, sign in to your space from the Menu (the “Sign in” button).',
    ok: "OK",
  },
  ar: {
    title: "معلومة حول مساحتك",
    close: "إغلاق",
    headline: "لقد استخدمت تفاعلاتك الثلاث المجانية لليوم.",
    body: "للاستمرار بوصول غير محدود، سجّل الدخول إلى مساحتك من القائمة (زر «تسجيل الدخول»).",
    ok: "حسناً",
  },
} as const;
