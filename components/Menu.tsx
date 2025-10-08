"use client";

import { useEffect, useMemo, useState } from "react";

/** ===================== Types ===================== */
type Plan = "subscription" | "one-month" | null;
type Lang = "fr" | "en" | "ar";
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

/** ===================== Utils ===================== */
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
function copy(text: string) {
  try {
    navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
function toast(msg: string) {
  // petit toast natif minimal (cssText évite le typage CSSStyleDeclaration)
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

/** ===================== i18n (inchangé) ===================== */
const I18N: Record<Lang, any> = {
  fr: {
    MENU: "Menu",
    SECTIONS: { OBAI: "OneBoarding AI", HIST: "Mon historique", LANG: "Ma langue", COMING: "À venir" },
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
      SAVED: "Historique sauvegardé (fichier téléchargé).",
      COPIED: "Texte copié.",
      EMPTY: "Aucun message à partager.",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },
    COMING: { O2: "Génération II — One IA (bientôt)", O3: "Génération III — Mirror IA (bientôt)", OK: "OK" },
  },
  en: {
    MENU: "Menu",
    SECTIONS: { OBAI: "OneBoarding AI", HIST: "My history", LANG: "My language", COMING: "Coming" },
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
      SAVED: "History saved (file downloaded).",
      COPIED: "Text copied.",
      EMPTY: "No messages to share.",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },
    COMING: { O2: "Generation II — One IA (soon)", O3: "Generation III — Mirror IA (soon)", OK: "OK" },
  },
  ar: {
    MENU: "القائمة",
    SECTIONS: { OBAI: "ون بوردنغ AI", HIST: "سِجِلّي", LANG: "لغتي", COMING: "قريباً" },
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
      SAVED: "تم حفظ السجل (تم تنزيل الملف).",
      COPIED: "تم النسخ.",
      EMPTY: "لا توجد رسائل للمشاركة.",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },
    COMING: { O2: "الجيل الثاني — One IA (قريباً)", O3: "الجيل الثالث — Mirror IA (قريباً)", OK: "حسناً" },
  },
};

/** ===================== Composant principal ===================== */
export default function Menu() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");

  // état “lecture” (localStorage comme vérité UI)
  const [connected, setConnected] = useState<boolean>(false);
  const [spaceActive, setSpaceActive] = useState<boolean>(false);
  const [plan, setPlan] = useState<Plan>(null);
  const [history, setHistory] = useState<Item[]>([]);

  // sections repliables
  const [showObai, setShowObai] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [showLang, setShowLang] = useState(false);

  // init depuis localStorage
  useEffect(() => {
    try {
      const L = (localStorage.getItem("oneboarding.lang") as Lang) || "fr";
      setLang(L);

      // ✅ cohérent avec le reste de l'app (OTP)
      setConnected(localStorage.getItem("ob_connected") === "1");

      const act = localStorage.getItem("oneboarding.spaceActive");
      setSpaceActive(act === "1" || act === "true");

      setPlan((localStorage.getItem("oneboarding.plan") as Plan) || null);
      setHistory(readJSON<Item[]>("oneboarding.history", []));
    } catch {}
  }, []);

  // i18n
  const t = useMemo(() => I18N[lang], [lang]);

  // helpers d’évènements pour brancher OTP / Paiement ailleurs
  function emit(name: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /** ============ Actions OneBoarding AI ============ */
  function handleConnect() {
    emit("ob:open-connect"); // ex: ouvrir CodeAccessDialog
  }
  function handleDisconnect() {
    emit("ob:open-disconnect");
    try { localStorage.setItem("ob_connected", "0"); } catch {}
    writeJSON("oneboarding.connected", false);
    setConnected(false);
  }
  function handleActivate() {
    emit("ob:open-activate"); // ex: ouvrir SubscribeModal -> CodeAccessDialog -> Payment
  }
  function handleDeactivate() {
    writeJSON("oneboarding.spaceActive", false);
    writeJSON("oneboarding.plan", null);
    setSpaceActive(false);
    setPlan(null);
    emit("ob:space-deactivated");
    toast("Espace désactivé.");
  }

  /** ============ Historique ============ */
  async function shareHistory() {
    const msgs = readJSON<Item[]>("oneboarding.history", []);
    if (!msgs.length) {
      toast(t.HIST.EMPTY);
      return;
    }
    const full = msgs
      .slice()
      .reverse()
      .map((m) => {
        const who = m.role === "user" ? "Vous" : m.role === "assistant" ? "IA" : "Erreur";
        return `${who} • ${new Date(m.time).toLocaleString()}\n${m.text}`;
      })
      .join("\n\n— — —\n\n");

    const title = "OneBoarding AI — Historique";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: full });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(full);
        toast(t.HIST.COPIED);
      } else {
        const ok = copy(full);
        if (ok) toast(t.HIST.COPIED);
      }
    } catch {
      // annulé par l’utilisateur
    }
  }

  function saveHistory() {
    const msgs = readJSON<Item[]>("oneboarding.history", []);
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

  function clearHistory() {
    writeJSON("oneboarding.history", []);
    setHistory([]);
    toast("Historique supprimé.");
  }

  /** ============ Langue ============ */
  function setLangAndPersist(l: Lang) {
    setLang(l);
    localStorage.setItem("oneboarding.lang", l);
    emit("ob:lang-changed", { lang: l });
  }

  /** ============ Rendu ============ */
  return (
    <>
      {/* Bouton flottant principal — GRAND, turquoise, très visible */}
      <div className="fixed inset-x-0 bottom-6 z-[55] flex justify-center pointer-events-none">
        <button
          onClick={() => setOpen(true)}
          className="
            pointer-events-auto px-6 py-4 text-lg rounded-2xl font-semibold shadow-xl border
            border-[rgba(255,255,255,0.18)]
            bg-gradient-to-br from-cyan-400 to-sky-600
            hover:from-cyan-300 hover:to-sky-500
            text-white
          "
          aria-label={t.MENU}
        >
          {t.MENU}
        </button>
      </div>

      {/* Panneau natif */}
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white">
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

            {/* === 3 sections repliables === */}
            <Accordion
              title={t.SECTIONS.OBAI}
              open={showObai}
              onToggle={() => setShowObai((v) => !v)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Connexion */}
                {!connected ? (
                  <Btn onClick={handleConnect}>{t.OBAI.CONNECT}</Btn>
                ) : (
                  <Btn onClick={handleDisconnect}>{t.OBAI.DISCONNECT}</Btn>
                )}

                {/* Activation */}
                {!spaceActive ? (
                  <Btn accent onClick={handleActivate}>{t.OBAI.ACTIVATE}</Btn>
                ) : (
                  <Btn danger onClick={handleDeactivate}>{t.OBAI.DEACTIVATE}</Btn>
                )}

                {/* Statut (lecture) */}
                <div className="col-span-1 sm:col-span-2 rounded-xl border border-white/12 bg-white/5 p-3">
                  <p className="text-sm font-medium mb-1">{t.OBAI.STATUS}</p>
                  <div className="text-xs opacity-90 leading-6">
                    <div>
                      {t.OBAI.SPACE}: <b>{spaceActive ? t.OBAI.ACTIVE : t.OBAI.INACTIVE}</b>
                    </div>
                    <div>
                      {t.OBAI.CONN}: <b>{connected ? t.OBAI.ONLINE : t.OBAI.OFFLINE}</b>
                    </div>
                    <div>
                      {t.OBAI.PLAN}:{" "}
                      <b>
                        {plan === "subscription"
                          ? t.OBAI.SUB
                          : plan === "one-month"
                          ? t.OBAI.ONEOFF
                          : t.OBAI.NONE}
                      </b>
                    </div>
                  </div>
                </div>
              </div>
            </Accordion>

            <Accordion
              title={t.SECTIONS.HIST}
              open={showHist}
              onToggle={() => setShowHist((v) => !v)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Btn onClick={shareHistory}>{t.HIST.SHARE}</Btn>
                <Btn onClick={saveHistory}>{t.HIST.SAVE}</Btn>
                <Btn danger onClick={clearHistory} className="sm:col-span-2">
                  {t.HIST.CLEAR}
                </Btn>
              </div>
            </Accordion>

            <Accordion
              title={t.SECTIONS.LANG}
              open={showLang}
              onToggle={() => setShowLang((v) => !v)}
            >
              <div className="grid grid-cols-3 gap-2">
                <Toggle active={lang === "fr"} onClick={() => setLangAndPersist("fr")}>
                  {t.LANG.FR}
                </Toggle>
                <Toggle active={lang === "en"} onClick={() => setLangAndPersist("en")}>
                  {t.LANG.EN}
                </Toggle>
                <Toggle active={lang === "ar"} onClick={() => setLangAndPersist("ar")}>
                  {t.LANG.AR}
                </Toggle>
              </div>
            </Accordion>
          </div>
        </div>
      )}
    </>
  );
}

/** ===================== Sous-composants ===================== */
function Btn({
  children,
  onClick,
  className = "",
  accent,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  const base = "px-4 py-2 rounded-xl border transition text-sm font-medium text-white";
  const tone = danger
    ? "border-red-400/30 bg-red-500/15 hover:bg-red-500/22"
    : accent
    ? "border-cyan-300/30 bg-cyan-400/15 hover:bg-cyan-400/25"
    : "border-white/15 bg-white/10 hover:bg-white/15";
  return (
    <button onClick={onClick} className={`${base} ${tone} ${className}`}>
      {children}
    </button>
  );
}

function Toggle({
  children,
  active,
  onClick,
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

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-3">
      <button
        onClick={onToggle}
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
