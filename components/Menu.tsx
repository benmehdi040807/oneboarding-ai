// components/Menu.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { legalCopyFor, type Lang as LegalLang, type Section as LegalSection } from "@/lib/legal/copy";

/** ===================== Types ===================== */
type Plan = "subscription" | "one-month" | null;
type Lang = "fr" | "en" | "ar";
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

/** ===================== Constantes ===================== */
const CONSENT_KEY = "oneboarding.legalConsent.v1";
const CONSENT_AT_KEY = "oneboarding.legalConsentAt";

/** ===================== Utils ===================== */
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
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
      SAVE: "Sauvegarder mon historique",
      CLEAR: "Supprimer mon historique",
      SAVED: "Historique sauvegardé (fichier téléchargé).",
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
      OPEN: "Lire et approuver",
      READ: "Lire",
      ACCEPT: "Lu et approuvé",
      LATER: "Plus tard",
      TITLE: "Informations légales",
      CONSENT_NOTE:
        "En cliquant sur « Lu et approuvé », vous confirmez avoir pris connaissance de ces informations.",
      CONSENTED: "Consentement enregistré.",
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
      SAVE: "Save my history",
      CLEAR: "Delete my history",
      SAVED: "History saved (file downloaded).",
      COPIED: "Text copied.",
      EMPTY: "No messages to share.",
      CONFIRM_TITLE: "Clear history?",
      CONFIRM_MSG: "This action is irreversible. Consider sharing or saving if you want to keep your content.",
      CANCEL: "Cancel",
      CONFIRM: "Delete",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },
    LEGAL: {
      OPEN: "Read & approve",
      READ: "Read",
      ACCEPT: "Read & approved",
      LATER: "Later",
      TITLE: "Legal information",
      CONSENT_NOTE: "By clicking “Read & approved”, you acknowledge having read this information.",
      CONSENTED: "Consent recorded.",
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
      SAVE: "حفظ السجل",
      CLEAR: "حذف السجل",
      SAVED: "تم حفظ السجل (تم تنزيل الملف).",
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
      ACCEPT: "قُرِئ وتمت الموافقة",
      LATER: "لاحقاً",
      TITLE: "معلومات قانونية",
      CONSENT_NOTE: "بالنقر على «قُرِئ وتمت الموافقة» فأنت تُقرّ بأنك اطّلعت على هذه المعلومات.",
      CONSENTED: "تم تسجيل الموافقة.",
    },
  },
};

/** ===================== Composant principal ===================== */
export default function Menu() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");

  // état UI
  const [connected, setConnected] = useState(false);
  const [spaceActive, setSpaceActive] = useState(false);
  const [messages, setMessages] = useState<Item[]>([]);
  const [plan, setPlan] = useState<Plan>(null);

  // sections
  const [showAcc, setShowAcc] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  // autres
  const [showStatus, setShowStatus] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmRef = useRef<HTMLDivElement | null>(null);
  const [legalOpen, setLegalOpen] = useState(false);
  const [consented, setConsented] = useState(false);

  const menuPushedRef = useRef(false);
  const legalPushedRef = useRef(false);

  const t = useMemo(() => I18N[lang], [lang]);

  // init lecture locale (avec normalisation du plan)
  useEffect(() => {
    try {
      const L = (localStorage.getItem("oneboarding.lang") as Lang) || "fr";
      setLang(L);
      setConnected(localStorage.getItem("ob_connected") === "1");

      const act = localStorage.getItem("oneboarding.spaceActive");
      setSpaceActive(act === "1" || act === "true");

      const p = localStorage.getItem("oneboarding.plan");
      setPlan(p === "subscription" || p === "one-month" ? p : null);

      setMessages(readJSON<Item[]>("oneboarding.history", []));
      setConsented(localStorage.getItem(CONSENT_KEY) === "1");
    } catch {}
  }, []);

  // écoute cross-composants (venant des modales dédiées)
  useEffect(() => {
    const onAuthChanged = () => setConnected(localStorage.getItem("ob_connected") === "1");

    const onSetConnected = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (d?.phoneE164) try { localStorage.setItem("oneboarding.phoneE164", d.phoneE164); } catch {}
      setConnected(true);
    };

    const onSpaceActivated = () => {
      setSpaceActive(true);
      const p = localStorage.getItem("oneboarding.plan");
      setPlan(p === "subscription" || p === "one-month" ? p : null);
    };

    const onPlanChanged = () => {
      const p = localStorage.getItem("oneboarding.plan");
      setPlan(p === "subscription" || p === "one-month" ? p : null);
    };

    const onHistoryCleared = () => setMessages([]);
    const onConsentUpdated = () => setConsented(localStorage.getItem(CONSENT_KEY) === "1");

    // 🔥 NEW: Abonnement activé (retour PayPal)
    const onSubscriptionActive = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const newPlan: Plan = d?.plan === "one-month" ? "one-month" : "subscription";

      try {
        localStorage.setItem("ob_connected", "1");
        localStorage.setItem("oneboarding.spaceActive", "1");
        if (newPlan) localStorage.setItem("oneboarding.plan", newPlan);
        else localStorage.removeItem("oneboarding.plan");
        if (d?.phoneE164) localStorage.setItem("oneboarding.phoneE164", d.phoneE164);
      } catch {}

      setConnected(true);
      setSpaceActive(true);
      setPlan(newPlan);
    };

    // 🔥 NEW: Appareil autorisé (1 €)
    const onDeviceAuthorized = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      try {
        localStorage.setItem("ob_connected", "1");
        localStorage.setItem("oneboarding.spaceActive", "1");
        if (d?.phoneE164) localStorage.setItem("oneboarding.phoneE164", d.phoneE164);
      } catch {}
      setConnected(true);
      setSpaceActive(true);
    };

    window.addEventListener("ob:connected-changed", onAuthChanged);
    window.addEventListener("ob:set-connected", onSetConnected as EventListener);
    window.addEventListener("ob:space-activated", onSpaceActivated);
    window.addEventListener("ob:plan-changed", onPlanChanged);
    window.addEventListener("ob:history-cleared", onHistoryCleared);
    window.addEventListener("ob:consent-updated", onConsentUpdated);

    window.addEventListener("ob:subscription-active", onSubscriptionActive as EventListener);
    window.addEventListener("ob:device-authorized", onDeviceAuthorized as EventListener);

    return () => {
      window.removeEventListener("ob:connected-changed", onAuthChanged);
      window.removeEventListener("ob:set-connected", onSetConnected as EventListener);
      window.removeEventListener("ob:space-activated", onSpaceActivated);
      window.removeEventListener("ob:plan-changed", onPlanChanged);
      window.removeEventListener("ob:history-cleared", onHistoryCleared);
      window.removeEventListener("ob:consent-updated", onConsentUpdated);

      window.removeEventListener("ob:subscription-active", onSubscriptionActive as EventListener);
      window.removeEventListener("ob:device-authorized", onDeviceAuthorized as EventListener);
    };
  }, []);

  // helpers
  function emit(name: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /** ============ Actions compte (orchestration uniquement) ============ */
  function handleConnect() {
    window.dispatchEvent(new Event("ob:open-connect"));
  }
  function handleDisconnect() {
    try {
      localStorage.setItem("ob_connected", "0");
    } catch {}
    writeJSON("oneboarding.connected", false);
    setConnected(false);
    toast("Déconnecté.");
    emit("ob:connected-changed");
  }
  function handleActivate() {
    window.dispatchEvent(new Event("ob:open-activate"));
  }
  function handleDeactivate() {
    // Espace OFF, et on nettoie proprement la clé du plan
    try {
      localStorage.setItem("oneboarding.spaceActive", "0");
      localStorage.removeItem("oneboarding.plan");
    } catch {}
    setSpaceActive(false);
    setPlan(null);
    emit("ob:space-deactivated");
    toast("Espace désactivé.");
  }

  /** ============ Helpers Historique ============ */
  function footerLabel(l: Lang) {
    return l === "en" ? "My history" : l === "ar" ? "سِجِلّي" : "Mon historique";
  }
  function formatHistoryForText(msgs: Item[], l: Lang) {
    const body = msgs
      .slice()
      .reverse()
      .map((m) => {
        const who = m.role === "user" ? (l === "en" ? "You" : l === "ar" ? "أنت" : "Vous")
          : m.role === "assistant" ? (l === "en" ? "AI" : l === "ar" ? "الذكاء الاصطناعي" : "IA")
          : (l === "en" ? "Error" : l === "ar" ? "خطأ" : "Erreur");
        return `${who} • ${new Date(m.time).toLocaleString()}\n${m.text}`;
      })
      .join("\n\n— — —\n\n");

    const footer =
      `\n\n— — —\n` +
      `[OneBoarding AI ®\n^${footerLabel(l)}^\n oneboardingai.com\n]`;

    return `${body}${footer}`;
  }

  /** ============ Historique ============ */
  async function shareHistory() {
    const msgs = readJSON<Item[]>("oneboarding.history", []);
    if (!msgs.length) {
      toast(t.HIST.EMPTY);
      return;
    }

    const textToShare = formatHistoryForText(msgs, lang);
    const title = "OneBoarding AI — Historique";
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title, text: textToShare });
      } else {
        const ok = await copy(textToShare);
        if (ok) toast(t.HIST.COPIED);
      }
    } catch {}
  }

  function saveHistory() {
    const msgs = readJSON<Item[]>("oneboarding.history", []);
    if (!msgs.length) {
      toast(t.HIST.EMPTY);
      return;
    }
    const txt = formatHistoryForText(msgs, lang);
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
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
    setMessages([]);
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
    pushHistoryFor("legal");
  }
  function acceptLegal() {
    if (!consented) {
      try {
        localStorage.setItem(CONSENT_KEY, "1");
        localStorage.setItem(CONSENT_AT_KEY, String(Date.now()));
      } catch {}
      setConsented(true);
      window.dispatchEvent(new Event("ob:consent-updated"));
      toast("Merci, consentement enregistré.");
    }
    closeLegalModal();
  }

  /** ============ Navigation native (history) ============ */
  function pushHistoryFor(kind: "menu" | "legal") {
    const href = typeof window !== "undefined" ? window.location.href : undefined;
    if (kind === "menu" && !menuPushedRef.current) {
      window.history.pushState({ obPane: "menu" }, "", href);
      menuPushedRef.current = true;
    }
    if (kind === "legal" && !legalPushedRef.current) {
      window.history.pushState({ obPane: "legal" }, "", href);
      legalPushedRef.current = true;
    }
  }

  useEffect(() => {
    const onPop = () => {
      if (legalOpen) {
        setLegalOpen(false);
        legalPushedRef.current = false;
        return;
      }
      if (open) {
        setOpen(false);
        menuPushedRef.current = false;
        return;
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, legalOpen]);

  function openMenu() {
    setOpen(true);
    pushHistoryFor("menu");
  }
  function closeMenu() {
    if (legalOpen) closeLegalModal();
    if (menuPushedRef.current) {
      menuPushedRef.current = false;
      window.history.back();
    } else {
      setOpen(false);
    }
  }
  function closeLegalModal() {
    if (legalPushedRef.current) {
      legalPushedRef.current = false;
      window.history.back();
    } else {
      setLegalOpen(false);
    }
  }

  const legalBtnLabel = consented ? t.LEGAL.READ : t.LEGAL.OPEN;

  /** ============ Rendu ============ */
  return (
    <>
      {/* Bouton flottant principal (largeur x2) */}
      <div
        className="fixed inset-x-0 z-[55] flex justify-center pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 39px)" }}
      >
        <button
          onClick={openMenu}
          className="pointer-events-auto menu-float px-4 py-2 rounded-2xl border border-white/20 bg-[var(--panel)] text-white shadow-lg hover:bg-[color:rgba(12,16,28,.92)] min-w-[200px]"
        >
          {t.MENU}
        </button>
      </div>

      {/* Panneau Menu */}
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

            {/* Sections */}
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
                      <div>
                        {t.ACC.SPACE}: <b>{spaceActive ? t.ACC.ACTIVE : t.ACC.INACTIVE}</b>
                      </div>
                      <div>
                        {t.ACC.CONN}: <b>{connected ? t.ACC.ONLINE : t.ACC.OFFLINE}</b>
                      </div>
                      <div>
                        {t.ACC.PLAN}:{" "}
                        <b>
                          {plan === "subscription"
                            ? t.ACC.SUB
                            : plan === "one-month"
                            ? t.ACC.ONEOFF
                            : t.ACC.NONE}
                        </b>
                      </div>
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
                <Toggle active={lang === "fr"} onClick={() => setLangAndPersist("fr")}>
                  {I18N.fr.LANG.FR}
                </Toggle>
                <Toggle active={lang === "en"} onClick={() => setLangAndPersist("en")}>
                  {I18N.en.LANG.EN}
                </Toggle>
                <Toggle active={lang === "ar"} onClick={() => setLangAndPersist("ar")}>
                  {I18N.ar.LANG.AR}
                </Toggle>
              </div>
            </Accordion>

            <Accordion title={t.SECTIONS.LEGAL} open={showLegal} onToggle={() => setShowLegal((v) => !v)}>
              <div className="grid grid-cols-1 gap-2">
                <Btn onClick={openLegalModal}>{legalBtnLabel}</Btn>
              </div>
              {!consented && <p className="text-xs opacity-80 mt-3">{t.LEGAL.CONSENT_NOTE}</p>}
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

      {/* TOS/Privacy (inline) */}
      {legalOpen && (
        <div className="fixed inset-0 z-[110] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeLegalModal} />
          <div className="relative mx-4 w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-5 shadow-2xl text-black">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold">{t.LEGAL.TITLE}</h2>
              <button
                onClick={closeLegalModal}
                className="px-3 py-1.5 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-lg overflow-auto border border-black/10" style={{ maxHeight: "70vh" }}>
              <LegalDoc lang={lang as LegalLang} />
            </div>

            <p className="text-xs opacity-70 mt-3">
              {consented ? t.LEGAL.CONSENTED : t.LEGAL.CONSENT_NOTE}
            </p>

            <div className="mt-3 flex items-center justify-end gap-2">
              {!consented && (
                <button
                  onClick={closeLegalModal}
                  className="px-4 py-2 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10"
                >
                  {t.LEGAL.LATER}
                </button>
              )}
              <button onClick={acceptLegal} className="px-4 py-2 rounded-2xl bg-black text-white hover:bg-black/90">
                {t.LEGAL.ACCEPT}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* styles locaux */}
      <style jsx global>{`
        @keyframes ob-float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0); }
        }
        .menu-float:focus-visible {
          animation: ob-float 0.9s ease-in-out;
          outline: none;
        }
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
        active
          ? "bg-white/20 border-white/30 text-white"
          : "bg-white/8 border-white/15 text-white/90 hover:bg-white/14"
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
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-4 py-3"
      >
        <span className="font-medium">{title}</span>
        <span aria-hidden>{open ? "–" : "+"}</span>
      </button>

      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

/** ===================== Rendu inline du document légal ===================== */
function LegalDoc({ lang }: { lang: LegalLang }) {
  const t = legalCopyFor(lang);

  const linksTitle =
    lang === "ar"
      ? "للمزيد من المعلومات، يُرجى زيارة:"
      : lang === "en"
      ? "For additional information, please consult:"
      : "Pour toute information complémentaire, vous pouvez consulter:";

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-3">{t.title}</h1>

      <article dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-4 leading-6">
        {t.sections.map((s: LegalSection, i: number) => {
          if (s.kind === "hr") return <hr key={i} className="border-black/10 my-3" />;
          if (s.kind === "h2")
            return (
              <h2 key={i} className="text-lg font-semibold mt-3">
                {s.text}
              </h2>
            );
          if (s.kind === "p")
            return (s as any).html ? (
              <p key={i} className="opacity-90" dangerouslySetInnerHTML={{ __html: (s as any).text }} />
            ) : (
              <p key={i} className="opacity-90">
                {s.text}
              </p>
            );
          if (s.kind === "ul")
            return (
              <ul key={i} className="list-disc pl-5 space-y-1 opacity-90">
                {s.items.map((li, j) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            );
          return null;
        })}

        {/* ===== Liens complémentaires ===== */}
        <hr className="border-black/10 my-3" />
        <div className="opacity-90">
          <p className="mb-2">{linksTitle}</p>
          <ul className="list-none pl-0 space-y-1">
            <li>
              <a href="https://oneboardingai.com/delete" className="underline text-blue-700 hover:text-blue-900">
                oneboardingai.com/delete
              </a>
            </li>
            <li>
              <a href="https://oneboardingai.com/terms" className="underline text-blue-700 hover:text-blue-900">
                oneboardingai.com/terms
              </a>
            </li>
            <li>
              <a href="https://oneboardingai.com/trademark" className="underline text-blue-700 hover:text-blue-900">
                oneboardingai.com/trademark
              </a>
            </li>
          </ul>
        </div>

        {/* ===== Version & Mises à jour ===== */}
        <hr className="border-black/10 my-3" />
        <div className="text-sm leading-5 space-y-1">
          <h3 className="font-semibold">{t.version.h}</h3>
          <p className="font-semibold">{t.version.v}</p>
          <p className="opacity-90">{t.version.note}</p>
        </div>
      </article>
    </main>
  );
      }
