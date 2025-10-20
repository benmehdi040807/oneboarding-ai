// components/Menu.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { legalCopyFor, type Lang as LegalLang, type Section as LegalSection } from "@/lib/legal/copy";

/** ===================== Types ===================== */
type Plan = "subscription" | "one-month" | null;
type Lang = "fr" | "en" | "ar";
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

type CheckState = {
  hasAnyDevice: boolean;
  deviceKnown: boolean;
  planActive: boolean;
  deviceCount: number;
  maxDevices: number; // 3
};

/** ===================== Constantes ===================== */
const CONSENT_KEY = "oneboarding.legalConsent.v1";
const CONSENT_AT_KEY = "oneboarding.legalConsentAt";
const DEVICE_ID_KEY = "oneboarding.deviceId";
const MAX_DEVICES_DEFAULT = 3;

/** ===================== Utils ===================== */
function uuid4() {
  // mini UUID v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = uuid4();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "device-fallback";
  }
}

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

    // ==== Auth sans OTP ====
    AUTH: {
      CONNECT_TITLE: "Connexion sécurisée",
      PHONE_LABEL: "Numéro de téléphone (membre)",
      PHONE_PH: "+33 612 34 56 78",
      CONNECT_INFO:
        "Si cet appareil n’est pas encore autorisé, une vérification à 1 € peut être requise pour confirmer votre identité et ajouter cet appareil.",
      CONNECT_BTN: "Continuer",
      CANCEL: "Annuler",

      // choix plan (1ère activation, aucun device connu)
      ACTIVATE_TITLE: "Activer votre espace",
      PLAN_SUB: "Abonnement — 5 €/mois (accès continu, sans interruption)",
      PLAN_ONE: "Accès libre — 5 € (un mois complet, sans engagement)",
      ACTIVATE_BTN: "Activer maintenant",
      BACK: "Retour",

      // deuxième/3e/4e appareil
      ONE_EURO_TITLE: "Autoriser cet appareil",
      ONE_EURO_LEAD:
        "Pour protéger votre compte, nous confirmons votre identité (1 €) et ajoutons cet appareil en toute sécurité.",
      REVOKE_OLDEST_HINT:
        "Limite atteinte ({max}/ {max}). En continuant, le plus ancien appareil sera révoqué.",
      REVOKE_OPT_LABEL: "Révoquer l’appareil le plus ancien",
      PAY_BTN: "Valider l’autorisation (1 €)",

      WELCOME_OK: "Bienvenue — appareil autorisé.",
      SPACE_OK: "Espace activé — bon voyage.",
      ERROR: "Une erreur est survenue. Réessayez.",
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

    AUTH: {
      CONNECT_TITLE: "Secure sign-in",
      PHONE_LABEL: "Phone number (member)",
      PHONE_PH: "+1 415 555 2671",
      CONNECT_INFO:
        "If this device isn’t authorized yet, a €1 verification may be required to confirm your identity and add this device.",
      CONNECT_BTN: "Continue",
      CANCEL: "Cancel",

      ACTIVATE_TITLE: "Activate your space",
      PLAN_SUB: "Subscription — €5 / month (continuous access)",
      PLAN_ONE: "One-month access — €5 (no commitment)",
      ACTIVATE_BTN: "Activate now",
      BACK: "Back",

      ONE_EURO_TITLE: "Authorize this device",
      ONE_EURO_LEAD:
        "To protect your account, we confirm your identity (€1) and add this device securely.",
      REVOKE_OLDEST_HINT:
        "Limit reached ({max}/ {max}). By continuing, the oldest device will be revoked.",
      REVOKE_OPT_LABEL: "Revoke the oldest device",
      PAY_BTN: "Confirm authorization (€1)",

      WELCOME_OK: "Welcome — device authorized.",
      SPACE_OK: "Space activated — enjoy.",
      ERROR: "Something went wrong. Please try again.",
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

    AUTH: {
      CONNECT_TITLE: "تسجيل آمن",
      PHONE_LABEL: "رقم الهاتف (عضو)",
      PHONE_PH: "+212 6 12 34 56 78",
      CONNECT_INFO:
        "إذا لم يكن هذا الجهاز مُفوضًا بعد، قد نطلب تحققًا بمبلغ 1€ لتأكيد هويتك وإضافة هذا الجهاز.",
      CONNECT_BTN: "متابعة",
      CANCEL: "إلغاء",

      ACTIVATE_TITLE: "تفعيل مساحتك",
      PLAN_SUB: "اشتراك — 5€ / شهر (وصول متواصل)",
      PLAN_ONE: "وصول لشهر — 5€ (بدون التزام)",
      ACTIVATE_BTN: "تفعيل الآن",
      BACK: "عودة",

      ONE_EURO_TITLE: "تفويض هذا الجهاز",
      ONE_EURO_LEAD:
        "لأمان حسابك، نؤكد هويتك (1€) ونضيف هذا الجهاز بأمان.",
      REVOKE_OLDEST_HINT:
        "تم بلوغ الحد ({max}/ {max}). بالمتابعة سيتم إلغاء أقدم جهاز.",
      REVOKE_OPT_LABEL: "إلغاء أقدم جهاز",
      PAY_BTN: "تأكيد التفويض (1€)",

      WELCOME_OK: "مرحبًا — تم تفويض الجهاز.",
      SPACE_OK: "تم تفعيل المساحة — استمتع.",
      ERROR: "حدث خطأ. حاول مجددًا.",
    },
  },
};

/** ===================== Composant principal ===================== */
export default function Menu() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");

  // lecture état
  const [connected, setConnected] = useState<boolean>(false);
  const [spaceActive, setSpaceActive] = useState<boolean>(false);
  const [messages, setMessages] = useState<Item[]>([]);
  const [plan, setPlan] = useState<Plan>(null);

  // sections repliables
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

  // modal auth intégrée
  const [authOpen, setAuthOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [oneEuroOpen, setOneEuroOpen] = useState(false);

  // états auth
  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);
  const [authState, setAuthState] = useState<CheckState | null>(null);
  const [revokeOldest, setRevokeOldest] = useState(false);

  // navigation native (history)
  const menuPushedRef = useRef(false);
  const legalPushedRef = useRef(false);
  const authPushedRef = useRef(false);

  const t = useMemo(() => I18N[lang], [lang]);

  // init
  useEffect(() => {
    try {
      const L = (localStorage.getItem("oneboarding.lang") as Lang) || "fr";
      setLang(L);
      setConnected(localStorage.getItem("ob_connected") === "1");
      const act = localStorage.getItem("oneboarding.spaceActive");
      setSpaceActive(act === "1" || act === "true");
      setPlan((localStorage.getItem("oneboarding.plan") as Plan) || null);
      setMessages(readJSON<Item[]>("oneboarding.history", []));
      setConsented(localStorage.getItem(CONSENT_KEY) === "1");
      getOrCreateDeviceId(); // s'assure qu'on a un deviceId

      // pré-remplir le téléphone si déjà stocké
      const savedPhone = localStorage.getItem("oneboarding.phoneE164");
      if (savedPhone) setPhone(savedPhone);
    } catch {}
  }, []);

  // écoute cross-composants + écoute CTA activation externe
  useEffect(() => {
    const onAuthChanged = () => setConnected(localStorage.getItem("ob_connected") === "1");
    const onSpaceActivated = () => {
      setSpaceActive(true);
      setPlan((localStorage.getItem("oneboarding.plan") as Plan) || null);
    };
    const onPlanChanged = () => setPlan((localStorage.getItem("oneboarding.plan") as Plan) || null);
    const onHistoryCleared = () => setMessages([]);
    const onConsentUpdated = () => setConsented(localStorage.getItem(CONSENT_KEY) === "1");

    // 🔗 Ouverture depuis QuotaPromoBanner / autres (ob:open-activate)
    const onOpenActivate = (e: Event) => {
      // si un numéro est déjà connu en localStorage, le récupérer
      try {
        const saved = localStorage.getItem("oneboarding.phoneE164");
        if (saved) setPhone(saved);
      } catch {}
      setActivateOpen(true);
      pushHistoryFor("auth");
    };

    window.addEventListener("ob:connected-changed", onAuthChanged);
    window.addEventListener("ob:space-activated", onSpaceActivated);
    window.addEventListener("ob:plan-changed", onPlanChanged);
    window.addEventListener("ob:history-cleared", onHistoryCleared);
    window.addEventListener("ob:consent-updated", onConsentUpdated);
    window.addEventListener("ob:open-activate", onOpenActivate as EventListener);

    return () => {
      window.removeEventListener("ob:connected-changed", onAuthChanged);
      window.removeEventListener("ob:space-activated", onSpaceActivated);
      window.removeEventListener("ob:plan-changed", onPlanChanged);
      window.removeEventListener("ob:history-cleared", onHistoryCleared);
      window.removeEventListener("ob:consent-updated", onConsentUpdated);
      window.removeEventListener("ob:open-activate", onOpenActivate as EventListener);
    };
  }, []);

  // helpers
  function emit(name: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /** ============ Actions compte ============ */
  function handleConnect() {
    // préremplir si dispo
    try {
      const saved = localStorage.getItem("oneboarding.phoneE164");
      if (saved) setPhone(saved);
    } catch {}
    setAuthState(null);
    setRevokeOldest(false);
    openAuthModal();
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
    // ouverture directe de l'écran d’activation (choix du plan)
    // pré-remplir le téléphone si déjà connu
    try {
      const saved = localStorage.getItem("oneboarding.phoneE164");
      if (saved) setPhone(saved);
    } catch {}
    setActivateOpen(true);
    pushHistoryFor("auth");
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
      if ((navigator as any).share) {
        await (navigator as any).share({ title, text: full });
      } else {
        const ok = await copy(full);
        if (ok) toast(t.HIST.COPIED);
      }
    } catch {}
  }

  function saveHistory() {
    const msgs = readJSON<Item[]>("oneboarding.history", []);
    const blob = new Blob([JSON.stringify(msgs, null, 2)], { type: "text/plain;charset=utf-8" });
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
  function pushHistoryFor(kind: "menu" | "legal" | "auth") {
    const href = typeof window !== "undefined" ? window.location.href : undefined;
    if (kind === "menu" && !menuPushedRef.current) {
      window.history.pushState({ obPane: "menu" }, "", href);
      menuPushedRef.current = true;
    }
    if (kind === "legal" && !legalPushedRef.current) {
      window.history.pushState({ obPane: "legal" }, "", href);
      legalPushedRef.current = true;
    }
    if (kind === "auth" && !authPushedRef.current) {
      window.history.pushState({ obPane: "auth" }, "", href);
      authPushedRef.current = true;
    }
  }

  // popstate global
  useEffect(() => {
    const onPop = () => {
      if (oneEuroOpen) {
        setOneEuroOpen(false);
        authPushedRef.current = false;
        return;
      }
      if (activateOpen) {
        setActivateOpen(false);
        authPushedRef.current = false;
        return;
      }
      if (authOpen) {
        setAuthOpen(false);
        authPushedRef.current = false;
        return;
      }
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
  }, [open, legalOpen, authOpen, activateOpen, oneEuroOpen]);

  function openMenu() {
    setOpen(true);
    pushHistoryFor("menu");
  }
  function closeMenu() {
    if (legalOpen) closeLegalModal();
    if (authOpen || activateOpen || oneEuroOpen) closeAuthModals();
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
  function openAuthModal() {
    setAuthOpen(true);
    pushHistoryFor("auth");
  }
  function closeAuthModals() {
    if (authPushedRef.current) {
      authPushedRef.current = false;
      window.history.back();
    } else {
      setAuthOpen(false);
      setActivateOpen(false);
      setOneEuroOpen(false);
    }
  }

  const legalBtnLabel = consented ? t.LEGAL.READ : t.LEGAL.OPEN;

  /** ===================== Handlers serveur (fetch) ===================== */
  async function apiCheck(phone: string): Promise<CheckState> {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, deviceId }),
    });
    if (!res.ok) throw new Error("check failed");
    const data = await res.json();
    return {
      hasAnyDevice: !!data?.hasAnyDevice,
      deviceKnown: !!data?.deviceKnown,
      planActive: !!data?.planActive,
      deviceCount: Number(data?.deviceCount ?? 0),
      maxDevices: Number(data?.maxDevices ?? MAX_DEVICES_DEFAULT),
    };
  }

  async function apiAuthorizeDeviceOneEuro(phone: string, revokeOldest: boolean) {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch("/api/pay/authorize-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, deviceId, revokeOldest }),
    });
    if (!res.ok) throw new Error("authorize-device failed");
    const out = await res.json();
    if (!out?.ok) throw new Error("authorize-device not ok");
  }

  async function apiStartPlan(kind: "subscription" | "one-month", phone: string) {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch("/api/pay/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, phone, deviceId }),
    });
    if (!res.ok) throw new Error("start plan failed");
    const out = await res.json();
    if (!out?.ok) throw new Error("start plan not ok");
    return out?.plan as Plan;
  }

  async function apiMarkDeviceAuthorized(phone: string) {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch("/api/devices/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, deviceId }),
    });
    if (!res.ok) throw new Error("devices/authorize failed");
  }

  async function apiRevokeOldest(phone: string) {
    const res = await fetch("/api/devices/revoke-oldest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) throw new Error("revoke-oldest failed");
  }

  /** ===================== Flux Auth sans OTP ===================== */
  async function onConnectContinue() {
    try {
      setChecking(true);
      const state = await apiCheck(phone);
      setAuthState(state);

      if (state.deviceKnown) {
        // appareil déjà autorisé => connexion immédiate
        try {
          localStorage.setItem("ob_connected", "1");
          if (phone) localStorage.setItem("oneboarding.phoneE164", phone); // 🔗 propagation du phone
        } catch {}
        setConnected(true);
        emit("ob:connected-changed");
        toast(t.AUTH.WELCOME_OK);
        setAuthOpen(false);
        return;
      }

      if (!state.hasAnyDevice) {
        // aucun appareil encore — première activation => choisir plan
        setAuthOpen(false);
        setActivateOpen(true);
        return;
      }

      // il existe >=1 device pour ce phone, mais pas celui-ci => flux 1 €
      const max = state.maxDevices || MAX_DEVICES_DEFAULT;
      const limitReached = state.deviceCount >= max;
      setRevokeOldest(limitReached);
      setAuthOpen(false);
      setOneEuroOpen(true);
    } catch (e) {
      toast(t.AUTH.ERROR);
    } finally {
      setChecking(false);
    }
  }

  async function onAuthorizeOneEuro() {
    try {
      setChecking(true);

      if (revokeOldest) {
        await apiRevokeOldest(phone);
      }

      await apiAuthorizeDeviceOneEuro(phone, revokeOldest);
      await apiMarkDeviceAuthorized(phone);

      // connexion & statut + phone persisté
      try {
        localStorage.setItem("ob_connected", "1");
        if (phone) localStorage.setItem("oneboarding.phoneE164", phone); // 🔗 propagation du phone
      } catch {}

      setConnected(true);

      emit("ob:connected-changed");
      toast(t.AUTH.WELCOME_OK);
      setOneEuroOpen(false);
    } catch (e) {
      toast(t.AUTH.ERROR);
    } finally {
      setChecking(false);
    }
  }

  async function onActivatePlan(kind: "subscription" | "one-month") {
    try {
      setChecking(true);
      const planSet = await apiStartPlan(kind, phone);
      await apiMarkDeviceAuthorized(phone);

      // statut local + phone persisté
      try {
        localStorage.setItem("ob_connected", "1");
        if (phone) localStorage.setItem("oneboarding.phoneE164", phone); // 🔗 propagation du phone
      } catch {}
      writeJSON("oneboarding.spaceActive", true);
      writeJSON("oneboarding.plan", planSet);

      setConnected(true);
      setSpaceActive(true);
      setPlan(planSet);

      emit("ob:connected-changed");
      emit("ob:space-activated");
      emit("ob:plan-changed");

      toast(t.AUTH.SPACE_OK);
      setActivateOpen(false);
    } catch (e) {
      toast(t.AUTH.ERROR);
    } finally {
      setChecking(false);
    }
  }

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

      {/* ====== AUTH MODALS (sans OTP) ====== */}

      {/* Connexion : saisir le téléphone → check serveur */}
      {authOpen && (
        <div className="fixed inset-0 z-[120] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeAuthModals} />
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t.AUTH.CONNECT_TITLE}</h2>
              <button
                onClick={closeAuthModals}
                className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <label className="text-sm block mt-4 mb-1">{t.AUTH.PHONE_LABEL}</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white outline-none"
              placeholder={t.AUTH.PHONE_PH}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <p className="text-xs opacity-80 mt-3">{t.AUTH.CONNECT_INFO}</p>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={closeAuthModals}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
              >
                {t.AUTH.CANCEL}
              </button>
              <button
                onClick={onConnectContinue}
                disabled={!phone.trim() || checking}
                className="px-4 py-2 rounded-2xl bg-white text-black font-semibold hover:bg-gray-100 disabled:opacity-60"
              >
                {checking ? "…" : t.AUTH.CONNECT_BTN}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Première activation : choisir le plan */}
      {activateOpen && (
        <div className="fixed inset-0 z-[121] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeAuthModals} />
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t.AUTH.ACTIVATE_TITLE}</h2>
              <button
                onClick={closeAuthModals}
                className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <ToggleRow label={t.AUTH.PLAN_SUB} onClick={() => onActivatePlan("subscription")} checking={checking} />
              <ToggleRow label={t.AUTH.PLAN_ONE} onClick={() => onActivatePlan("one-month")} checking={checking} />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setActivateOpen(false);
                  setAuthOpen(true);
                }}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
              >
                {t.AUTH.BACK}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Autorisation 1 € (2e/3e/4e appareil) */}
      {oneEuroOpen && (
        <div className="fixed inset-0 z-[122] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeAuthModals} />
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t.AUTH.ONE_EURO_TITLE}</h2>
              <button
                onClick={closeAuthModals}
                className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
              >
                ✕
              </button>
            </div>

            <p className="text-sm opacity-90 mt-3">{t.AUTH.ONE_EURO_LEAD}</p>

            {/* Hint limite atteinte */}
            {authState && authState.deviceCount >= (authState.maxDevices || MAX_DEVICES_DEFAULT) && (
              <div className="mt-3 p-3 rounded-xl border border-yellow-400/30 bg-yellow-300/15 text-yellow-100">
                {t.AUTH.REVOKE_OLDEST_HINT.replaceAll("{max}", String(authState.maxDevices || MAX_DEVICES_DEFAULT))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <input
                id="revokeOldest"
                type="checkbox"
                className="h-4 w-4"
                checked={revokeOldest}
                onChange={(e) => setRevokeOldest(e.target.checked)}
                disabled={authState ? authState.deviceCount >= (authState.maxDevices || MAX_DEVICES_DEFAULT) : false}
              />
              <label htmlFor="revokeOldest" className="text-sm">
                {t.AUTH.REVOKE_OPT_LABEL}
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={onAuthorizeOneEuro}
                disabled={checking}
                className="px-4 py-2 rounded-2xl bg-white text-black font-semibold hover:bg-gray-100 disabled:opacity-60"
              >
                {checking ? "…" : t.AUTH.PAY_BTN}
              </button>
            </div>
          </div>
        </div>
      )}

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

/** ToggleRow pour sélection plan */
function ToggleRow({
  label,
  onClick,
  checking,
}: {
  label: string;
  onClick: () => void;
  checking?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={checking}
      className="w-full text-left px-4 py-3 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 disabled:opacity-60"
    >
      {label}
    </button>
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
    <main className="px-4 py-4 mx-auto w-full max-w-2xl text-black">
      <h1 className="text-xl font-bold mb-4">{t.title}</h1>
      <article dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-4 leading-6">
        {t.sections.map((s: LegalSection, i: number) => {
          if (s.kind === "hr") return <hr key={i} className="border-black/10 my-2" />;
          if (s.kind === "h2")
            return (
              <h2 key={i} className="text-lg font-semibold mt-4">
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
              <ul key={i} className="list-disc pl-5 space-y-1.5 opacity-90">
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
