// components/WelcomeLimitDialog.tsx
"use client";

import React, { useEffect, useRef } from "react";

type Lang = "fr" | "en" | "ar";

export default function WelcomeLimitDialog({
  open,
  onClose,
  lang = "fr",
}: {
  open: boolean;
  onClose: () => void;
  lang?: Lang;
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
        <div
          className={[
            "bg-white text-black rounded-3xl",
            "p-4 sm:p-6",
            rtl ? "pr-5 sm:pr-7" : "",
          ].join(" ")}
        >
          {/* Header */}
          <div
            className={[
              "flex items-center justify-between",
              "mb-3",
              rtl ? "text-right" : "",
            ].join(" ")}
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

          {/* Body */}
          <div
            className={[
              "text-[15px] leading-6",
              "space-y-4",
              rtl ? "text-right" : "",
            ].join(" ")}
          >
            {/* Intro */}
            <div className="space-y-1">
              {t.intro.map((line) => (
                <p key={line} className="font-medium">
                  {line}
                </p>
              ))}
            </div>

            {/* Plans */}
            <div className="space-y-2">
              <ul className="list-none p-0 m-0 space-y-2">
                {t.plans.map((p) => (
                  <li
                    key={p.name}
                    className="rounded-2xl border border-black/10 px-3 py-2"
                  >
                    <div className="font-semibold">{p.name}</div>
                    <div className="opacity-90">{p.desc}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Power lines */}
            <div className="pt-1">
              <div className="space-y-0.5">
                {t.power.map((line, idx) => (
                  <p
                    key={`${line}-${idx}`}
                    className={idx === t.power.length - 1 ? "font-semibold" : ""}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={["mt-5 flex gap-3", rtl ? "justify-start" : "justify-end"].join(" ")}>
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

const TEXT: Record<
  Lang,
  {
    title: string;
    close: string;
    intro: string[];
    plans: { name: string; desc: string }[];
    power: string[];
    subscribe: string;
    later: string;
  }
> = {
  fr: {
    title: "OneBoarding AI",
    close: "Fermer",
    intro: ["Accédez en illimité.", "Selon votre choix."],
    plans: [
      {
        name: "— One Day — 11 € [Standard]",
        desc: "Active l'accès pour 24 heures.",
      },
      {
        name: "— One Month — 31 € [Plus]",
        desc: "Active l'accès pour 30 jours.",
      },
      {
        name: "— One Year — 300 € [Gold]",
        desc: "Active l'accès pour 365 jours.",
      },
      {
        name: "— One Life — 31 000 € [Signature]",
        desc: "Active l'accès pour 365 jours à vie.",
      },
    ],
    power: [
      "200 pays.",
      "20 langues.",
      "Des millions de textes.",
      "Une seule intelligence : OneBoarding AI.",
    ],
    subscribe: "Souscrire",
    later: "Plus tard",
  },

  en: {
    title: "OneBoarding AI",
    close: "Close",
    intro: ["Unlimited access.", "On your terms."],
    plans: [
      {
        name: "— One Day — €11 [Standard]",
        desc: "Activates access for 24 hours.",
      },
      {
        name: "— One Month — €31 [Plus]",
        desc: "Activates access for 30 days.",
      },
      {
        name: "— One Year — €300 [Gold]",
        desc: "Activates access for 365 days.",
      },
      {
        name: "— One Life — €31,000 [Signature]",
        desc: "Activates access for 365 days, for life.",
      },
    ],
    power: [
      "200 countries.",
      "20 languages.",
      "Millions of texts.",
      "One intelligence: OneBoarding AI.",
    ],
    subscribe: "Subscribe",
    later: "Later",
  },

  ar: {
    title: "OneBoarding AI",
    close: "إغلاق",
    intro: ["وصول غير محدود.", "وفق اختيارك."],
    plans: [
      {
        name: "— One Day — 11 € [Standard]",
        desc: "تفعيل الوصول لمدة 24 ساعة.",
      },
      {
        name: "— One Month — 31 € [Plus]",
        desc: "تفعيل الوصول لمدة 30 يوماً.",
      },
      {
        name: "— One Year — 300 € [Gold]",
        desc: "تفعيل الوصول لمدة 365 يوماً.",
      },
      {
        name: "— One Life — 31,000 € [Signature]",
        desc: "تفعيل الوصول لمدة 365 يوماً، مدى الحياة.",
      },
    ],
    power: ["200 دولة.", "20 لغة.", "ملايين النصوص.", "ذكاء واحد: OneBoarding AI."],
    subscribe: "اشترك",
    later: "لاحقًا",
  },
};
