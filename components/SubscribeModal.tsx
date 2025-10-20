// components/SubscribeModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------------------------- Types --------------------------------- */
type ControlledProps = { open?: boolean; onClose?: () => void };
type Step = "phone" | "plan" | "pay" | "done";
type Lang = "fr" | "en" | "ar";

/* ---------------------------- i18n (inline) -------------------------------- */
const I18N: Record<Lang, {
  DIR: "ltr" | "rtl";
  TITLE: { phone: string; plan: string; pay: string; done: string };
  PHONE: {
    hint1: string; placeholder: string;
    cancel: string; next: string; nextLoading: string; foot: string;
  };
  PLAN: {
    monthlyTitle: string; monthlySub: string;
    oneoffTitle: string; oneoffSub: string;
    back: string; next: string;
  };
  PAY: {
    leadMonthly: string; leadOneoff: string;
    back: string; errorLoad: string; errorInterrupted: string;
  };
  DONE: { h: string; p: string; cta: string };
  ERR: { numRequired: string; cfgIncomplete: (missing: string[]) => string };
}> = {
  fr: {
    DIR: "ltr",
    TITLE: {
      phone: "Créer / activer mon espace",
      plan: "Choisir ma formule",
      pay: "Paiement sécurisé",
      done: "Bienvenue !",
    },
    PHONE: {
      hint1: "Identité = numéro de téléphone. Aucun nom/prénom requis.",
      placeholder: "+2126…",
      cancel: "Annuler",
      next: "Continuer",
      nextLoading: "…",
      foot: "Après validation du paiement, votre appareil est autorisé automatiquement.",
    },
    PLAN: {
      monthlyTitle: "Abonnement mensuel continu — 5 € / mois",
      monthlySub: "Renouvellement automatique. Résiliation à tout moment.",
      oneoffTitle: "Pass 1 mois — 5 € / 30 jours",
      oneoffSub: "Paiement unique. Non reconduit.",
      back: "Retour",
      next: "Continuer vers le paiement",
    },
    PAY: {
      leadMonthly: "Paiement sécurisé via PayPal — Abonnement 5 € / mois.",
      leadOneoff: "Paiement sécurisé via PayPal — Pass 1 mois 5 €.",
      back: "Retour au choix des formules",
      errorLoad: "Impossible de charger PayPal. Réessayez.",
      errorInterrupted: "Paiement interrompu. Réessayez.",
    },
    DONE: {
      h: "Activation réussie 🎉",
      p: "Votre espace OneBoarding AI est actif. Vous êtes maintenant connecté.",
      cta: "Continuer",
    },
    ERR: {
      numRequired: "Numéro requis.",
      cfgIncomplete: (m) => `Configuration incomplète: ${m.join(", ")}. Merci d’ajouter ces variables d’environnement.`,
    },
  },
  en: {
    DIR: "ltr",
    TITLE: {
      phone: "Create / activate my space",
      plan: "Choose my plan",
      pay: "Secure payment",
      done: "Welcome!",
    },
    PHONE: {
      hint1: "Identity = phone number. No name required.",
      placeholder: "+1…",
      cancel: "Cancel",
      next: "Continue",
      nextLoading: "…",
      foot: "After payment, your device is authorized automatically.",
    },
    PLAN: {
      monthlyTitle: "Continuous monthly subscription — €5 / month",
      monthlySub: "Auto-renewal. Cancel anytime.",
      oneoffTitle: "One-month pass — €5 / 30 days",
      oneoffSub: "One-time payment. No renewal.",
      back: "Back",
      next: "Proceed to payment",
    },
    PAY: {
      leadMonthly: "Secure payment via PayPal — €5 / month (subscription).",
      leadOneoff: "Secure payment via PayPal — One-month pass €5.",
      back: "Back to plans",
      errorLoad: "Unable to load PayPal. Try again.",
      errorInterrupted: "Payment interrupted. Try again.",
    },
    DONE: {
      h: "Activation successful 🎉",
      p: "Your OneBoarding AI space is active. You are now signed in.",
      cta: "Continue",
    },
    ERR: {
      numRequired: "Phone number required.",
      cfgIncomplete: (m) => `Incomplete configuration: ${m.join(", ")}. Please set these environment variables.`,
    },
  },
  ar: {
    DIR: "rtl",
    TITLE: {
      phone: "إنشاء / تفعيل مساحتي",
      plan: "اختيار خطتي",
      pay: "دفع آمن",
      done: "أهلًا بك!",
    },
    PHONE: {
      hint1: "الهوية = رقم الهاتف. لا حاجة للاسم.",
      placeholder: "+2126…",
      cancel: "إلغاء",
      next: "متابعة",
      nextLoading: "…",
      foot: "بعد الدفع، يتم تفويض جهازك تلقائيًا.",
    },
    PLAN: {
      monthlyTitle: "اشتراك شهري مستمر — 5€ / الشهر",
      monthlySub: "تجديد تلقائي. إلغاء في أي وقت.",
      oneoffTitle: "صلاحية شهر — 5€ / 30 يومًا",
      oneoffSub: "دفعة واحدة. بلا تجديد.",
      back: "عودة",
      next: "المتابعة إلى الدفع",
    },
    PAY: {
      leadMonthly: "دفع آمن عبر PayPal — 5€ / شهريًا (اشتراك).",
      leadOneoff: "دفع آمن عبر PayPal — صلاحية شهر 5€.",
      back: "عودة لاختيار الخطة",
      errorLoad: "تعذّر تحميل PayPal. أعد المحاولة.",
      errorInterrupted: "انقطع الدفع. أعد المحاولة.",
    },
    DONE: {
      h: "تم التفعيل بنجاح 🎉",
      p: "مساحة OneBoarding AI الخاصة بك نشِطة. لقد تم تسجيل دخولك.",
      cta: "متابعة",
    },
    ERR: {
      numRequired: "الرقم مطلوب.",
      cfgIncomplete: (m) => `إعداد غير مكتمل: ${m.join(", ")}. يُرجى ضبط هذه المتغيّرات.`,
    },
  },
};

/* ---------------------------- Config / constantes -------------------------- */
// Env publics (Vercel / .env.local)
// → NEXT_PUBLIC_PAYPAL_CLIENT_ID
// → NEXT_PUBLIC_PP_PLAN_CONTINU
// → NEXT_PUBLIC_PP_PLAN_PASS1MOIS
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const PLAN_IDS = {
  CONTINU: process.env.NEXT_PUBLIC_PP_PLAN_CONTINU || "",
  PASS1MOIS: process.env.NEXT_PUBLIC_PP_PLAN_PASS1MOIS || "",
} as const;
type PlanKey = keyof typeof PLAN_IDS;

function assertEnv() {
  const missing: string[] = [];
  if (!PAYPAL_CLIENT_ID) missing.push("NEXT_PUBLIC_PAYPAL_CLIENT_ID");
  if (!PLAN_IDS.CONTINU) missing.push("NEXT_PUBLIC_PP_PLAN_CONTINU");
  if (!PLAN_IDS.PASS1MOIS) missing.push("NEXT_PUBLIC_PP_PLAN_PASS1MOIS");
  return missing;
}

/* ----------------------------- Utilitaires DOM ---------------------------- */
function loadPayPalSdk(params: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof window !== "undefined" && (window as any).paypal) return resolve();
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?${params}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("PAYPAL_SDK_LOAD_ERROR"));
    document.body.appendChild(s);
  });
}

/* --------------------------- LocalStorage helpers ------------------------- */
const PLAN_KEY = "oneboarding.plan";
const ACTIVE_KEY = "oneboarding.spaceActive";
const UNTIL_KEY = "oneboarding.activeUntil";
const NAG_AT_KEY = "oneboarding.renewalNagAt";
const PHONE_KEY = "oneboarding.phoneE164";

// 30 jours
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// Abonnement : horizon long (≈ 10 ans)
const SUBSCRIPTION_HORIZON_MS = 3650 * 24 * 60 * 60 * 1000;

/* --------------------------------- Component ------------------------------ */
export default function SubscribeModal(props: ControlledProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Langue (écoute + init depuis localStorage)
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("oneboarding.lang") as Lang) || "fr"; } catch { return "fr"; }
  });
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ lang?: Lang }>;
      const l = ce.detail?.lang || (localStorage.getItem("oneboarding.lang") as Lang) || "fr";
      setLang(l);
    };
    window.addEventListener("ob:lang-changed", handler as EventListener);
    return () => window.removeEventListener("ob:lang-changed", handler as EventListener);
  }, []);
  const t = I18N[lang];
  const dir = t.DIR;

  // Mode contrôlé OU autonome
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = props.open ?? internalOpen;
  const onClose = () => {
    if (props.onClose) props.onClose();
    else setInternalOpen(false);
    // reset soft
    setStep("phone");
    setError(null);
    setChoice("CONTINU");
    setE164("");
  };

  /* ------------------------------- États UI -------------------------------- */
  const [step, setStep] = useState<Step>("phone");
  const [e164, setE164] = useState("");
  const [sending, setSending] = useState(false); // pour le bouton “Continuer”
  const [error, setError] = useState<string | null>(null);

  const [choice, setChoice] = useState<PlanKey>("CONTINU");
  const paypalDivRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- Ouverture via évènement global (menu, CTA, etc.) ------- */
  useEffect(() => {
    const onAct = () => setInternalOpen(true);
    window.addEventListener("ob:open-activate", onAct);
    return () => window.removeEventListener("ob:open-activate", onAct);
  }, []);

  /* --------------------------- Sync <dialog> natif ------------------------- */
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
      onClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const d = dialogRef.current;
    if (!d) return;
    const r = d.getBoundingClientRect();
    const inside =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;
    if (!inside) onClose();
  };

  /* ------------------------ Passer Phone -> Plan (direct) ------------------- */
  async function continueFromPhone() {
    try {
      setSending(true);
      setError(null);
      if (!e164) {
        setError(t.ERR.numRequired);
        return;
      }

      // (Optionnel futur) interroger backend pour état du numéro.
      try { localStorage.setItem(PHONE_KEY, e164); } catch {}
      setStep("plan");
    } finally {
      setSending(false);
    }
  }

  /* --------------------------- Rendu bouton PayPal ------------------------- */
  const paypalParams = useMemo(() => {
    const locale =
      lang === "fr" ? "fr_FR" :
      lang === "ar" ? "ar_EG" :
      "en_US";
    return new URLSearchParams({
      "client-id": PAYPAL_CLIENT_ID,
      intent: "subscription",
      vault: "true",
      locale,
    }).toString();
  }, [lang]);

  useEffect(() => {
    if (step !== "pay") return;

    const missing = assertEnv();
    if (missing.length) {
      setError(t.ERR.cfgIncomplete(missing));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadPayPalSdk(paypalParams);
      } catch {
        if (!cancelled) setError(t.PAY.errorLoad);
        return;
      }
      if (cancelled) return;

      // @ts-ignore
      const paypal = window.paypal;
      if (!paypalDivRef.current) return;

      // purge précédent rendu si on revient sur l’étape pay
      paypalDivRef.current.innerHTML = "";

      paypal
        .Buttons({
          style: { color: "black", layout: "vertical", label: "subscribe", shape: "rect" },
          createSubscription: (_: any, actions: any) => {
            const plan_id = PLAN_IDS[choice];
            return actions.subscription.create({ plan_id });
          },
          onApprove: async (data: any) => {
            // Côté serveur : enregistrer la souscription
            try {
              await fetch("/api/paypal/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phoneE164: e164,
                  plan: choice,
                  subscriptionID: data.subscriptionID,
                }),
              });
            } catch {}

            // Côté client : poser les clés locales
            const now = Date.now();
            let activeUntil = now + THIRTY_DAYS_MS;
            let nagAt: number | null = activeUntil - 3 * 24 * 60 * 60 * 1000;

            if (choice === "CONTINU") {
              activeUntil = now + SUBSCRIPTION_HORIZON_MS;
              nagAt = null;
            }

            try {
              localStorage.setItem(PLAN_KEY, choice === "CONTINU" ? "subscription" : "one-month");
              localStorage.setItem(ACTIVE_KEY, "1");
              localStorage.setItem(UNTIL_KEY, String(activeUntil));
              if (nagAt) localStorage.setItem(NAG_AT_KEY, String(nagAt));
              else localStorage.removeItem(NAG_AT_KEY);
              if (e164) localStorage.setItem(PHONE_KEY, e164);
            } catch {}

            // 🔔 Signaux globaux
            window.dispatchEvent(new Event("ob:space-activated"));
            window.dispatchEvent(new Event("ob:connected"));
            window.dispatchEvent(new Event("ob:auth-changed"));

            setStep("done");
          },
          onError: () => setError(t.PAY.errorInterrupted),
        })
        .render(paypalDivRef.current);
    })();

    return () => {
      cancelled = true;
    };
  }, [step, choice, paypalParams, e164, t]);

  /* --------------------------------- JSX ---------------------------------- */
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
              {step === "phone" && t.TITLE.phone}
              {step === "plan" && t.TITLE.plan}
              {step === "pay" && t.TITLE.pay}
              {step === "done" && t.TITLE.done}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* PHONE — sans OTP */}
          {step === "phone" && (
            <div className="space-y-4">
              <div className="text-xs text-black/70">
                {t.PHONE.hint1}
              </div>

              <input
                value={e164}
                onChange={(e) => { setE164(e.target.value); setError(null); }}
                placeholder={t.PHONE.placeholder}
                inputMode="tel"
                className="w-full rounded-2xl border border-black/15 px-4 py-3 font-mono"
                dir="ltr"
              />

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
                >
                  {t.PHONE.cancel}
                </button>
                <button
                  type="button"
                  onClick={continueFromPhone}
                  disabled={!e164 || sending}
                  className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
                >
                  {sending ? t.PHONE.nextLoading : t.PHONE.next}
                </button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="text-[11px] text-black/55 pt-1">
                {t.PHONE.foot}
              </div>
            </div>
          )}

          {/* PLAN */}
          {step === "plan" && (
            <div className="space-y-4">
              <fieldset className="space-y-3">
                <label className="flex items-start gap-3 rounded-2xl border border-black/10 p-3">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={choice === "CONTINU"}
                    onChange={() => setChoice("CONTINU")}
                  />
                  <div>
                    <div className="font-semibold">{t.PLAN.monthlyTitle}</div>
                    <div className="text-sm text-black/60">
                      {t.PLAN.monthlySub}
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-black/10 p-3">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={choice === "PASS1MOIS"}
                    onChange={() => setChoice("PASS1MOIS")}
                  />
                  <div>
                    <div className="font-semibold">{t.PLAN.oneoffTitle}</div>
                    <div className="text-sm text-black/60">{t.PLAN.oneoffSub}</div>
                  </div>
                </label>
              </fieldset>

              <div className="pt-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
                >
                  {t.PLAN.back}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("pay")}
                  className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow"
                  style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
                >
                  {t.PLAN.next}
                </button>
              </div>
            </div>
          )}

          {/* PAY (PayPal Subscriptions) */}
          {step === "pay" && (
            <div className="space-y-4">
              <div className="text-sm text-black/70">
                {choice === "CONTINU" ? t.PAY.leadMonthly : t.PAY.leadOneoff}
              </div>

              <div ref={paypalDivRef} />

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setStep("plan")}
                  className="rounded-2xl border border-black/15 px-4 py-3 w-full"
                >
                  {t.PAY.back}
                </button>
              </div>
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="space-y-4">
              <div className="text-lg font-semibold">{t.DONE.h}</div>
              <div className="text-sm text-black/70">
                {t.DONE.p}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl px-4 py-3 text-white font-semibold w-full"
                style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
              >
                {t.DONE.cta}
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
          }
