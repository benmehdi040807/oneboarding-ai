// components/Menu.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** ===================== Types ===================== */
type Plan = "subscription" | "one-month" | null;
type Lang = "fr" | "en" | "ar";
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

/** ===================== Constantes ===================== */
const CONSENT_KEY = "oneboarding.legalConsent.v1";

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

// Copie robuste (mobile-friendly)
function copy(text: string) {
  // 1) API moderne si dispo
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => fallbackCopy(text));
  }
  // 2) Fallback DOM
  return Promise.resolve(fallbackCopy(text));
}
function fallbackCopy(text: string) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    ta.setAttribute("readonly", "true");
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy"); // supporté largement sur Android
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
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
    SECTIONS: { ACC: "Mon compte", HIST: "Mon historique", LANG: "Ma langue", LEGAL: "CGU / Privacy" },
    ACC: {
      CONNECT: "Se connecter",
      DISCONNECT: "Se déconnecter",
      ACTIVATE: "Activer mon espace",
      DEACTIVATE: "Désactiver mon espace",
      STATUS_BTN: "Statut du compte",
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
      SAVE: "Exporter mon historique (.txt)",
      CLEAR: "Supprimer mon historique",
      SAVED: "Historique exporté (fichier .txt téléchargé).",
      COPIED: "Texte copié.",
      EMPTY: "Aucun message à partager.",
      CONFIRM_TITLE: "Effacer l’historique ?",
      CONFIRM_MSG:
        "Cette action est irréversible. Pense à partager ou sauvegarder ton contenu si tu veux le conserver.",
      CANCEL: "Annuler",
      CONFIRM: "Effacer",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },
    LEGAL: {
      OPEN: "Lire et accepter",
      READ: "Lire",
      ACCEPT: "J’accepte",
      LATER: "Plus tard",
      TITLE: "Informations légales",
      CONSENT_NOTE: "En cliquant sur « J’accepte », vous confirmez avoir pris connaissance de ces informations.",
      CONSENTED: "Consentement enregistré.",
      NOT_CONSENTED: "Consentement non enregistré.",
      CLOSE: "Fermer",
    },
  },

  en: {
    MENU: "Menu",
    SECTIONS: { ACC: "My account", HIST: "My history", LANG: "My language", LEGAL: "TOS / Privacy" },
    ACC: {
      CONNECT: "Sign in",
      DISCONNECT: "Sign out",
      ACTIVATE: "Activate my space",
      DEACTIVATE: "Deactivate my space",
      STATUS_BTN: "Account status",
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
      SAVE: "Export my history (.txt)",
      CLEAR: "Delete my history",
      SAVED: "History exported (.txt downloaded).",
      COPIED: "Text copied.",
      EMPTY: "No messages to share.",
      CONFIRM_TITLE: "Clear history?",
      CONFIRM_MSG:
        "This action is irreversible. Consider sharing or saving if you want to keep your content.",
      CANCEL: "Cancel",
      CONFIRM: "Delete",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },
    LEGAL: {
      OPEN: "Read & accept",
      READ: "Read",
      ACCEPT: "Accept",
      LATER: "Later",
      TITLE: "Legal information",
      CONSENT_NOTE: "By clicking “Accept”, you acknowledge having read this information.",
      CONSENTED: "Consent recorded.",
      NOT_CONSENTED: "Consent not recorded.",
      CLOSE: "Close",
    },
  },

  ar: {
    MENU: "القائمة",
    SECTIONS: { ACC: "حسابي", HIST: "سِجِلّي", LANG: "لغتي", LEGAL: "الشروط / الخصوصية" },
    ACC: {
      CONNECT: "تسجيل الدخول",
      DISCONNECT: "تسجيل الخروج",
      ACTIVATE: "تفعيل مساحتي",
      DEACTIVATE: "إيقاف مساحتي",
      STATUS_BTN: "حالة الحساب",
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
      SAVE: "تصدير السجل (.txt)",
      CLEAR: "حذف السجل",
      SAVED: "تم تصدير السجل (تم تنزيل ملف .txt).",
      COPIED: "تم النسخ.",
      EMPTY: "لا توجد رسائل للمشاركة.",
      CONFIRM_TITLE: "حذف السجل؟",
      CONFIRM_MSG: "هذه العملية لا رجوع فيها. فكّر في المشاركة أو الحفظ قبل الحذف.",
      CANCEL: "إلغاء",
      CONFIRM: "حذف",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },
    LEGAL: {
      OPEN: "قراءة والموافقة",
      READ: "قراءة",
      ACCEPT: "موافقة",
      LATER: "لاحقاً",
      TITLE: "معلومات قانونية",
      CONSENT_NOTE: "بالنقر على «موافقة» فأنت تقر بأنك اطّلعت على هذه المعلومات.",
      CONSENTED: "تم تسجيل الموافقة.",
      NOT_CONSENTED: "الموافقة غير مسجّلة.",
      CLOSE: "إغلاق",
    },
  },
};

/** ===================== Composant principal ===================== */
export default function Menu() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");

  // état lecture
  const [connected, setConnected] = useState<boolean>(false);
  const [spaceActive, setSpaceActive] = useState<boolean>(false);
  const [plan, setPlan] = useState<Plan>(null);
  const [history, setHistory] = useState<Item[]>([]);

  // sections repliables — FERMÉES par défaut
  const [showAcc, setShowAcc] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  // sous-états
  const [showStatus, setShowStatus] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmRef = useRef<HTMLDivElement | null>(null);

  // modal légal
  const [legalOpen, setLegalOpen] = useState(false);
  const [consented, setConsented] = useState(false);

  // sync unifiée depuis le storage
  function syncFromStorage() {
    try {
      const L = (localStorage.getItem("oneboarding.lang") as Lang) || "fr";
      setLang(L);
      setConnected(localStorage.getItem("ob_connected") === "1");
      const act = localStorage.getItem("oneboarding.spaceActive");
      setSpaceActive(act === "1" || act === "true");
      setPlan((localStorage.getItem("oneboarding.plan") as Plan) || null);
      setHistory(readJSON<Item[]>("oneboarding.history", []));
      setConsented(localStorage.getItem(CONSENT_KEY) === "1");
    } catch {}
  }

  // init
  useEffect(() => {
    syncFromStorage();
  }, []);

  // i18n
  const t = useMemo(() => I18N[lang], [lang]);

  // helpers d’évènements
  function emit(name: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /** ============ Actions compte ============ */
  function handleConnect() {
    emit("ob:open-connect");
  }
  function handleDisconnect() {
    emit("ob:open-disconnect");
    try {
      localStorage.setItem("ob_connected", "0");
    } catch {}
    writeJSON("oneboarding.connected", false);
    setConnected(false);
    emit("ob:disconnected");
  }
  function handleActivate() {
    emit("ob:open-activate");
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
        const who = m.role === "user" ? (lang === "fr" ? "Vous" : lang === "en" ? "You" : "أنت") : m.role === "assistant" ? (lang === "fr" ? "IA" : "AI") : (lang === "fr" ? "Erreur" : lang === "en" ? "Error" : "خطأ");
        return `${who} • ${new Date(m.time).toLocaleString()}\n${m.text}`;
      })
      .join("\n\n— — —\n\n");

    const title = "OneBoarding AI — Historique";
    try {
      const ok = await copy(full);
      if (ok) toast(t.HIST.COPIED);
    } catch {}
  }

  // Export .txt lisible (au lieu de .json)
  function saveHistory() {
    const msgs = readJSON<Item[]>("oneboarding.history", []);
    // fichier texte lisible
    const body = msgs.length
      ? msgs
          .map((m, i) => {
            const who = m.role === "user" ? (lang === "fr" ? "Vous" : lang === "en" ? "You" : "أنت") : m.role === "assistant" ? (lang === "fr" ? "IA" : "AI") : (lang === "fr" ? "Erreur" : lang === "en" ? "Error" : "خطأ");
            return `#${i + 1} — ${who} — ${new Date(m.time).toLocaleString()}\n${m.text}`;
          })
          .join("\n\n------------------------------\n\n")
      : (lang === "fr" ? "Aucun message." : lang === "en" ? "No messages." : "لا رسائل.");
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oneboarding-history-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(t.HIST.SAVED);
  }

  function clearHistoryConfirmed() {
    writeJSON("oneboarding.history", []);
    setHistory([]);
    emit("ob:history-cleared");
    setConfirmOpen(false);
    toast("Historique supprimé.");
  }

  /** ============ Langue ============ */
  function setLangAndPersist(l: Lang) {
    setLang(l);
    localStorage.setItem("oneboarding.lang", l);
    emit("ob:lang-changed", { lang: l });
  }

  /** ============ Consentement légal ============ */
  function openLegalModal() {
    setLegalOpen(true);
  }
  function acceptLegal() {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {}
    setConsented(true);
    setLegalOpen(false);
    toast(lang === "fr" ? "Merci, consentement enregistré." : lang === "en" ? "Thanks, consent recorded." : "شكرًا، تم تسجيل الموافقة.");
    emit("ob:legal-accepted");
  }

  const legalBtnLabel = consented ? t.LEGAL.READ : t.LEGAL.OPEN;

  /** ============ Navigation / bouton Retour ============ */
  useEffect(() => {
    if (open) {
      try {
        window.history.pushState({ ob: "menu" }, "");
      } catch {}
    }
  }, [open]);

  useEffect(() => {
    if (legalOpen) {
      try {
        window.history.pushState({ ob: "legal" }, "");
      } catch {}
    }
  }, [legalOpen]);

  useEffect(() => {
    const onPopState = () => {
      if (legalOpen) {
        setLegalOpen(false);
        return;
      }
      if (open) {
        setOpen(false);
        return;
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open, legalOpen]);

  // 🔄 Se resynchroniser quand d'autres parties de l'app émettent des événements
  useEffect(() => {
    const handler = () => syncFromStorage();

    const events = [
      "ob:auth-changed",
      "ob:connected",
      "ob:disconnected",
      "ob:space-activated",
      "ob:space-deactivated",
      "ob:plan-changed",
      "ob:history-cleared",
      "ob:history-updated",
      "ob:history-appended",
      "ob:lang-changed",
      "ob:legal-accepted",
    ] as const;

    events.forEach((e) => window.addEventListener(e, handler as EventListener));
    // NB: l’event 'storage' ne se déclenche pas dans le même onglet, mais on le garde si jamais
    window.addEventListener("storage", handler as EventListener);

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler as EventListener));
      window.removeEventListener("storage", handler as EventListener);
    };
  }, []);

  // Helpers de fermeture (consomment l’état historique)
  function closeMenu() {
    try {
      window.history.back();
    } catch {
      setOpen(false);
    }
  }
  function closeLegal() {
    try {
      window.history.back();
    } catch {
      setLegalOpen(false);
    }
  }

  /** ============ Rendu ============ */
  return (
    <>
      {/* Bouton flottant principal — large + gradient + safe-area */}
      <div
        className="fixed inset-x-0 bottom-0 z-[55] flex justify-center pointer-events-none"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <button
          onClick={() => {
            setOpen(true);
            if (!consented) setTimeout(() => setLegalOpen(true), 120);
          }}
          className="
            pointer-events-auto min-w-[260px] px-8 py-5 text-xl rounded-3xl font-semibold shadow-2xl border
            border-[rgba(255,255,255,0.18)]
            bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600
            hover:from-cyan-300 hover:via-sky-400 hover:to-blue-500
            text-white tracking-wide drop-shadow-[0_0_30px_rgba(56,189,248,.35)]
            active:scale-[.985] menu-float
          "
          aria-label={t.MENU}
        >
          {t.MENU}
        </button>
      </div>

      {/* Panneau natif */}
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeMenu} />
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{t.MENU}</h2>
              <button
                onClick={closeMenu}
                className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* === Sections (toutes fermées par défaut) === */}
            <Accordion title={t.SECTIONS.ACC} open={showAcc} onToggle={() => setShowAcc((v) => !v)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {!connected ? (
                  <Btn onClick={handleConnect}>{t.ACC.CONNECT}</Btn>
                ) : (
                  <Btn onClick={handleDisconnect}>{t.ACC.DISCONNECT}</Btn>
                )}
                {!spaceActive ? (
                  <Btn accent onClick={handleActivate}>{t.ACC.ACTIVATE}</Btn>
                ) : (
                  <Btn danger onClick={handleDeactivate}>{t.ACC.DEACTIVATE}</Btn>
                )}
                <Btn className="sm:col-span-2" onClick={() => setShowStatus((v) => !v)}>
                  {t.ACC.STATUS_BTN} {showStatus ? "—" : "+"}
                </Btn>
                {showStatus && (
                  <div className="sm:col-span-2 rounded-xl border border-white/12 bg-white/5 p-3">
                    <p className="text-sm font-medium mb-1">{t.ACC.STATUS}</p>
                    <div className="text-xs opacity-90 leading-6">
                      <div>{t.ACC.SPACE}: <b>{spaceActive ? t.ACC.ACTIVE : t.ACC.INACTIVE}</b></div>
                      <div>{t.ACC.CONN}: <b>{connected ? t.ACC.ONLINE : t.ACC.OFFLINE}</b></div>
                      <div>{t.ACC.PLAN}: <b>{plan === "subscription" ? t.ACC.SUB : plan === "one-month" ? t.ACC.ONEOFF : t.ACC.NONE}</b></div>
                    </div>
                  </div>
                )}
              </div>
            </Accordion>

            <Accordion title={t.SECTIONS.HIST} open={showHist} onToggle={() => setShowHist((v) => !v)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Btn onClick={shareHistory}>{t.HIST.SHARE}</Btn>
                <Btn onClick={saveHistory}>{t.HIST.SAVE}</Btn>
                <Btn danger onClick={() => setConfirmOpen(true)} className="sm:col-span-2">
                  {t.HIST.CLEAR}
                </Btn>
              </div>
            </Accordion>

            <Accordion title={t.SECTIONS.LANG} open={showLang} onToggle={() => setShowLang((v) => !v)}>
              <div className="grid grid-cols-3 gap-2">
                <Toggle active={lang === "fr"} onClick={() => setLangAndPersist("fr")}>{I18N.fr.LANG.FR}</Toggle>
                <Toggle active={lang === "en"} onClick={() => setLangAndPersist("en")}>{I18N.en.LANG.EN}</Toggle>
                <Toggle active={lang === "ar"} onClick={() => setLangAndPersist("ar")}>{I18N.ar.LANG.AR}</Toggle>
              </div>
            </Accordion>

            {/* CGU / Privacy */}
            <Accordion title={t.SECTIONS.LEGAL} open={showLegal} onToggle={() => setShowLegal((v) => !v)}>
              <div className="grid grid-cols-1 gap-2">
                <Btn onClick={openLegalModal}>{legalBtnLabel}</Btn>
              </div>
              <p className="text-xs opacity-80 mt-3">
                {consented ? t.LEGAL.CONSENTED : t.LEGAL.NOT_CONSENTED}
              </p>
            </Accordion>
          </div>
        </div>
      )}

      {/* Modal de confirmation (interne au Menu) */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setConfirmOpen(false)} />
          <div
            ref={confirmRef}
            className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white"
          >
            <h2 className="text-lg font-semibold mb-2">{t.HIST.CONFIRM_TITLE}</h2>
            <p className="text-sm opacity-90 mb-4">{t.HIST.CONFIRM_MSG}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white"
              >
                {t.HIST.CANCEL}
              </button>
              <button
                onClick={clearHistoryConfirmed}
                className="px-4 py-2 rounded-2xl bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]"
              >
                {t.HIST.CONFIRM}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal légal — contenu exact via iframe de /legal?lang=xx&embed=1 */}
      {legalOpen && (
        <div className="fixed inset-0 z-[110] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeLegal} />
          <div className="relative mx-4 w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-5 shadow-2xl text-black">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold">{t.LEGAL.TITLE}</h2>
              <button
                onClick={closeLegal}
                className="px-3 py-1.5 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10"
                aria-label={t.LEGAL.CLOSE}
              >
                ✕
              </button>
            </div>

            <div className="rounded-lg overflow-hidden border border-black/10" style={{ height: "70vh" }}>
              <iframe
                title="CGU / Privacy"
                src={`/legal?lang=${lang}&embed=1`}
                style={{ width: "100%", height: "100%", border: "0" }}
              />
            </div>

            <p className="text-xs opacity-70 mt-3">{t.LEGAL.CONSENT_NOTE}</p>

            <div className="mt-3 flex items-center justify-end gap-2">
              {!consented ? (
                <>
                  <button
                    onClick={closeLegal}
                    className="px-4 py-2 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10"
                  >
                    {t.LEGAL.LATER}
                  </button>
                  <button
                    onClick={acceptLegal}
                    className="px-4 py-2 rounded-xl bg-black text-white hover:bg-black/90"
                  >
                    {t.LEGAL.ACCEPT}
                  </button>
                </>
              ) : (
                <button
                  onClick={closeLegal}
                  className="px-4 py-2 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10"
                >
                  {t.LEGAL.CLOSE}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* styles locaux pour le bouton principal */}
      <style jsx global>{`
        @keyframes ob-float { 0%{transform:translateY(0)} 50%{transform:translateY(-2px)} 100%{transform:translateY(0)} }
        .menu-float:focus-visible { animation: ob-float .9s ease-in-out; outline: none; }
      `}</style>
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
