// app/trademark/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { COPY, JSON_LD } from "@/lib/trademark/copy";

const GRAD_CHIP = "from-sky-500 via-indigo-500 to-fuchsia-600";

function LangChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-current={active ? "true" : undefined}
      className={[
        "rounded-lg px-3.5 py-1.5 text-sm transition focus:outline-none",
        active
          ? `text-white shadow bg-gradient-to-r ${GRAD_CHIP}`
          : "text-neutral-800 border border-neutral-300/80 bg-white/70 hover:bg-neutral-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

const TITLES: Record<"fr" | "en" | "ar", string> = {
  fr: "🏛️ OneBoarding AI® — Marque déposée (OMPIC-291822)",
  en: "🏛️ OneBoarding AI® — Registered trademark (OMPIC-291822)",
  ar: "🏛️ ®OneBoarding AI — علامة مسجلة (OMPIC-291822)",
};

const META_DESC: Record<"fr" | "en" | "ar", string> = {
  fr: "OneBoarding AI® — Marque déposée au Royaume du Maroc (OMPIC-291822).",
  en: "OneBoarding AI® — Registered trademark in the Kingdom of Morocco (OMPIC-291822).",
  ar: "®OneBoarding AI — علامة مسجلة بالمملكة المغربية لدى OMPIC (رقم 291822).",
};

function asLang(x: string | null | undefined): "fr" | "en" | "ar" | null {
  if (x === "fr" || x === "en" || x === "ar") return x;
  return null;
}

/** === Composant interne avec hooks Next === */
function TrademarkContent() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initialLang = useMemo<"fr" | "en" | "ar">(() => {
    return asLang(sp?.get("lang")) ?? "fr";
  }, [sp]);

  const [lang, setLang] = useState<"fr" | "en" | "ar">(initialLang);

  useEffect(() => {
    const urlLang = asLang(sp?.get("lang"));
    if (urlLang && urlLang !== lang) setLang(urlLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  useEffect(() => {
    const desc = META_DESC[lang];
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, [lang]);

  const updateUrlLang = (next: "fr" | "en" | "ar") => {
    const params = new URLSearchParams(sp?.toString());
    params.set("lang", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const changeLang = (next: "fr" | "en" | "ar") => {
    if (next === lang) return;
    setLang(next);
    updateUrlLang(next);
  };

  const backLabel =
    lang === "ar" ? "العودة للرئيسية" : lang === "en" ? "Back home" : "Retour accueil";

  const moreInfoLabel =
    lang === "ar"
      ? "للمزيد من المعلومات، يُرجى زيارة:"
      : lang === "en"
      ? "For additional information, please consult:"
      : "Pour toute information complémentaire, vous pouvez consulter :";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1
        className="text-2xl md:text-3xl font-semibold tracking-tight"
        dir={lang === "ar" ? "rtl" : undefined}
      >
        {TITLES[lang]}
      </h1>

      <div className="h-4" />

      <div className="mb-8 flex flex-wrap gap-3">
        <LangChip active={lang === "fr"} onClick={() => changeLang("fr")}>
          🇫🇷 Français
        </LangChip>
        <LangChip active={lang === "en"} onClick={() => changeLang("en")}>
          🇬🇧 English
        </LangChip>
        <LangChip active={lang === "ar"} onClick={() => changeLang("ar")}>
          🇲🇦 العربية
        </LangChip>
      </div>

      <div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-8">
        {COPY[lang]}

        <div className="mt-6 border-t border-black/10 pt-4">
          <p className="opacity-90">{moreInfoLabel}</p>
          <div className="mt-2 space-y-1.5">
            <p>
              <Link
                href={`/legal?lang=${lang}`}
                className="underline text-blue-700 hover:text-blue-900 break-all"
              >
                oneboardingai.com/legal
              </Link>
            </p>
            <p>
              <Link
                href={`/terms?lang=${lang}`}
                className="underline text-blue-700 hover:text-blue-900 break-all"
              >
                oneboardingai.com/terms
              </Link>
            </p>
            <p>
              <Link
                href={`/delete?lang=${lang}`}
                className="underline text-blue-700 hover:text-blue-900 break-all"
              >
                oneboardingai.com/delete
              </Link>
            </p>
            <p>
              <Link
                href={`/protocol?lang=${lang}`}
                className="underline text-blue-700 hover:text-blue-900 break-all"
              >
                oneboardingai.com/protocol
              </Link>
            </p>
            <p>
              <Link
                href={`/trademark?lang=${lang}`}
                className="underline text-blue-700 hover:text-blue-900 break-all"
              >
                oneboardingai.com/trademark
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="
            inline-block px-5 py-2 rounded-xl border border-transparent
            bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400
            text-white shadow-sm hover:opacity-90 transition
          "
        >
          {backLabel}
        </Link>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
    </main>
  );
}

/** === Export par défaut avec Suspense pour useSearchParams === */
export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-neutral-500">Loading…</div>}>
      <TrademarkContent />
    </Suspense>
  );
}
