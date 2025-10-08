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
function copy(text: string) {
  try {
    navigator.clipboard.writeText(text);
    return true;
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
      OPEN: "Ouvrir",
      VIEWPAGE: "Voir la page",
      ACCEPT: "J’accepte",
      LATER: "Plus tard",
      TITLE: "Informations légales",
      M_TITLE: "Manifeste de Confiance — OneBoarding AI",
      M_ITEMS: [
        "Clarté & sécurité : l’utilisateur reste maître de son usage et responsable de ses choix.",
        "Universalité : respect des règles d’ordre public de chaque pays.",
        "Équilibre : moyens raisonnables côté éditeur, responsabilité d’usage côté utilisateur.",
        "Confiance & transparence : confidentialité, respect mutuel et bonne foi.",
      ],
      T_TITLE: "Conditions Générales d’Utilisation (CGU)",
      T_ITEMS: [
        "Objet : assistance alimentée par IA — aide à la décision.",
        "Responsabilité : les contenus générés ne sont pas des conseils professionnels personnalisés.",
        "Indemnisation : l’utilisateur indemnise l’éditeur en cas d’usage contraire à la loi.",
        "Limitation : pas de responsabilité pour dommages indirects, dans les limites légales.",
      ],
      P_TITLE: "Politique de Confidentialité",
      P_ITEMS: [
        "Stockage local : historique et consentements restent sur votre appareil.",
        "Sous-traitants techniques : acheminement des requêtes IA — pas de vente/partage publicitaire.",
        "Statistiques : mesures agrégées et anonymisées pour améliorer le service.",
        "Effacement : suppression possible à tout moment des données locales.",
      ],
      CONSENT_NOTE: "En cliquant sur « J’accepte », vous confirmez avoir pris connaissance de ces informations.",
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
      CONFIRM_MSG:
        "This action is irreversible. Consider sharing or saving if you want to keep your content.",
      CANCEL: "Cancel",
      CONFIRM: "Delete",
    },
    LANG: { FR: "Français", EN: "English", AR: "عربي" },

    LEGAL: {
      OPEN: "Open",
      VIEWPAGE: "Open page",
      ACCEPT: "Accept",
      LATER: "Later",
      TITLE: "Legal information",
      M_TITLE: "Trust Manifesto — OneBoarding AI",
      M_ITEMS: [
        "Clarity & safety: you control usage and remain responsible for your choices.",
        "Universality: comply with each country’s public-order rules.",
        "Balance: reasonable means on publisher’s side; responsible use on user’s side.",
        "Trust & transparency: confidentiality, mutual respect, good faith.",
      ],
      T_TITLE: "Terms of Service",
      T_ITEMS: [
        "Purpose: AI-powered assistance — decision support.",
        "Responsibility: generated content isn’t personalized professional advice.",
        "Indemnification: user indemnifies the publisher for unlawful use.",
        "Limitation: no liability for indirect damages within the law.",
      ],
      P_TITLE: "Privacy Policy",
      P_ITEMS: [
        "Local storage: your history and consents stay on your device.",
        "Processors: routing of AI requests — no advertising sale/sharing.",
        "Statistics: aggregated, anonymized metrics to improve the service.",
        "Erasure: you can delete local data at any time.",
      ],
      CONSENT_NOTE: "By clicking “Accept”, you acknowledge having read this information.",
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
      OPEN: "فتح",
      VIEWPAGE: "عرض الصفحة",
      ACCEPT: "موافقة",
      LATER: "لاحقاً",
      TITLE: "معلومات قانونية",
      M_TITLE: "بيان الثقة — OneBoarding AI",
      M_ITEMS: [
        "الوضوح والأمان: أنت المتحكم بالاستخدام ومسؤول عن اختياراتك.",
        "العالمية: احترام القواعد العامة في كل بلد.",
        "التوازن: وسائل معقولة من الناشر ومسؤولية الاستخدام على المستخدم.",
        "الثقة والشفافية: سرّية واحترام متبادل وحسن نية.",
      ],
      T_TITLE: "شروط الاستخدام",
      T_ITEMS: [
        "الهدف: مساعدة مدعومة بالذكاء الاصطناعي — دعم اتخاذ القرار.",
        "المسؤولية: المحتوى المُولّد ليس استشارة مهنية شخصية.",
        "التعويض: المستخدم يعوض الناشر عند الاستخدام المخالف للقانون.",
        "التحديد: لا مسؤولية عن الأضرار غير المباشرة وفق القانون.",
      ],
      P_TITLE: "سياسة الخصوصية",
      P_ITEMS: [
        "تخزين محلي: السجلّ والموافقات تبقى على جهازك.",
        "معالِجون تقنيون: تمرير الطلبات — بلا بيع/مشاركة إعلانية.",
        "إحصاءات: قياسات مُجمّعة ومجهّلة لتحسين الخدمة.",
        "المحو: يمكنك حذف البيانات المحلية في أي وقت.",
      ],
      CONSENT_NOTE: "بالنقر على «موافقة» فأنت تقر بأنك اطّلعت على هذه المعلومات.",
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

  // sections repliables
  const [showAcc, setShowAcc] = useState(true);
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

  // init depuis localStorage
  useEffect(() => {
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
    } catch {}
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
    toast("Merci, consentement enregistré.");
  }

  /** ============ Rendu ============ */
  return (
    <>
      {/* Bouton flottant principal — large + gradient “logo-like” + safe-area */}
      <div
        className="fixed inset-x-0 bottom-0 z-[55] flex justify-center pointer-events-none"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <button
          onClick={() => setOpen(true)}
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{t.MENU}</h2>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* === Sections === */}
            <Accordion title={t.SECTIONS.ACC} open={showAcc} onToggle={() => setShowAcc((v) => !v)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Connexion */}
                {!connected ? (
                  <Btn onClick={handleConnect}>{t.ACC.CONNECT}</Btn>
                ) : (
                  <Btn onClick={handleDisconnect}>{t.ACC.DISCONNECT}</Btn>
                )}

                {/* Activation */}
                {!spaceActive ? (
                  <Btn accent onClick={handleActivate}>{t.ACC.ACTIVATE}</Btn>
                ) : (
                  <Btn danger onClick={handleDeactivate}>{t.ACC.DEACTIVATE}</Btn>
                )}

                {/* Statut du compte (toggle) */}
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
                <Toggle active={lang === "fr"} onClick={() => setLangAndPersist("fr")}>{t.LANG.FR}</Toggle>
                <Toggle active={lang === "en"} onClick={() => setLangAndPersist("en")}>{t.LANG.EN}</Toggle>
                <Toggle active={lang === "ar"} onClick={() => setLangAndPersist("ar")}>{t.LANG.AR}</Toggle>
              </div>
            </Accordion>

            {/* 4) CGU / Privacy */}
            <Accordion title={t.SECTIONS.LEGAL} open={showLegal} onToggle={() => setShowLegal((v) => !v)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Btn onClick={openLegalModal}>{t.LEGAL.OPEN}</Btn>
                <a
                  href="/legal"
                  className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-sm font-medium text-white grid place-items-center"
                >
                  {t.LEGAL.VIEWPAGE}
                </a>
              </div>
              {!consented && (
                <p className="text-xs opacity-80 mt-3">
                  {lang === "fr"
                    ? "Consentement non enregistré."
                    : lang === "en"
                    ? "Consent not recorded."
                    : "الموافقة غير مسجّلة."}
                </p>
              )}
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

      {/* Modal légal (ouvert via la 4e section) */}
      {legalOpen && (
        <div className="fixed inset-0 z-[110] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setLegalOpen(false)} />
          <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-2xl text-black">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold">{t.LEGAL.TITLE}</h2>
              <div className="flex items-center gap-1">
                {(["fr","en","ar"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded-md text-xs border ${
                      lang === l ? "bg-black text-white border-black" : "bg-white text-black border-black/20"
                    }`}
                    aria-label={l.toUpperCase()}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={() => setLegalOpen(false)}
                  className="ml-1 px-3 py-1.5 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              <section>
                <h3 className="font-semibold mb-1">{t.LEGAL.M_TITLE}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {t.LEGAL.M_ITEMS.map((li: string, i: number) => <li key={i}>{li}</li>)}
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">{t.LEGAL.T_TITLE}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {t.LEGAL.T_ITEMS.map((li: string, i: number) => <li key={i}>{li}</li>)}
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">{t.LEGAL.P_TITLE}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {t.LEGAL.P_ITEMS.map((li: string, i: number) => <li key={i}>{li}</li>)}
                </ul>
              </section>

              <p className="text-xs opacity-70">{t.LEGAL.CONSENT_NOTE}</p>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <a
                href="/legal"
                className="px-4 py-2 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10"
              >
                {t.LEGAL.VIEWPAGE}
              </a>
              <button
                onClick={() => setLegalOpen(false)}
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
            </div>
          </div>
        </div>
      )}

      {/* styles locaux pour le bouton principal (safe-area/anim) */}
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
