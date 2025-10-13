"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PhoneField from "./PhoneField";

/* ---------------------------------- Types --------------------------------- */
type ControlledProps = { open?: boolean; onClose?: () => void };
type Step = "phone" | "otp" | "plan" | "pay" | "done";

/* ---------------------------- Config / constantes -------------------------- */
// Remplace éventuellement par NEXT_PUBLIC_PAYPAL_CLIENT_ID côté env.
const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "Ad9cT5EGq-SucUJdXa34W15H3HM9yKIMsvlxQYvMGbqMkEKclxqYyDApu72omOnJ5vZfWKM5jc5_O6FM";

const PLAN_IDS = {
  CONTINU:  "P-7GF41509YY620912GNDWF45A", // 5 € / mois (reconduit)
  PASS1MOIS:"P-75W60632650625151NDWUY6Q", // 5 € / 30 jours (non reconduit)
} as const;
type PlanKey = keyof typeof PLAN_IDS;

/* ----------------------------- Utilitaires DOM ---------------------------- */
function loadPayPalSdk(params: string): Promise<void> {
  return new Promise((resolve) => {
    // Déjà chargé ?
    // @ts-ignore
    if (window.paypal) return resolve();
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?${params}`;
    s.async = true;
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}

/* --------------------------------- Component ------------------------------ */
export default function SubscribeModal(props: ControlledProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Mode contrôlé OU autonome
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = props.open ?? internalOpen;
  const onClose = () => {
    if (props.onClose) props.onClose();
    else setInternalOpen(false);
    // reset soft
    setStep("phone");
    setError(null);
    setOtp("");
    setChoice("CONTINU");
  };

  /* ------------------------------- États UI -------------------------------- */
  const [step, setStep] = useState<Step>("phone");
  const [e164, setE164] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otp, setOtp] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [leftSec, setLeftSec] = useState<number>(0);

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

  /* -------------------------- Compte à rebours OTP ------------------------- */
  useEffect(() => {
    if (!otpExpiresAt) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
      setLeftSec(left);
      if (left === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [otpExpiresAt]);

  /* ----------------------------- Envoi du code ----------------------------- */
  async function requestOtp() {
    try {
      setSending(true);
      setError(null);
      if (!e164) {
        setError("Numéro requis.");
        return;
      }
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneE164: e164 }),
      });

      // Fallback développeur si l'API n'est pas prête
      if (!res.ok) {
        const devCode = "123456";
        console.info("[DEV] OTP simulé :", devCode);
        (window as any).__DEV_OTP__ = devCode;
      }

      const expiresAt = Date.now() + 5 * 60 * 1000;
      setOtpExpiresAt(expiresAt);
      try {
        localStorage.setItem("oneboarding.phoneE164", e164);
        localStorage.setItem("oneboarding.otpExpiresAt", String(expiresAt));
      } catch {}
      setStep("otp");
    } catch {
      setError("SERVER_ERROR");
    } finally {
      setSending(false);
    }
  }

  /* ---------------------------- Vérification OTP --------------------------- */
  async function verifyOtp() {
    try {
      setVerifying(true);
      setError(null);
      if (!otp) {
        setError("Entrez le code reçu.");
        return;
      }
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneE164: e164, code: otp }),
      });

      // Fallback DEV : accepte le code simulé
      if (!res.ok) {
        // @ts-ignore
        if ((window as any).__DEV_OTP__ && otp === (window as any).__DEV_OTP__) {
          setStep("plan");
          return;
        }
        setError("Code invalide.");
        return;
      }
      setStep("plan");
    } catch {
      setError("SERVER_ERROR");
    } finally {
      setVerifying(false);
    }
  }

  /* --------------------------- Rendu bouton PayPal ------------------------- */
  const paypalParams = useMemo(() => {
    // FR par défaut; le SDK affichera la langue du navigateur sinon.
    // On force vault+intent=subscription pour Subscriptions.
    return new URLSearchParams({
      "client-id": PAYPAL_CLIENT_ID,
      intent: "subscription",
      vault: "true",
    }).toString();
  }, []);

  useEffect(() => {
    if (step !== "pay") return;

    let cancelled = false;

    (async () => {
      await loadPayPalSdk(paypalParams);
      if (cancelled) return;

      // @ts-ignore
      const paypal = window.paypal;
      if (!paypalDivRef.current) return;

      // purge précédent rendu si on revient sur l'étape pay plusieurs fois
      paypalDivRef.current.innerHTML = "";

      paypal
        .Buttons({
          style: {
            color: "black",
            layout: "vertical",
            label: "subscribe",
            shape: "rect",
          },
          createSubscription: (_: any, actions: any) => {
            const plan_id = PLAN_IDS[choice];
            return actions.subscription.create({ plan_id });
          },
          onApprove: async (data: any) => {
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
            setStep("done");
          },
          onError: () => setError("Paiement interrompu. Réessayez."),
        })
        .render(paypalDivRef.current);
    })();

    return () => {
      cancelled = true;
    };
  }, [step, choice, paypalParams, e164]);

  /* --------------------------------- JSX ---------------------------------- */
  return (
    <>
      <style>{`dialog::backdrop{background:rgba(0,0,0,.45);-webkit-backdrop-filter:saturate(120%) blur(2px);backdrop-filter:saturate(120%) blur(2px);}`}</style>

      <dialog
        ref={dialogRef}
        onMouseDown={onBackdropClick}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg"
      >
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {step === "phone" && "Créer / activer mon espace"}
              {step === "otp" && "Confirmer mon code"}
              {step === "plan" && "Choisir ma formule"}
              {step === "pay" && "Paiement sécurisé"}
              {step === "done" && "Bienvenue !"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {/* PHONE */}
          {step === "phone" && (
            <div className="space-y-4">
              <div className="text-xs text-black/70">
                Identité = <strong>numéro de téléphone</strong> (WhatsApp). Aucun nom/prénom requis.
              </div>

              <PhoneField
                value={e164}
                onChange={(v) => {
                  setE164(v);
                  setError(null);
                }}
              />

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={!e164 || sending}
                  className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
                >
                  {sending ? "Envoi…" : "Recevoir mon code"}
                </button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="text-[11px] text-black/55 pt-1">
                Après validation du code (5 min), vous choisirez votre formule :
                <br />— Abonnement 5 €/mois • accès continu
                <br />— Accès libre 5 € • 1 mois sans engagement
              </div>
            </div>
          )}

          {/* OTP */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="text-sm text-black/70">
                Entrez le code reçu par WhatsApp pour <span className="font-mono">{e164}</span>.
                {leftSec > 0 && (
                  <span className="ml-2 text-black/60">({Math.floor(leftSec / 60)}:{String(leftSec % 60).padStart(2, "0")} restantes)</span>
                )}
              </div>

              <input
                inputMode="numeric"
                maxLength={6}
                placeholder="Code à 6 chiffres"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                className="w-full rounded-2xl border border-black/15 px-4 py-3 font-mono tracking-widest text-center"
              />

              <div className="pt-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={!otp || verifying}
                  className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
                >
                  {verifying ? "Vérification…" : "Valider"}
                </button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}
              {/* Aide dev */}
              <div className="text-[11px] text-black/45">
                Vous n’avez rien reçu ? (dev) essayez le code <code className="font-mono">123456</code>.
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
                    <div className="font-semibold">Abonnement mensuel continu — 5 € / mois</div>
                    <div className="text-sm text-black/60">Renouvellement automatique. Résiliation à tout moment.</div>
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
                    <div className="font-semibold">Pass 1 mois — 5 € / 30 jours</div>
                    <div className="text-sm text-black/60">Paiement unique. Non reconduit.</div>
                  </div>
                </label>
              </fieldset>

              <div className="pt-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("otp")}
                  className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => setStep("pay")}
                  className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow"
                  style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
                >
                  Continuer vers le paiement
                </button>
              </div>
            </div>
          )}

          {/* PAY */}
          {step === "pay" && (
            <div className="space-y-4">
              <div className="text-sm text-black/70">
                Paiement sécurisé via PayPal — {choice === "CONTINU" ? "Abonnement 5 € / mois" : "Pass 1 mois 5 €"}.
              </div>

              <div ref={paypalDivRef} />

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setStep("plan")}
                  className="rounded-2xl border border-black/15 px-4 py-3 w-full"
                >
                  Retour au choix des formules
                </button>
              </div>
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="space-y-4">
              <div className="text-lg font-semibold">Activation réussie 🎉</div>
              <div className="text-sm text-black/70">
                Votre espace OneBoarding AI est actif. Vous êtes maintenant connecté.
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl px-4 py-3 text-white font-semibold w-full"
                style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
              >
                Continuer
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
