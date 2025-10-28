// components/RightAuthButtons.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Lang = "fr" | "en" | "ar";

const copy: Record<
  Lang,
  {
    ok: string;
    close: string;
    blue: { title: string; p1: string; p2: string; footer: string };
    gold: { title: string; p1: string; p2: string; footer: string };
  }
> = {
  fr: {
    ok: "OK",
    close: "Fermer",
    blue: {
      title: "One IA — Votre Intelligence personnelle",
      p1: "Une nouvelle ère s’annonce. L’intelligence devient personnelle, intime, à votre image.",
      p2: "Votre IA vous accompagne, vous comprend, et évolue avec vous.",
      footer:
        "Coming soon — La génération II. L’intelligence qui se souvient de vous, pour vous.",
    },
    gold: {
      title: "Mirror IA — L’Internet des intelligences",
      p1: "L’intelligence ne sera plus seule. Elle dialoguera avec d’autres, sous votre regard, pour votre monde.",
      p2: "Les IA personnelles se rencontreront, coopèreront, et créeront ensemble.",
      footer:
        "Coming soon — La génération III. L’intelligence connectée, au service de l’humain.",
    },
  },
  en: {
    ok: "OK",
    close: "Close",
    blue: {
      title: "One IA — Your Personal Intelligence",
      p1: "A new era is emerging. Intelligence becomes personal, intimate, in your image.",
      p2: "Your AI accompanies you, understands you, and evolves with you.",
      footer:
        "Coming soon — Generation II. Intelligence that remembers you, for you.",
    },
    gold: {
      title: "Mirror IA — The Internet of Intelligences",
      p1: "Intelligence will no longer be alone. It will converse with others, under your guidance, for your world.",
      p2: "Personal AIs will meet, cooperate, and create together.",
      footer:
        "Coming soon — Generation III. Connected intelligence, in the service of humanity.",
    },
  },
  ar: {
    ok: "حسنًا",
    close: "إغلاق",
    blue: {
      title: "One IA — ذكاؤك الشخصي",
      p1: "عصرٌ جديد يلوح. يصبح الذكاء شخصيًا، حميمًا، على صورتك.",
      p2: "ذكاؤك يرافقك، يفهمك، ويتطوّر معك.",
      footer: "قريبًا — الجيل الثاني. الذكاء الذي يتذكّرك، من أجلك.",
    },
    gold: {
      title: "Mirror IA — إنترنت الذكاءات",
      p1: "لن يبقى الذكاء وحيدًا. سيتحاور مع غيره، وتحت نظرك، من أجل عالمك.",
      p2: "ستلتقي الذكاءات الشخصية وتتعاون وتبدع معًا.",
      footer: "قريبًا — الجيل الثالث. ذكاءٌ متصل في خدمة الإنسان.",
    },
  },
};

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "fr";
  const sp = new URLSearchParams(window.location.search);
  const q = (sp.get("lang") || document.documentElement.lang || "fr")
    .toLowerCase()
    .trim();
  return (["fr", "en", "ar"].includes(q) ? (q as Lang) : "fr");
}

export default function RightAuthButtons() {
  const [lang, setLang] = useState<Lang>(getInitialLang());
  const [openBlue, setOpenBlue] = useState(false);
  const [openGold, setOpenGold] = useState(false);

  const blueRef = useRef<HTMLDialogElement | null>(null);
  const goldRef = useRef<HTMLDialogElement | null>(null);

  /* ====== Option 1 : écoute automatique des mutations d’URL ====== */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const readAndSetLang = () => {
      const next = getInitialLang();
      setLang((prev) => (prev !== next ? next : prev));
    };

    const notify = () => window.dispatchEvent(new Event("ob:url-changed"));

    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    const newPush: History["pushState"] = (...args) => {
      origPush(...args);
      notify();
    };
    const newReplace: History["replaceState"] = (...args) => {
      origReplace(...args);
      notify();
    };

    history.pushState = newPush;
    history.replaceState = newReplace;

    const onPop = () => readAndSetLang();
    const onCustom = () => readAndSetLang();

    window.addEventListener("popstate", onPop);
    window.addEventListener("ob:url-changed", onCustom);

    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("ob:url-changed", onCustom);
    };
  }, []);

  // Écoute du signal de langue émis par le Menu
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | undefined;
      if (detail && (["fr", "en", "ar"] as const).includes(detail as Lang)) {
        setLang(detail as Lang);
      }
    };
    window.addEventListener("ob:lang-changed", handler as EventListener);
    return () =>
      window.removeEventListener("ob:lang-changed", handler as EventListener);
  }, []);

  // Ouvrir/fermer les dialogs
  useEffect(() => {
    const d = blueRef.current;
    if (!d) return;
    if (openBlue && !d.open) d.showModal();
    if (!openBlue && d.open) d.close();
  }, [openBlue]);
  useEffect(() => {
    const d = goldRef.current;
    if (!d) return;
    if (openGold && !d.open) d.showModal();
    if (!openGold && d.open) d.close();
  }, [openGold]);

  // ESC / Cancel
  useEffect(() => {
    const attach = (dlg: HTMLDialogElement | null, onClose: () => void) => {
      if (!dlg) return () => {};
      const onCancel = (e: Event) => {
        e.preventDefault();
        onClose();
      };
      dlg.addEventListener("cancel", onCancel);
      return () => dlg.removeEventListener("cancel", onCancel);
    };
    const cleanBlue = attach(blueRef.current, () => setOpenBlue(false));
    const cleanGold = attach(goldRef.current, () => setOpenGold(false));
    return () => {
      cleanBlue();
      cleanGold();
    };
  }, []);

  // Fermeture sur clic backdrop
  const onBackdropClick =
    (setOpen: (v: boolean) => void, ref: React.RefObject<HTMLDialogElement>) =>
    (e: React.MouseEvent<HTMLDialogElement>) => {
      const d = ref.current;
      if (!d) return;
      const r = d.getBoundingClientRect();
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      if (!inside) setOpen(false);
    };

  const circle =
    "h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] grid place-items-center transition select-none";

  function onBlueClick() {
    setOpenBlue((v) => !v);
    if (openGold) setOpenGold(false);
  }
  function onGoldClick() {
    setOpenGold((v) => !v);
    if (openBlue) setOpenBlue(false);
  }

  const t = copy[lang];
  const isRTL = lang === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  return (
    <>
      {/* Boutons droits */}
      <div className="inline-flex items-center gap-3">
        {/* O bleu — One IA (Génération II) */}
        <button
          type="button"
          aria-label="One IA — Generation II"
          onClick={onBlueClick}
          className={circle}
          title="One IA — Coming soon"
        >
          <span
            className="text-xl font-extrabold"
            style={{
              lineHeight: 1,
              background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            O
          </span>
        </button>

        {/* O doré — Mirror IA (Génération III) */}
        <button
          type="button"
          aria-label="Mirror IA — Generation III"
          onClick={onGoldClick}
          className={circle}
          title="Mirror IA — Coming soon"
        >
          <span
            className="text-xl font-extrabold"
            style={{
              lineHeight: 1,
              background: "linear-gradient(90deg,#FFD451,#EABE3F,#D9D1C0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            O
          </span>
        </button>
      </div>

      {/* Backdrop */}
      <style>{`
        dialog::backdrop {
          background: rgba(0,0,0,.45);
          -webkit-backdrop-filter: saturate(120%) blur(2px);
          backdrop-filter: saturate(120%) blur(2px);
        }
      `}</style>

      {/* Dialog — O bleu */}
      <dialog
        ref={blueRef}
        onMouseDown={onBackdropClick(setOpenBlue, blueRef)}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="one-ia-title"
        lang={lang}
        dir={dir}
      >
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="one-ia-title"
              className={`text-lg sm:text-xl font-semibold ${
                isRTL ? "text-right" : ""
              }`}
            >
              {t.blue.title}
            </h2>
            <button
              type="button"
              onClick={() => setOpenBlue(false)}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label={t.close}
            >
              ×
            </button>
          </div>

          <div
            className={`space-y-3 text-[15px] leading-6 ${
              isRTL ? "text-right" : ""
            }`}
          >
            <p>{t.blue.p1}</p>
            <p>{t.blue.p2}</p>
            <p className="font-medium">{t.blue.footer}</p>
          </div>

          <div className={`mt-5 flex ${isRTL ? "justify-start" : "justify-end"}`}>
            <button
              type="button"
              onClick={() => setOpenBlue(false)}
              className="px-4 py-2 rounded-2xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
            >
              {t.ok}
            </button>
          </div>
        </div>
      </dialog>

      {/* Dialog — O doré */}
      <dialog
        ref={goldRef}
        onMouseDown={onBackdropClick(setOpenGold, goldRef)}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mirror-ia-title"
        lang={lang}
        dir={dir}
      >
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="mirror-ia-title"
              className={`text-lg sm:text-xl font-semibold ${
                isRTL ? "text-right" : ""
              }`}
            >
              {t.gold.title}
            </h2>
            <button
              type="button"
              onClick={() => setOpenGold(false)}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label={t.close}
            >
              ×
            </button>
          </div>

          <div
            className={`space-y-3 text-[15px] leading-6 ${
              isRTL ? "text-right" : ""
            }`}
          >
            <p>{t.gold.p1}</p>
            <p>{t.gold.p2}</p>
            <p className="font-medium">{t.gold.footer}</p>
          </div>

          <div className={`mt-5 flex ${isRTL ? "justify-start" : "justify-end"}`}>
            <button
              type="button"
              onClick={() => setOpenGold(false)}
              className="px-4 py-2 rounded-2xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg,#F1C049,#B5892D)" }}
            >
              {t.ok}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
      }
