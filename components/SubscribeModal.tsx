// components/SubscribeModal.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import PhoneField from "./PhoneField";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */
type ControlledProps = { open?: boolean; onClose?: () => void };
type Step = "phone" | "plan";
type Plan = "one-day" | "one-month" | "one-year" | "one-life";
type Lang = "fr" | "en" | "ar";

type SubscriptionActiveDetail = {
  status: "active" | "pending" | "failed";
  plan: Plan;
  deviceId?: string;
  customerId?: string;
  paymentRef?: string;
};

/* -------------------------------------------------------------------------- */
/*                           Offers (single source)                            */
/* -------------------------------------------------------------------------- */
const OFFERS: Record<Plan, { labelEn: string; tierEn: string; priceEUR: number }> = {
  "one-day": { labelEn: "One Day", tierEn: "Standard", priceEUR: 11 },
  "one-month": { labelEn: "One Month", tierEn: "Plus", priceEUR: 31 },
  "one-year": { labelEn: "One Year", tierEn: "Gold", priceEUR: 300 },
  "one-life": { labelEn: "One Life", tierEn: "Signature", priceEUR: 31_000 },
};

function fmtEUR(n: number) {
  // simple & stable, avoids i18n locale surprises
  const s = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${s} €`;
}

function offerTitle(plan: Plan) {
  const o = OFFERS[plan];
  return `${o.labelEn} — ${fmtEUR(o.priceEUR)}`;
}

/* -------------------------------------------------------------------------- */
/*                               i18n (simple)                                */
/* -------------------------------------------------------------------------- */
const I18N: Record<Lang, any> = {
  fr: {
    TITLE_PHONE: "Créer / activer mon espace",
    TITLE_PLAN: "Choisir ma formule",
    ID_NOTE: "Identité = numéro de téléphone. Aucun nom/prénom requis.",
    CANCEL: "Annuler",
    NEXT: "Suivant",
    BACK: "Retour",
    CLOSE: "Fermer",
    INVALID_PHONE: "Vérifiez votre numéro et réessayez.",
    DEVICE_ID_ERROR:
      "Impossible d’identifier cet appareil. Vérifiez les paramètres de votre navigateur et réessayez.",
    CHOICES_NOTE:
      "Vous choisirez ensuite votre formule :\n— One Day (Standard)\n— One Month (Plus)\n— One Year (Gold)\n— One Life (Signature)",
    PLAN_DAY_DESC: "Active l’accès pour 24 heures.",
    PLAN_MONTH_DESC: "Active l’accès pour un mois complet.",
    PLAN_YEAR_DESC: "Active l’accès pour une année complète.",
    PLAN_LIFE_DESC: "Active l’accès à vie.",
  },
  en: {
    TITLE_PHONE: "Create / activate my space",
    TITLE_PLAN: "Choose my plan",
    ID_NOTE: "Identity = phone number. No first/last name required.",
    CANCEL: "Cancel",
    NEXT: "Next",
    BACK: "Back",
    CLOSE: "Close",
    INVALID_PHONE: "Check your number and try again.",
    DEVICE_ID_ERROR:
      "Unable to identify this device. Check your browser settings and try again.",
    CHOICES_NOTE:
      "You will then choose your plan:\n— One Day (Standard)\n— One Month (Plus)\n— One Year (Gold)\n— One Life (Signature)",
    PLAN_DAY_DESC: "Activates access for 24 hours.",
    PLAN_MONTH_DESC: "Activates access for a full month.",
    PLAN_YEAR_DESC: "Activates access for a full year.",
    PLAN_LIFE_DESC: "Activates lifetime access.",
  },
  ar: {
    TITLE_PHONE: "إنشاء / تفعيل مساحتي",
    TITLE_PLAN: "اختيار الخطة",
    ID_NOTE: "الهوية = رقم الهاتف. لا حاجة لاسم أو لقب.",
    CANCEL: "إلغاء",
    NEXT: "التالي",
    BACK: "رجوع",
    CLOSE: "إغلاق",
    INVALID_PHONE: "تحقّق من رقمك وحاول مرة أخرى.",
    DEVICE_ID_ERROR: "تعذّر تحديد هذا الجهاز. تحقّق من إعدادات المتصفح وحاول مرة أخرى.",
    CHOICES_NOTE:
      "ستختار خطتك لاحقًا:\n— One Day (Standard)\n— One Month (Plus)\n— One Year (Gold)\n— One Life (Signature)",
    PLAN_DAY_DESC: "يُفعّل الوصول لمدة 24 ساعة.",
    PLAN_MONTH_DESC: "يُفعّل الوصول لمدة شهر كامل.",
    PLAN_YEAR_DESC: "يُفعّل الوصول لمدة سنة كاملة.",
    PLAN_LIFE_DESC: "يُفعّل الوصول مدى الحياة.",
  },
};

/* -------------------------------------------------------------------------- */
/*                          LocalStorage helpers (safe)                       */
/* -------------------------------------------------------------------------- */
const LS_PHONE = "oneboarding.phoneE164";
const LS_PENDING_PLAN = "oneboarding.pendingPlanKind";
const DEVICE_ID_KEY = "oneboarding.deviceId";

function lsSet(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {}
}
function lsGet(key: string, fallback = ""): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Génère ou récupère l'identifiant technique de l'appareil
 * propre à OneBoarding AI (app-device-id).
 */
function getOrCreateDeviceId(): string | null {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.trim().length >= 8) return existing;

    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(DEVICE_ID_KEY, next);
    return next;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Composant                                  */
/* -------------------------------------------------------------------------- */
export default function SubscribeModal(props: ControlledProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = props.open ?? internalOpen;

  /* --------------------------------- Langue --------------------------------- */
  const [lang, setLang] = useState<Lang>("fr");
  const t = useMemo(() => I18N[lang], [lang]);
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    try {
      setLang((localStorage.getItem("oneboarding.lang") as Lang) || "fr");
    } catch {}
  }, []);

  useEffect(() => {
    const onLang = (e: Event) => {
      const l = (e as CustomEvent).detail?.lang as Lang | undefined;
      if (l) setLang(l);
      else {
        try {
          setLang((localStorage.getItem("oneboarding.lang") as Lang) || "fr");
        } catch {}
      }
    };
    window.addEventListener("ob:lang-changed", onLang as EventListener);
    return () => window.removeEventListener("ob:lang-changed", onLang as EventListener);
  }, []);

  /* --------------------------------- États --------------------------------- */
  const [step, setStep] = useState<Step>("phone");
  const [e164, setE164] = useState<string>(() => lsGet(LS_PHONE));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ------------------------ Ouverture via évènement ------------------------- */
  useEffect(() => {
    const onAct = () => setInternalOpen(true);
    window.addEventListener("ob:open-activate", onAct);
    return () => window.removeEventListener("ob:open-activate", onAct);
  }, []);

  /* ------ Écoute activation réussie → fermeture automatique ----- */
  useEffect(() => {
    const onActive = (e: Event) => {
      const detail = (e as CustomEvent<SubscriptionActiveDetail>).detail;
      if (!detail) return;
      if (detail.status === "active") closeAll();
    };
    window.addEventListener("ob:subscription-active", onActive as EventListener);
    return () => window.removeEventListener("ob:subscription-active", onActive as EventListener);
  }, []);

  /* --------------------------- Sync <dialog> natif -------------------------- */
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (isOpen && !d.open) d.showModal();
    else if (!isOpen && d.open) d.close();
  }, [isOpen]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      closeAll();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, []);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const d = dialogRef.current;
    if (!d) return;
    const r = d.getBoundingClientRect();
    const inside =
      e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeAll();
  };

  function closeAll() {
    if (props.onClose) props.onClose();
    else setInternalOpen(false);
    setStep("phone");
    setE164(lsGet(LS_PHONE));
    setError(null);
    setLoading(false);
  }

  /* ------------------------------ Navigation UI ----------------------------- */
  function validatePhone(p: string) {
    return p && p.startsWith("+") && p.length >= 10;
  }

  function goPlan() {
    const p = e164.trim();
    if (!validatePhone(p)) {
      setError(t.INVALID_PHONE);
      return;
    }
    setError(null);
    lsSet(LS_PHONE, p);
    setStep("plan");
  }

  async function startPlan(plan: Plan) {
    try {
      setLoading(true);
      const p = (e164 || "").trim();

      if (!validatePhone(p)) {
        setError(t.INVALID_PHONE);
        setLoading(false);
        return;
      }

      const deviceId = getOrCreateDeviceId();
      if (!deviceId) {
        setError(t.DEVICE_ID_ERROR);
        setLoading(false);
        return;
      }

      setError(null);
      lsSet(LS_PHONE, p);
      lsSet(LS_PENDING_PLAN, plan);

      const res = await fetch("/api/pay/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: plan, phone: p, deviceId }),
      });

      const out = await res.json().catch(() => ({} as any));
      if (!res.ok || !out?.ok || !out?.approvalUrl) {
        throw new Error(out?.error || `HTTP_${res.status}`);
      }

      window.location.href = out.approvalUrl as string;
    } catch (e: any) {
      setError(e?.message || "Impossible de démarrer le paiement.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------------------------- JSX ---------------------------------- */
  return (
    <>
      <style>{`dialog::backdrop{background:rgba(0,0,0,.45);-webkit-backdrop-filter:saturate(120%) blur(2px);backdrop-filter:saturate(120%) blur(2px);}`}</style>

      <dialog
        ref={dialogRef}
        onMouseDown={onBackdropClick}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg"
      >
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl" dir={dir}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {step === "phone" ? t.TITLE_PHONE : t.TITLE_PLAN}
            </h2>
            <button
              type="button"
              onClick={closeAll}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label={t.CLOSE}
            >
              ×
            </button>
          </div>

          {/* Étape 1 — Numéro */}
          {step === "phone" && (
            <div className="space-y-4">
              <div className="text-xs text-black/70">{t.ID_NOTE}</div>

              {/* Champ de téléphone forcé en LTR */}
              <div dir="ltr">
                <PhoneField
                  value={e164}
                  onChange={(v) => {
                    setE164(v);
                    if (validatePhone(v.trim())) setError(null);
                  }}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600" role="status" aria-live="polite">
                  {error}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeAll}
                  className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
                >
                  {t.CANCEL}
                </button>
                <button
                  type="button"
                  onClick={goPlan}
                  className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow"
                  style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
                >
                  {t.NEXT}
                </button>
              </div>

              <p className="text-[11px] whitespace-pre-wrap text-black/55 pt-1">{t.CHOICES_NOTE}</p>
            </div>
          )}

          {/* Étape 2 — Formule */}
          {step === "plan" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => startPlan("one-day")}
                disabled={loading}
                className="w-full text-left rounded-2xl border border-black/10 p-4 hover:bg-black/[0.03] disabled:opacity-60"
              >
                <div className="font-semibold">{offerTitle("one-day")}</div>
                <div className="text-sm text-black/60">{t.PLAN_DAY_DESC}</div>
              </button>

              <button
                type="button"
                onClick={() => startPlan("one-month")}
                disabled={loading}
                className="w-full text-left rounded-2xl border border-black/10 p-4 hover:bg-black/[0.03] disabled:opacity-60"
              >
                <div className="font-semibold">{offerTitle("one-month")}</div>
                <div className="text-sm text-black/60">{t.PLAN_MONTH_DESC}</div>
              </button>

              <button
                type="button"
                onClick={() => startPlan("one-year")}
                disabled={loading}
                className="w-full text-left rounded-2xl border border-black/10 p-4 hover:bg-black/[0.03] disabled:opacity-60"
              >
                <div className="font-semibold">{offerTitle("one-year")}</div>
                <div className="text-sm text-black/60">{t.PLAN_YEAR_DESC}</div>
              </button>

              <button
                type="button"
                onClick={() => startPlan("one-life")}
                disabled={loading}
                className="w-full text-left rounded-2xl border border-black/10 p-4 hover:bg-black/[0.03] disabled:opacity-60"
              >
                <div className="font-semibold">{offerTitle("one-life")}</div>
                <div className="text-sm text-black/60">{t.PLAN_LIFE_DESC}</div>
              </button>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="rounded-2xl border border-black/15 px-4 py-3"
                >
                  {t.BACK}
                </button>
                <button
                  type="button"
                  onClick={closeAll}
                  className="rounded-2xl border border-black/15 px-4 py-3"
                >
                  {t.CLOSE}
                </button>
              </div>

              {error && (
                <div className="text-sm text-red-600" role="status" aria-live="polite">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
              }
