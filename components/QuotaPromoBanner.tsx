"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "fr" | "en" | "ar";

function endOfTodayTs() {
  const d = new Date();
  d.setHours(24, 0, 0, 0); // minuit local
  return d.getTime();
}

const LS_KEYS = {
  LANG: "oneboarding.lang",
  DAILY_COUNT: "oneboarding.dailyCount",
  DAILY_STAMP: "oneboarding.dailyStamp",        // yyyy-mm-dd du jour
  PROMO_UNTIL: "oneboarding.promoUntil",        // timestamp fin de validité (minuit)
  PLAN: "oneboarding.plan",                     // "subscription" | "one-month" | null
  CONNECTED: "ob_connected",                    // "1" | "0"
};

function todayStamp() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
}

function readLS<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function writeLS(k: string, v: any) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export default function QuotaPromoBanner({
  i18nPromo,
}: {
  // i18nPromo = I18N[lang].PROMO[LANGCODE]
  i18nPromo: {
    TITLE: string; LEAD_1: string; LEAD_2: string;
    PLANS_TITLE: string; PLAN_A: string; PLAN_B: string; OR: string;
    WELCOME_1: string; WELCOME_2: string; WELCOME_3: string;
    CTA: string;
  };
}) {
  const [visible, setVisible] = useState(false);

  const lang: Lang = useMemo(() => {
    try { return (localStorage.getItem(LS_KEYS.LANG) as Lang) || "fr"; } catch { return "fr"; }
  }, []);

  useEffect(() => {
    // 1) Reset du compteur si on a changé de jour
    const stamp = localStorage.getItem(LS_KEYS.DAILY_STAMP);
    const today = todayStamp();
    if (stamp !== today) {
      writeLS(LS_KEYS.DAILY_STAMP, today);
      writeLS(LS_KEYS.DAILY_COUNT, 0);
      // purge bannière expirée
      writeLS(LS_KEYS.PROMO_UNTIL, 0);
    }

    const plan = readLS<string | null>(LS_KEYS.PLAN, null);         // null si non-membre
    const connected = localStorage.getItem(LS_KEYS.CONNECTED) === "1";
    const count = readLS<number>(LS_KEYS.DAILY_COUNT, 0);
    const promoUntil = readLS<number>(LS_KEYS.PROMO_UNTIL, 0);
    const now = Date.now();

    // logiques d’affichage :
    // - non membre ET (déjà 3 interactions aujourd’hui OU promo flag actif)
    const isNonMember = !plan; // null
    const quotaReached = count >= 3;
    const promoActive = promoUntil > now;

    setVisible(isNonMember && (quotaReached || promoActive));
  }, []);

  // Écoute d’un évent éventuel : quand le 3e message vient d’être consommé,
  // l’app courante peut émettre `ob:interaction-limit-reached`
  // pour afficher immédiatement la bannière et la marquer jusqu’à minuit.
  useEffect(() => {
    const onLimit = () => {
      writeLS(LS_KEYS.PROMO_UNTIL, endOfTodayTs());
      setVisible(true);
    };
    window.addEventListener("ob:interaction-limit-reached", onLimit);
    return () => window.removeEventListener("ob:interaction-limit-reached", onLimit);
  }, []);

  if (!visible) return null;

  // Direction RTL pour l’arabe
  const dir = lang === "ar" ? "rtl" : "ltr";
  const align = lang === "ar" ? "text-right" : "text-left";

  function openActivate() {
    // ouvre la même modale que le bouton "Créer/Activer mon espace" du Menu
    window.dispatchEvent(new CustomEvent("ob:open-activate"));
  }

  return (
    <div
      dir={dir}
      className={`
        my-4 rounded-2xl border border-black/10 bg-white shadow-sm
        p-4 sm:p-5 text-black
      `}
    >
      <p className={`font-semibold mb-2 ${align}`}>{i18nPromo.TITLE}</p>
      <p className={`opacity-90 ${align}`}>{i18nPromo.LEAD_1}<br />{i18nPromo.LEAD_2}</p>

      <div className={`mt-3 ${align}`}>
        <p className="font-medium">{i18nPromo.PLANS_TITLE}</p>
        <ul className="opacity-90">
          <li>{i18nPromo.PLAN_A}</li>
          <li>{i18nPromo.PLAN_B}</li>
        </ul>
      </div>

      <p className={`mt-3 opacity-80 ${align}`}>{i18nPromo.OR}</p>

      <div className={`mt-3 ${align}`}>
        <p className="font-medium">{i18nPromo.WELCOME_1}</p>
        <p className="opacity-90">{i18nPromo.WELCOME_2}<br/>{i18nPromo.WELCOME_3}</p>
      </div>

      <div className={`mt-4 ${align === "text-right" ? "text-left" : "text-right"}`}>
        <button
          onClick={openActivate}
          className="
            inline-block px-5 py-2 rounded-xl border border-transparent
            bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400
            text-white shadow-sm hover:opacity-90 transition
          "
        >
          {i18nPromo.CTA}
        </button>
      </div>
    </div>
  );
}
