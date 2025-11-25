// components/Menu.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  legalCopyFor,
  type Lang as LegalLang,
  type Section as LegalSection,
} from "@/lib/legal/copy";
import ConnectModal from "./ConnectModal";
import SubscribeModal from "./SubscribeModal";

/** ===================== Types ===================== */
type Plan = "subscription" | "one-month" | null;
type Lang = "fr" | "en" | "ar";
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

type PendingData = {
  challengeId: string;
  code: string;
  newDeviceId: string;
  expiresAt: string; // ISO
};

/** ===================== Constantes ===================== */
const CONSENT_KEY = "oneboarding.legalConsent.v1";
const CONSENT_AT_KEY = "oneboarding.legalConsentAt";
const CONSENT_SYNC_KEY = "oneboarding.legalConsentSynced.v1";
const DEVICE_ID_KEY = "oneboarding.deviceId";

const POLL_INTERVAL_MS = 12000; // ~12s
const POLL_MAX_TICKS = 5; // ~1 min

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
function uuid4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
function getOrCreateDeviceId(): string {
  try {
    const cur = localStorage.getItem(DEVICE_ID_KEY);
    if (cur) return cur;
    const id = uuid4();
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return "device-fallback";
  }
}
function two(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${two(mm)}:${two(ss)}`;
}

function consentErrorMessage(lang: Lang): string {
  if (lang === "en") {
    return "Unable to record your consent online. Please try again.";
  }
  if (lang === "ar") {
    return "تعذّر تسجيل الموافقة عبر الخادم. يُرجى المحاولة مرة أخرى.";
  }
  return "Impossible d’enregistrer votre consentement en ligne. Veuillez réessayer.";
}

/** ===================== i18n ===================== */
const I18N: Record<Lang, any> = {
  fr: {
    MENU: "Menu",
    SECTIONS: {
      ACC: "Mon compte",
      HIST: "Mon historique",
      LANG: "Ma langue",
      LEGAL: "CGU / Privacy",
    },
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
      DETECTED_BANNER: "Nouvel appareil détecté",
      VIEW: "Consulter",
      PENDING_TITLE: "Un nouvel appareil demande l’accès à votre espace.",
      AUTHORIZE: "Autoriser",
      IGNORE: "Ignorer",
      CODE_LIVE: "Code d’appairage actif",
      EXPIRES_AT: "expire à",
      CLOSE: "Fermer",
      EXPIRED: "Code expiré. Relancez depuis le nouvel appareil.",
      DONE_NEUTRAL: "Demande terminée. Merci de vérifier le nouvel appareil.",
      // Désactivation (double confirmation)
      DEACT_STEP1_TITLE: "Désactiver mon espace ?",
      DEACT_STEP1_MSG:
        "Souhaitez-vous vraiment désactiver votre espace ?\nMerci de confirmer.",
      DEACT_STEP2_TITLE: "Fin de l’espace actif",
      DEACT_STEP2_MSG:
        "En désactivant votre espace, votre abonnement prendra fin\net vos accès seront restreints.",
      DEACT_CANCEL: "Annuler",
      DEACT_CONFIRM: "Confirmer",
      DEACT_DONE: "Espace désactivé.",
      DEACT_ERROR: "Erreur lors de la désactivation. Merci de réessayer.",
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
      // ✅ Paragraphe Google-style (utilisation = acceptation)
      USAGE:
        "En utilisant OneBoarding AI, vous acceptez nos Conditions Générales d’Utilisation et notre Politique de Confidentialité. L’usage du service vaut approbation complète, avec ou sans confirmation explicite.",
    },
  },
  en: {
    MENU: "Menu",
    SECTIONS: {
      ACC: "My account",
      HIST: "My history",
      LANG: "My language",
      LEGAL: "TOS / Privacy",
    },
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
      DETECTED_BANNER: "New device detected",
      VIEW: "View",
      PENDING_TITLE: "A new device is requesting access to your space.",
      AUTHORIZE: "Authorize",
      IGNORE: "Ignore",
      CODE_LIVE: "Active pairing code",
      EXPIRES_AT: "expires at",
      CLOSE: "Close",
      EXPIRED: "Code expired. Please restart from the new device.",
      DONE_NEUTRAL: "Request finished. Please check the new device.",
      // Deactivation (double confirm)
      DEACT_STEP1_TITLE: "Deactivate my space?",
      DEACT_STEP1_MSG:
        "Do you really want to deactivate your space?\nPlease confirm.",
      DEACT_STEP2_TITLE: "End of active space",
      DEACT_STEP2_MSG:
        "By deactivating your space, your subscription will end\nand your access will be restricted.",
      DEACT_CANCEL: "Cancel",
      DEACT_CONFIRM: "Confirm",
      DEACT_DONE: "Space deactivated.",
      DEACT_ERROR: "Error while deactivating. Please try again.",
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
      OPEN: "Read & approve",
      READ: "Read",
      ACCEPT: "Read & approved",
      LATER: "Later",
      TITLE: "Legal information",
      CONSENT_NOTE:
        "By clicking “Read & approved”, you acknowledge having read this information.",
      CONSENTED: "Consent recorded.",
      USAGE:
        "By using OneBoarding AI, you accept our Terms of Use and Privacy Policy. Using the service constitutes full approval, with or without explicit confirmation.",
    },
  },
  ar: {
    MENU: "القائمة",
    SECTIONS: {
      ACC: "حسابي",
      HIST: "سِجِلّي",
      LANG: "لغتي",
      LEGAL: "الشروط / الخصوصية",
    },
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
      DETECTED_BANNER: "تم الكشف عن جهاز جديد",
      VIEW: "عرض",
      PENDING_TITLE: "يوجد جهاز جديد يطلب الوصول إلى مساحتك.",
      AUTHORIZE: "السماح",
      IGNORE: "تجاهُل",
      CODE_LIVE: "رمز الاقتران النشط",
      EXPIRES_AT: "ينتهي عند",
      CLOSE: "إغلاق",
      EXPIRED: "انتهت صلاحية الرمز. يُرجى إعادة البدء من الجهاز الجديد.",
      DONE_NEUTRAL: "انتهى الطلب. يُرجى التحقق من الجهاز الجديد.",
      // Deactivation (double confirm)
      DEACT_STEP1_TITLE: "إيقاف مساحتي؟",
      DEACT_STEP1_MSG:
        "هل ترغب حقاً في إيقاف مساحتك؟\nيُرجى التأكيد.",
      DEACT_STEP2_TITLE: "نهاية المساحة النشطة",
      DEACT_STEP2_MSG:
        "بإيقاف مساحتك، سينتهي اشتراكك\nوسيتم تقييد وصولك.",
      DEACT_CANCEL: "إلغاء",
      DEACT_CONFIRM: "تأكيد",
      DEACT_DONE: "تم إيقاف المساحة.",
      DEACT_ERROR: "حدث خطأ أثناء الإيقاف. يُرجى المحاولة من جديد.",
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
      CONSENT_NOTE:
        "بالنقر على «قُرِئ وتمت الموافقة» فأنت تُقرّ بأنك اطّلعت على هذه المعلومات.",
      CONSENTED: "تم تسجيل الموافقة.",
      USAGE:
        "باستخدامكم OneBoarding AI، فإنكم توافقون على شروط الاستخدام وسياسة الخصوصية. ويُعتبَر استعمال الخدمة موافقة كاملة، سواء مع التأكيد الصريح أو بدونه.",
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

  // Désactivation espace : double confirmation
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateStep, setDeactivateStep] = useState<1 | 2>(1);

  // Pairing (ancien appareil)
  const [pending, setPending] = useState<PendingData | null>(null);
  const [pendingBanner, setPendingBanner] = useState(false);
  const [showPendingCard, setShowPendingCard] = useState(false);
  const [revealCode, setRevealCode] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number>(0);

  const pollTimerRef = useRef<number | null>(null);
  const pollTicksRef = useRef<number>(0);
  const countdownRef = useRef<number | null>(null);

  const t = useMemo(() => I18N[lang], [lang]);

  // ===================== Helper : POST /api/consent =====================

  async function sendConsentToServer(silent = false): Promise<string | null> {
    try {
      const deviceId = getOrCreateDeviceId();

      const res = await fetch("/api/consent", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-ob-device-id": deviceId,
        },
      });

      if (!res.ok) {
        if (!silent) {
          toast(consentErrorMessage(lang));
        }
        return null;
      }

      const data: any = await res.json().catch(() => null);
      // On tolère plusieurs formes de payload
      const consentAt: string | null =
        data?.user?.consentAt ?? data?.consentAt ?? null;

      return consentAt ?? new Date().toISOString();
    } catch {
      if (!silent) {
        toast(consentErrorMessage(lang));
      }
      return null;
    }
  }

  // ===================== Sync backend -> état local =====================

  async function refreshAccountStatusFromServer() {
    try {
      const res = await fetch("/api/account/status", {
        method: "GET",
        credentials: "include",
      });
      const data: any = await res.json().catch(() => ({}));

      // 1) connexion
      const newConnected = !!data?.loggedIn;

      // 2) RÈGLE UNIQUE : l'espace actif reflète directement le plan actif
      const newPlanActive = !!data?.planActive;
      const newSpaceActive = newPlanActive;

      // 3) plan : on tolère CONTINU / PASS1MOIS ou déjà normalisé
      const rawPlan = data?.plan as
        | "CONTINU"
        | "PASS1MOIS"
        | "subscription"
        | "one-month"
        | null
        | undefined;

      let newPlan: Plan = null;
      if (rawPlan === "CONTINU" || rawPlan === "subscription") {
        newPlan = "subscription";
      } else if (rawPlan === "PASS1MOIS" || rawPlan === "one-month") {
        newPlan = "one-month";
      }

      setConnected(newConnected);
      setSpaceActive(newSpaceActive);
      setPlan(newPlan);

      // 4) Sync douce vers localStorage (utile pour WelcomeLimitDialog & co)
      try {
        localStorage.setItem("ob_connected", newConnected ? "1" : "0");
        localStorage.setItem(
          "oneboarding.spaceActive",
          newSpaceActive ? "1" : "0"
        );
        if (newPlan) {
          localStorage.setItem("oneboarding.plan", newPlan);
        } else {
          localStorage.removeItem("oneboarding.plan");
        }
        if (data?.phoneE164) {
          localStorage.setItem(
            "oneboarding.phoneE164",
            data.phoneE164 as string
          );
        }
      } catch {
        // best-effort
      }
    } catch {
      // en cas d’erreur réseau, on garde l’état local
    }
  }

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

  // Rattrapage silencieux : si consentement local mais pas encore synchronisé DB
  useEffect(() => {
    try {
      const hasConsentLocal = localStorage.getItem(CONSENT_KEY) === "1";
      const synced = localStorage.getItem(CONSENT_SYNC_KEY) === "1";
      if (!hasConsentLocal || synced) return;

      // On ne tente la synchro que pour un vrai membre (présent en DB)
      const isMember =
        connected ||
        spaceActive ||
        !!localStorage.getItem("oneboarding.phoneE164");

      if (!isMember) return;

      void (async () => {
        const consentAt = await sendConsentToServer(true);
        if (consentAt) {
          try {
            localStorage.setItem(CONSENT_SYNC_KEY, "1");
            localStorage.setItem(
              CONSENT_AT_KEY,
              String(new Date(consentAt).getTime())
            );
          } catch {}
        }
      })();
    } catch {
      // silencieux
    }
  }, [connected, spaceActive]);

  // Au montage, on essaie déjà de resynchroniser avec le backend
  useEffect(() => {
    void refreshAccountStatusFromServer();
  }, []);

  // Quand le menu s’ouvre, on rafraîchit aussi l’état depuis le backend
  useEffect(() => {
    if (!open) return;
    void refreshAccountStatusFromServer();
  }, [open]);

  // écoute cross-composants (venant des modales dédiées)
  useEffect(() => {
    const onAuthChanged = () =>
      setConnected(localStorage.getItem("ob_connected") === "1");

    const onSetConnected = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (d?.phoneE164) {
        try {
          localStorage.setItem("oneboarding.phoneE164", d.phoneE164);
        } catch {}
      }
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
    const onConsentUpdated = () =>
      setConsented(localStorage.getItem(CONSENT_KEY) === "1");

    const onSubscriptionActive = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const newPlan: Plan =
        d?.plan === "one-month" ? "one-month" : "subscription";

      try {
        localStorage.setItem("ob_connected", "1");
        localStorage.setItem("oneboarding.spaceActive", "1");
        if (newPlan) {
          localStorage.setItem("oneboarding.plan", newPlan);
        } else {
          localStorage.removeItem("oneboarding.plan");
        }
        if (d?.phoneE164) {
          localStorage.setItem("oneboarding.phoneE164", d.phoneE164);
        }
      } catch {}

      setConnected(true);
      setSpaceActive(true);
      setPlan(newPlan);
    };

    const onDeviceAuthorized = () => {
      // Un nouveau device vient d'être autorisé : on resynchronise l’état global
      void refreshAccountStatusFromServer();
    };

    window.addEventListener("ob:connected-changed", onAuthChanged);
    window.addEventListener("ob:set-connected", onSetConnected as EventListener);
    window.addEventListener("ob:space-activated", onSpaceActivated);
    window.addEventListener("ob:plan-changed", onPlanChanged);
    window.addEventListener("ob:history-cleared", onHistoryCleared);
    window.addEventListener("ob:consent-updated", onConsentUpdated);

    window.addEventListener(
      "ob:subscription-active",
      onSubscriptionActive as EventListener
    );
    window.addEventListener(
      "ob:device-authorized",
      onDeviceAuthorized as EventListener
    );

    return () => {
      window.removeEventListener("ob:connected-changed", onAuthChanged);
      window.removeEventListener(
        "ob:set-connected",
        onSetConnected as EventListener
      );
      window.removeEventListener("ob:space-activated", onSpaceActivated);
      window.removeEventListener("ob:plan-changed", onPlanChanged);
      window.removeEventListener("ob:history-cleared", onHistoryCleared);
      window.removeEventListener("ob:consent-updated", onConsentUpdated);

      window.removeEventListener(
        "ob:subscription-active",
        onSubscriptionActive as EventListener
      );
      window.removeEventListener(
        "ob:device-authorized",
        onDeviceAuthorized as EventListener
      );
    };
  }, []);

  // helpers
  function emit(name: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /** ============ Pairing: fetch pending ============ */
  async function fetchPendingOnce(): Promise<PendingData | null> {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch("/api/pairing/pending", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-ob-device-id": deviceId,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) return null;
      if (data.has === false) return null;
      return {
        challengeId: data.challengeId,
        code: data.code,
        newDeviceId: data.newDeviceId,
        expiresAt: data.expiresAt,
      };
    } catch {
      return null;
    }
  }

  function clearPolling() {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollTicksRef.current = 0;
  }

  function stopCountdown() {
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setRemainingMs(0);
  }

  // Micro-polling pairing (uniquement quand Menu ouvert & connecté)
  useEffect(() => {
    if (!open || !connected) {
      clearPolling();
      return;
    }

    let mounted = true;

    const prime = async () => {
      const p = await fetchPendingOnce();
      if (!mounted) return;

      if (p) {
        setPending(p);
        setPendingBanner(true);
      } else {
        setPending(null);
        setPendingBanner(false);
        setShowPendingCard(false);
        setRevealCode(false);
        stopCountdown();
      }
    };

    prime();

    clearPolling();
    pollTimerRef.current = window.setInterval(async () => {
      pollTicksRef.current += 1;
      const p = await fetchPendingOnce();
      if (!mounted) return;

      if (p) {
        setPending(p);
        setPendingBanner(true);

        if (revealCode) {
          const ms = new Date(p.expiresAt).getTime() - Date.now();
          setRemainingMs(ms);
          if (ms <= 0) {
            setRevealCode(false);
            setShowPendingCard(false);
            toast(t.ACC.EXPIRED);
            stopCountdown();
          }
        }
      } else {
        if (showPendingCard || revealCode || pendingBanner) {
          setShowPendingCard(false);
          setRevealCode(false);
          setPendingBanner(false);
          setPending(null);
          stopCountdown();
          toast(t.ACC.DONE_NEUTRAL);
        }
      }

      if (pollTicksRef.current >= POLL_MAX_TICKS) {
        clearPolling();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    connected,
    revealCode,
    pendingBanner,
    showPendingCard,
    t.ACC.DONE_NEUTRAL,
    t.ACC.EXPIRED,
  ]);

  // Countdown local (1 Hz) quand le code est révélé
  useEffect(() => {
    if (!revealCode || !pending?.expiresAt) {
      stopCountdown();
      return;
    }
    const tick = () => {
      const ms = new Date(pending.expiresAt).getTime() - Date.now();
      setRemainingMs(ms);
      if (ms <= 0) {
        setRevealCode(false);
        setShowPendingCard(false);
        toast(t.ACC.EXPIRED);
        stopCountdown();
      }
    };
    tick();
    countdownRef.current = window.setInterval(tick, 1000);
    return () => stopCountdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealCode, pending?.expiresAt, t.ACC.EXPIRED]);

  /** ============ Actions compte ============ */
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

  function openDeactivateConfirm() {
    setDeactivateStep(1);
    setDeactivateOpen(true);
  }

  async function performDeactivate() {
    try {
      const res = await fetch("/api/account/deactivate", {
        method: "POST",
        credentials: "include",
      });
      const data: any = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error("DEACTIVATE_FAILED");
      }

      // Nettoyage local cohérent avec l’état backend
      try {
        localStorage.setItem("ob_connected", "0");
        localStorage.setItem("oneboarding.spaceActive", "0");
        localStorage.removeItem("oneboarding.plan");
        localStorage.removeItem("oneboarding.phoneE164");
      } catch {}

      setConnected(false);
      setSpaceActive(false);
      setPlan(null);

      emit("ob:connected-changed");
      emit("ob:space-deactivated");
      emit("ob:plan-changed");

      toast(t.ACC.DEACT_DONE);
    } catch {
      toast(t.ACC.DEACT_ERROR);
    } finally {
      setDeactivateOpen(false);
      setDeactivateStep(1);
    }
  }

  /** ============ Historique (footer neutre & stable) ============ */
  function formatHistoryForText(msgs: Item[], l: Lang) {
    const body = msgs
      .slice()
      .reverse()
      .map((m) => {
        const who =
          m.role === "user"
            ? l === "en"
              ? "You"
              : l === "ar"
              ? "أنت"
              : "Vous"
            : m.role === "assistant"
            ? l === "en"
              ? "AI"
              : l === "ar"
              ? "الذكاء الاصطناعي"
              : "IA"
            : l === "en"
            ? "Error"
            : l === "ar"
            ? "خطأ"
            : "Erreur";
        return `${who} • ${new Date(m.time).toLocaleString()}\n${m.text}`;
      })
      .join("\n\n— — —\n\n");

    const footer =
      `\n\n— — —\n` +
      `OneBoarding AI® —\n` +
      `https://oneboardingai.com`;

    return `${body}${footer}`;
  }

  /** ============ Historique actions ============ */
  async function shareHistory() {
    const msgs = readJSON<Item[]>("oneboarding.history", []);
    if (!msgs.length) {
      toast(t.HIST.EMPTY);
      return;
    }
    const textToShare = formatHistoryForText(msgs, lang);
    const title = "OneBoarding AI";
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
    a.download = `oneboarding-history-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(t.HIST.SAVED);
  }

  function clearHistoryConfirmed() {
    setConfirmOpen(false);

    let currentLang: Lang = lang;
    try {
      const lsLang = localStorage.getItem("oneboarding.lang") as Lang | null;
      if (lsLang && ["fr", "en", "ar"].includes(lsLang)) {
        currentLang = lsLang as Lang;
      }
    } catch {}

    window.dispatchEvent(
      new CustomEvent("ob:request-clear-history", {
        detail: { lang: currentLang },
      })
    );
  }

  /** ============ Langue ============ */
  function setLangAndPersist(l: Lang) {
    setLang(l);
    localStorage.setItem("oneboarding.lang", l);
    emit("ob:lang-changed", { lang: l });
  }

  /** ============ Consentement légal (décorrélé de l’accès) ============ */
  function openLegalModal() {
    setLegalOpen(true);
    pushHistoryFor("legal");
  }

  async function acceptLegal() {
    // 1) Toujours marquer localement le clic, pour tout le monde
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {}

    // 2) Déterminer si on est face à un vrai membre (présent en DB)
    const isMember =
      connected ||
      spaceActive ||
      !!localStorage.getItem("oneboarding.phoneE164");

    let consentAt: string | null = null;

    // 3) Si membre → on synchronise tout de suite en base
    if (isMember) {
      consentAt = await sendConsentToServer(false);
      if (!consentAt) {
        // L'erreur (401, etc.) a déjà été signalée par toast
        return;
      }
      try {
        localStorage.setItem(CONSENT_SYNC_KEY, "1");
        localStorage.setItem(
          CONSENT_AT_KEY,
          String(new Date(consentAt).getTime())
        );
      } catch {}
    }

    // 4) Mise à jour UI (membre ou pas, le clic est bien pris en compte localement)
    setConsented(true);
    window.dispatchEvent(new Event("ob:consent-updated"));
    toast(t.LEGAL.CONSENTED);
    closeLegalModal();
  }

  /** ============ Navigation native (history) ============ */
  function pushHistoryFor(kind: "menu" | "legal") {
    const href =
      typeof window !== "undefined" ? window.location.href : undefined;
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
      {/* Bouton flottant principal */}
      <div
        className="fixed inset-x-0 z-[55] flex justify-center pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 39px)" }}
      >
        <button
          onClick={openMenu}
          className="pointer-events-auto menu-float px-4 py-2 rounded-2xl border border-white/20 bg-[var(--panel)] text-white shadow-lg hover:bg-[color:rgba(12,16,28,.92)] min-w-[120px]"
        >
          {t.MENU}
        </button>
      </div>

      {/* Panneau Menu */}
      {open && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={closeMenu}
          />
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
            <Accordion
              title={t.SECTIONS.ACC}
              open={showAcc}
              onToggle={() => setShowAcc((v) => !v)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {!connected ? (
                  <Btn onClick={handleConnect}>{t.ACC.CONNECT}</Btn>
                ) : (
                  <Btn onClick={handleDisconnect}>{t.ACC.DISCONNECT}</Btn>
                )}
                {!spaceActive ? (
                  <Btn accent onClick={handleActivate}>
                    {t.ACC.ACTIVATE}
                  </Btn>
                ) : (
                  <Btn danger onClick={openDeactivateConfirm}>
                    {t.ACC.DEACTIVATE}
                  </Btn>
                )}
                <Btn
                  className="sm:col-span-2"
                  onClick={() => setShowStatus((v) => !v)}
                >
                  {t.ACC.STATUS_BTN} {showStatus ? "—" : "+"}
                </Btn>
                {showStatus && (
                  <div className="sm:col-span-2 rounded-xl border border-white/12 bg-white/5 p-3">
                    <p className="text-sm font-medium mb-1">{t.ACC.STATUS}</p>
                    <div className="text-xs opacity-90 leading-6">
                      <div>
                        {t.ACC.SPACE}:{" "}
                        <b>{spaceActive ? t.ACC.ACTIVE : t.ACC.INACTIVE}</b>
                      </div>
                      <div>
                        {t.ACC.CONN}:{" "}
                        <b>{connected ? t.ACC.ONLINE : t.ACC.OFFLINE}</b>
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

                {/* Bandeau "Nouvel appareil détecté" */}
                {pendingBanner && (
                  <div className="sm:col-span-2 rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-3 py-2 flex items-center justify-between">
                    <span className="text-sm">{t.ACC.DETECTED_BANNER}</span>
                    <button
                      onClick={() => {
                        setShowPendingCard(true);
                        setRevealCode(false);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-cyan-300/40 bg-cyan-400/20 hover:bg-cyan-400/25 text-sm"
                    >
                      {t.ACC.VIEW}
                    </button>
                  </div>
                )}

                {/* Encart de demande */}
                {showPendingCard && (
                  <div className="sm:col-span-2 rounded-xl border border-white/12 bg-white/5 p-3">
                    {!revealCode ? (
                      <>
                        <p className="text-sm opacity-90">
                          {t.ACC.PENDING_TITLE}
                        </p>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setShowPendingCard(false);
                            }}
                            className="px-3 py-2 rounded-xl border border-white/15 bg:white/10 bg-white/10 hover:bg-white/12 text-sm"
                          >
                            {t.ACC.IGNORE}
                          </button>
                          <button
                            onClick={() => {
                              setRevealCode(true);
                            }}
                            className="px-4 py-2 rounded-2xl bg-black text-white font-semibold hover:bg-black/90 text-sm"
                          >
                            {t.ACC.AUTHORIZE}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm opacity-90">
                          <span className="font-medium">
                            {t.ACC.CODE_LIVE}
                          </span>
                          {": "}
                          <span className="font-mono tracking-wider text-base">
                            {pending?.code || "••••••"}
                          </span>
                          {" — "}
                          <span className="opacity-85">
                            {t.ACC.EXPIRES_AT}{" "}
                            {pending
                              ? new Date(
                                  pending.expiresAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "--:--"}
                            {remainingMs > 0
                              ? `  ( ${formatCountdown(remainingMs)} )`
                              : ""}
                          </span>
                        </p>
                        <div className="mt-3 flex items-center justify-end">
                          <button
                            onClick={() => {
                              setShowPendingCard(false);
                              setRevealCode(false);
                            }}
                            className="px-4 py-2 rounded-2xl border border-white/15 bg-white/8 hover:bg-white/12 text-sm"
                          >
                            {t.ACC.CLOSE}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                <Btn
                  danger
                  onClick={() => setConfirmOpen(true)}
                  className="sm:col-span-2"
                >
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
                <Toggle
                  active={lang === "fr"}
                  onClick={() => setLangAndPersist("fr")}
                >
                  {I18N.fr.LANG.FR}
                </Toggle>
                <Toggle
                  active={lang === "en"}
                  onClick={() => setLangAndPersist("en")}
                >
                  {I18N.en.LANG.EN}
                </Toggle>
                <Toggle
                  active={lang === "ar"}
                  onClick={() => setLangAndPersist("ar")}
                >
                  {I18N.ar.LANG.AR}
                </Toggle>
              </div>
            </Accordion>

            <Accordion
              title={t.SECTIONS.LEGAL}
              open={showLegal}
              onToggle={() => setShowLegal((v) => !v)}
            >
              <div className="grid grid-cols-1 gap-2">
                <Btn onClick={openLegalModal}>{legalBtnLabel}</Btn>
              </div>
              {!consented && (
                <p className="text-xs opacity-80 mt-3">
                  {t.LEGAL.CONSENT_NOTE}
                </p>
              )}
            </Accordion>
          </div>
        </div>
      )}

      {/* Modal de confirmation (historique) */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setConfirmOpen(false)}
          />
          <div
            ref={confirmRef}
            className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white"
          >
            <h2 className="text-lg font-semibold mb-2">
              {t.HIST.CONFIRM_TITLE}
            </h2>
            <p className="text-sm opacity-90 mb-4">{t.HIST.CONFIRM_MSG}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/20 bg:white/10 bg-white/10 hover:bg-white/15 text-white"
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

      {/* Modal de désactivation espace (double confirmation) */}
      {deactivateOpen && (
        <div
          className="fixed inset-0 z-[105] grid place-items-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => {
              setDeactivateOpen(false);
              setDeactivateStep(1);
            }}
          />
          <div className="relative mx-4 w	full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white">
            <h2 className="text-lg font-semibold mb-2">
              {deactivateStep === 1
                ? t.ACC.DEACT_STEP1_TITLE
                : t.ACC.DEACT_STEP2_TITLE}
            </h2>
            <p className="text-sm whitespace-pre-line opacity-90 mb-4">
              {deactivateStep === 1
                ? t.ACC.DEACT_STEP1_MSG
                : t.ACC.DEACT_STEP2_MSG}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setDeactivateOpen(false);
                  setDeactivateStep(1);
                }}
                className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg:white/15 hover:bg-white/15 text-white"
              >
                {t.ACC.DEACT_CANCEL}
              </button>
              <button
                onClick={
                  deactivateStep === 1
                    ? () => setDeactivateStep(2)
                    : () => {
                        void performDeactivate();
                      }
                }
                className="px-4 py-2 rounded-2xl bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]"
              >
                {t.ACC.DEACT_CONFIRM}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOS/Privacy (inline) */}
      {legalOpen && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={closeLegalModal}
          />
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

            <div
              className="rounded-lg overflow-auto border border-black/10"
              style={{ maxHeight: "70vh" }}
            >
              <LegalDoc lang={lang as LegalLang} />
            </div>

            <p className="text-xs opacity-70 mt-3">
              {consented ? t.LEGAL.CONSENTED : t.LEGAL.CONSENT_NOTE}
            </p>

            {/* ✅ Paragraphe d’usage – même logique que /legal, juste avant les boutons */}
            <p className="mt-2 text-sm opacity-70 text-center">
              {t.LEGAL.USAGE}
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
              <button
                onClick={() => {
                  void acceptLegal();
                }}
                className="px-4 py-2 rounded-2xl bg-black text-white hover:bg-black/90"
              >
                {t.LEGAL.ACCEPT}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monter les modales ici */}
      <ConnectModal />
      <SubscribeModal />

      {/* styles locaux */}
      <style jsx global>{`
        @keyframes ob-float {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
          100% {
            transform: translateY(0);
          }
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
  const base =
    "px-4 py-2 rounded-xl border transition text-sm font-medium text-white";
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

  const qs = lang === "fr" ? "" : `?lang=${lang}`;
  const links = {
    deleteHref: `/delete${qs}`,
    termsHref: `/terms${qs}`,
    protocolHref: `/protocol${qs}`,
    trademarkHref: `/trademark${qs}`,
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-3">{t.title}</h1>

      <article
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="space-y-4 leading-6"
      >
        {t.sections.map((s: LegalSection, i: number) => {
          if (s.kind === "hr") {
            return <hr key={i} className="border-black/10 my-3" />;
          }
          if (s.kind === "h2") {
            return (
              <h2 key={i} className="text-lg font-semibold mt-3">
                {s.text}
              </h2>
            );
          }
          if (s.kind === "p") {
            return (s as any).html ? (
              <p
                key={i}
                className="opacity-90"
                dangerouslySetInnerHTML={{ __html: (s as any).text }}
              />
            ) : (
              <p key={i} className="opacity-90">
                {s.text}
              </p>
            );
          }
          if (s.kind === "ul") {
            return (
              <ul key={i} className="list-disc pl-5 space-y-1 opacity-90">
                {s.items.map((li, j) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            );
          }
          return null;
        })}

        <hr className="border-black/10 my-3" />
        <div className="opacity-90">
          <p className="mb-2">{linksTitle}</p>
          <ul className="list-none pl-0 space-y-1">
            <li>
              <a
                href={links.deleteHref}
                className="underline text-blue-700 hover:text-blue-900"
              >
                oneboardingai.com/delete
              </a>
            </li>
            <li>
              <a
                href={links.termsHref}
                className="underline text-blue-700 hover:text-blue-900"
              >
                oneboardingai.com/terms
              </a>
            </li>
            <li>
              <a
                href={links.protocolHref}
                className="underline text-blue-700 hover:text-blue-900"
              >
                oneboardingai.com/protocol
              </a>
            </li>
            <li>
              <a
                href={links.trademarkHref}
                className="underline text-blue-700 hover:text-blue-900"
              >
                oneboardingai.com/trademark
              </a>
            </li>
          </ul>
        </div>

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
