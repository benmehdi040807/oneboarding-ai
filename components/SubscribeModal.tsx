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
type Plan = "subscription" | "one-month";
type Lang = "fr" | "en" | "ar";

type SubscriptionActiveDetail = {
  status: "active" | "pending" | "failed";
  plan: Plan;
  deviceId?: string;
  customerId?: string;
  paymentRef?: string;
};

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
    CHOICES_NOTE:
      "Vous choisirez ensuite votre formule :\n— Abonnement 5 €/mois • accès continu\n— Accès libre 5 € • 1 mois sans engagement",
    PLAN_SUB_TITLE: "Abonnement — 5 €/mois",
    PLAN_SUB_DESC: "Accès continu, sans interruption.",
    PLAN_ONE_TITLE: "Accès libre — 5 €",
    PLAN_ONE_DESC: "Un mois complet, sans engagement.",
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
    CHOICES_NOTE:
      "You will then choose your plan:\n— Subscription €5/month • continuous access\n— One-month pass €5 • no commitment",
    PLAN_SUB_TITLE: "Subscription — €5/month",
    PLAN_SUB_DESC: "Continuous access, no interruption.",
    PLAN_ONE_TITLE: "One-month pass — €5",
    PLAN_ONE_DESC: "Full month, no commitment.",
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
    CHOICES_NOTE:
      "ستختار خطتك لاحقًا:\n— اشتراك 5€/شهريًا • وصول مستمر\n— وصول لشهر 5€ • بدون التزام",
    PLAN_SUB_TITLE: "اشتراك — 5€/شهريًا",
    PLAN_SUB_DESC: "وصول مستمر دون انقطاع.",
    PLAN_ONE_TITLE: "وصول لشهر — 5€",
    PLAN_ONE_DESC: "شهر كامل، بدون التزام.",
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
 *
 * - Stocké dans localStorage
 * - Stable tant que le navigateur n'est pas réinitialisé
 * - Statistiquement unique à l'échelle mondiale (UUID v4)
 */
function getOrCreateDeviceId(): string | null {
  try {
    let existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.trim().length >= 8) {
      return existing;
    }

    let next: string;
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      next = crypto.randomUUID();
    } else {
      next = `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    localStorage.setItem(DEVICE_ID_KEY, next);
    return next;
  } catch {
    // Mode navigation très privé ou stockage désactivé
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
        setError(
          "Impossible d’identifier cet appareil. Vérifiez les paramètres de votre navigateur et réessayez."
        );
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
              aria-label="Fermer"
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
                    if (validatePhone(v.trim())) {
                      setError(null);
                    }
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

              <p className="text-[11px] whitespace-pre-wrap text-black/55 pt-1">
                {t.CHOICES_NOTE}
              </p>
            </div>
          )}

          {/* Étape 2 — Plan */}
          {step === "plan" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => startPlan("subscription")}
                disabled={loading}
                className="w-full text-left rounded-2xl border border-black/10 p-4 hover:bg-black/[0.03] disabled:opacity-60"
              >
                <div className="font-semibold">{t.PLAN_SUB_TITLE}</div>
                <div className="text-sm text-black/60">{t.PLAN_SUB_DESC}</div>
              </button>

              <button
                type="button"
                onClick={() => startPlan("one-month")}
                disabled={loading}
                className="w-full text-left rounded-2xl border border-black/10 p-4 hover:bg-black/[0.03] disabled:opacity-60"
              >
                <div className="font-semibold">{t.PLAN_ONE_TITLE}</div>
                <div className="text-sm text-black/60">{t.PLAN_ONE_DESC}</div>
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
