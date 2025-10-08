// components/Menu.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

/** ===================== Types ===================== */
type Plan = "subscription" | "one-month" | null;
type Lang = "fr" | "en" | "ar";
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

/** ===================== Utils ===================== */
const CONSENT_KEY = "oneboarding.rgpdConsent";
const HISTORY_KEY = "oneboarding.history";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}
function toast(msg: string) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText =
    "position:fixed;left:50%;transform:translateX(-50%);bottom:20px;" +
    "background:rgba(12,16,28,.92);color:#fff;padding:10px 14px;" +
    "border-radius:14px;border:1px solid rgba(255,255,255,.16);" +
    "z-index:100000;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25)";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1700);
}

/** ===================== i18n ===================== */
const I18N: Record<Lang, any> = {
  fr: {
    MENU: "Menu",
    SECTIONS: { OBAI: "OneBoarding AI", HIST: "Mon historique", LANG: "Ma langue" },
    OBAI: {
      CONNECT: "Se connecter",
      DISCONNECT: "Se déconnecter",
      ACTIVATE: "Activer mon espace",
      DEACTIVATE: "Désactiver mon espace",
      STATUS: "Mon statut",
      SPACE: "Espace",
      CONN: "Connexion",
      PLAN: "Formule",
      ACTIVE: "actif",
      INACTIVE: "inactif",
      ONLINE: "en ligne",
      OFFLINE: "hors ligne",
      SUB: "abonnement",
      ONEOFF: "accès libre",
      NONE: "—",
    },
    HIST: {
      SHARE: "Partager mon historique",
      SAVE: "Sauvegarder mon historique",
      CLEAR: "Supprimer mon historique",
      CONFIRM_TITLE: "Effacer l’historique ?",
      CONFIRM_DESC:
        "Cette action est irréversible. Pensez à sauvegarder ce qui vous est utile avant d’effacer.",
      CANCEL: "Plus tard",
      OK: "Effacer",
      SAVED: "Historique sauvegardé.",
      EMPTY: "Aucun message à partager.",
      COPIED: "Texte copié.",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },
  },
  en: {
    MENU: "Menu",
    SECTIONS: { OBAI: "OneBoarding AI", HIST: "My history", LANG: "My language" },
    OBAI: {
      CONNECT: "Sign in",
      DISCONNECT: "Sign out",
      ACTIVATE: "Activate my space",
      DEACTIVATE: "Deactivate my space",
      STATUS: "My status",
      SPACE: "Space",
      CONN: "Connection",
      PLAN: "Plan",
      ACTIVE: "active",
      INACTIVE: "inactive",
      ONLINE: "online",
      OFFLINE: "offline",
      SUB: "subscription",
      ONEOFF: "one-month",
      NONE: "—",
    },
    HIST: {
      SHARE: "Share my history",
      SAVE: "Save my history",
      CLEAR: "Delete my history",
      CONFIRM_TITLE: "Delete history?",
      CONFIRM_DESC:
        "This action is irreversible. Save anything important before deleting.",
      CANCEL: "Later",
      OK: "Delete",
      SAVED: "History saved.",
      EMPTY: "No messages to share.",
      COPIED: "Text copied.",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },
  },
  ar: {
    MENU: "القائمة",
    SECTIONS: { OBAI: "ون بوردنغ AI", HIST: "سِجِلّي", LANG: "لغتي" },
    OBAI: {
      CONNECT: "تسجيل الدخول",
      DISCONNECT: "تسجيل الخروج",
      ACTIVATE: "تفعيل مساحتي",
      DEACTIVATE: "إيقاف مساحتي",
      STATUS: "حالتي",
      SPACE: "المساحة",
      CONN: "الاتصال",
      PLAN: "الخطة",
      ACTIVE: "نشط",
      INACTIVE: "غير نشط",
      ONLINE: "متصل",
      OFFLINE: "غير متصل",
      SUB: "اشتراك",
      ONEOFF: "وصول لشهر",
      NONE: "—",
    },
    HIST: {
      SHARE: "مشاركة السجل",
      SAVE: "حفظ السجل",
      CLEAR: "حذف السجل",
      CONFIRM_TITLE: "حذف السجل؟",
      CONFIRM_DESC:
        "هذا الإجراء لا رجعة فيه. احفظ ما تحتاجه قبل الحذف.",
      CANCEL: "لاحقًا",
      OK: "حذف",
      SAVED: "تم حفظ السجل.",
      EMPTY: "لا توجد رسائل للمشاركة.",
      COPIED: "تم النسخ.",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },
  },
};

/** ===================== Composant principal ===================== */
export default function Menu() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");

  // lecture localStorage
  const [connected, setConnected] = useState(false);
  const [spaceActive, setSpaceActive] = useState(false);
  const [plan, setPlan] = useState<Plan>(null);

  // accordéons
  const [showObai, setShowObai] = useState(true);
  const [showHist, setShowHist] = useState(false);
  const [showLang, setShowLang] = useState(false);

  // confirm modal (suppr historique)
  const [askClear, setAskClear] = useState(false);

  // i18n
  const t = useMemo(() => I18N[lang], [lang]);

  useEffect(() => {
    try {
      setLang((localStorage.getItem("oneboarding.lang") as Lang) || "fr");
      const conn = localStorage.getItem("ob_connected");
      setConnected(conn === "1");
      const act = localStorage.getItem("oneboarding.spaceActive");
      setSpaceActive(act === "1" || act === "true");
      setPlan((localStorage.getItem("oneboarding.plan") as Plan) || null);
    } catch {}
  }, []);

  // helpers d’évènements (OTP / Activation / Paiement)
  function emit(name: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /** ============ Bouton principal ============ */
  function onOpenClick() {
    // si pas de consentement, ouvrir d’abord le modal légal (et ne pas ouvrir le menu)
    const consent = typeof localStorage !== "undefined" && localStorage.getItem(CONSENT_KEY) === "1";
    if (!consent) {
      window.dispatchEvent(new CustomEvent("ob:ensure-consent"));
      return;
    }
    setOpen(true);
  }

  /** ============ Actions OneBoarding AI ============ */
  function handleConnect() {
    emit("ob:open-connect");
  }
  function handleDisconnect() {
    emit("ob:open-disconnect");
    try { localStorage.setItem("ob_connected", "0"); } catch {}
    setConnected(false);
  }
  function handleActivate() {
    emit("ob:open-activate");
  }
  function handleDeactivate() {
    try {
      localStorage.setItem("oneboarding.spaceActive", "false");
      localStorage.removeItem("oneboarding.plan");
    } catch {}
    setSpaceActive(false);
    setPlan(null);
    emit("ob:space-deactivated");
    toast("Espace désactivé.");
  }

  /** ============ Historique ============ */
  function shareHistory() {
    const msgs = readJSON<Item[]>(HISTORY_KEY, []);
    if (!msgs.length) return toast(t.HIST.EMPTY);
    const blob = new Blob(
      [
        msgs
          .slice()
          .reverse()
          .map((m) => {
            const who = m.role === "user" ? "Vous" : m.role === "assistant" ? "IA" : "Erreur";
            return `${who} • ${new Date(m.time).toLocaleString()}\n${m.text}`;
          })
          .join("\n\n— — —\n\n"),
      ],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    if (navigator.share) {
      // partage direct texte si possible
      blob.text().then((text) => navigator.share({ title: "OneBoarding AI — Historique", text }).catch(() => {}));
    } else {
      // fallback: téléchargement .txt
      const a = document.createElement("a");
      a.href = url;
      a.download = `oneboarding-history-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    URL.revokeObjectURL(url);
  }

  function saveHistory() {
    const msgs = readJSON<Item[]>(HISTORY_KEY, []);
    const blob = new Blob([JSON.stringify(msgs, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oneboarding-history-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(t.HIST.SAVED);
  }

  function reallyClearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
    // notifier la page pour rafraîchir l’UI de la conversation
    window.dispatchEvent(new CustomEvent("ob:history-cleared"));
    toast("Historique supprimé.");
    setAskClear(false);
  }

  /** ============ Langue ============ */
  function setLangAndPersist(l: Lang) {
    setLang(l);
    try { localStorage.setItem("oneboarding.lang", l); } catch {}
    emit("ob:lang-changed", { lang: l });
  }

  /** ============ UI ============ */
  return (
    <>
      {/* Bouton flottant principal — GRAND + futuriste */}
      <div className="fixed inset-x-0 bottom-20 z-[55] flex justify-center pointer-events-none sm:bottom-8">
        <button
          onClick={onOpenClick}
          className="pointer-events-auto px-7 py-4 text-lg rounded-2xl font-semibold
                     text-white shadow-[0_10px_30px_rgba(0,0,0,.25)]
                     border border-white/20
                     bg-[radial-gradient(120%_120%_at_0%_0%,#22d3ee_0%,#0284c7_60%,#0ea5e9_100%)]
                     hover:brightness-110 active:scale-[.99] transition"
          aria-label={t.MENU}
        >
          {t.MENU}
        </button>
      </div>

      {/* Panneau natif */}
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/15 bg-[rgba(12,16,28,.92)] p-5 shadow-2xl text-white">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">OneBoarding AI</h2>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Statut — section standalone (hors boutons) */}
            <section className="mb-4 rounded-xl border border-white/12 bg-white/5 p-3">
              <p className="text-sm font-medium mb-1">{t.OBAI.STATUS}</p>
              <div className="text-xs opacity-90 leading-6">
                <div>{t.OBAI.SPACE}: <b>{spaceActive ? t.OBAI.ACTIVE : t.OBAI.INACTIVE}</b></div>
                <div>{t.OBAI.CONN}: <b>{connected ? t.OBAI.ONLINE : t.OBAI.OFFLINE}</b></div>
                <div>
                  {t.OBAI.PLAN}:{" "}
                  <b>{plan === "subscription" ? t.OBAI.SUB : plan === "one-month" ? t.OBAI.ONEOFF : t.OBAI.NONE}</b>
                </div>
              </div>
            </section>

            {/* 1 — OneBoarding AI */}
            <Accordion title={t.SECTIONS.OBAI}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {!connected ? (
                  <Btn onClick={handleConnect}>{t.OBAI.CONNECT}</Btn>
                ) : (
                  <Btn onClick={handleDisconnect}>{t.OBAI.DISCONNECT}</Btn>
                )}
                {!spaceActive ? (
                  <Btn accent onClick={handleActivate}>{t.OBAI.ACTIVATE}</Btn>
                ) : (
                  <Btn danger onClick={handleDeactivate}>{t.OBAI.DEACTIVATE}</Btn>
                )}
              </div>
            </Accordion>

            {/* 2 — Historique */}
            <Accordion title={t.SECTIONS.HIST}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Btn onClick={shareHistory}>{t.HIST.SHARE}</Btn>
                <Btn onClick={saveHistory}>{t.HIST.SAVE}</Btn>
                <Btn danger onClick={() => setAskClear(true)} className="sm:col-span-2">
                  {t.HIST.CLEAR}
                </Btn>
              </div>
            </Accordion>

            {/* 3 — Langue */}
            <Accordion title={t.SECTIONS.LANG}>
              <div className="grid grid-cols-3 gap-2">
                <Toggle active={lang === "fr"} onClick={() => setLangAndPersist("fr")}>{t.LANG.FR}</Toggle>
                <Toggle active={lang === "en"} onClick={() => setLangAndPersist("en")}>{t.LANG.EN}</Toggle>
                <Toggle active={lang === "ar"} onClick={() => setLangAndPersist("ar")}>{t.LANG.AR}</Toggle>
              </div>
            </Accordion>

            {/* Confirm clear */}
            {askClear && (
              <div className="fixed inset-0 z-[90] grid place-items-center" role="dialog" aria-modal="true">
                <div className="absolute inset-0 bg-black/55" onClick={() => setAskClear(false)} />
                <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-white/15 bg-[rgba(12,16,28,.96)] p-5 text-white shadow-xl">
                  <h3 className="text-base font-semibold mb-2">{t.HIST.CONFIRM_TITLE}</h3>
                  <p className="text-sm opacity-90 mb-4">{t.HIST.CONFIRM_DESC}</p>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setAskClear(false)} className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15">
                      {t.HIST.CANCEL}
                    </button>
                    <button onClick={reallyClearHistory} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold">
                      {t.HIST.OK}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** ===================== Sous-composants ===================== */
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-4 py-3"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-lg leading-none">{open ? "–" : "+"}</span>
      </button>
      {open && <div className="pt-3">{children}</div>}
    </section>
  );
}

function Btn({
  children, onClick, className = "", accent, danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  const base = "px-4 py-2 rounded-xl border transition text-sm font-medium text-white";
  const tone = danger
    ? "border-red-400/30 bg-red-500/15 hover:bg-red-500/25"
    : accent
    ? "border-cyan-300/30 bg-cyan-400/15 hover:bg-cyan-400/25"
    : "border-white/15 bg-white/10 hover:bg-white/15";
  return (
    <button onClick={onClick} className={`${base} ${tone} ${className}`}>{children}</button>
  );
}

function Toggle({
  children, active, onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-sm ${
        active ? "bg-white/20 border-white/30 text-white" : "bg-white/8 border-white/15 text-white/90 hover:bg-white/14"
      }`}
    >
      {children}
    </button>
  );
}
