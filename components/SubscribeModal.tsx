// components/SubscribeModal.tsx — VERSION 100% NATIF (FR) — sans OTP, sans SDK
"use client";

import { useEffect, useRef, useState } from "react";

type ControlledProps = { open?: boolean; onClose?: () => void };
type Step = "phone" | "plan";

export default function SubscribeModal(props: ControlledProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Ouverture contrôlée OU autonome (via event ob:open-activate)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = props.open ?? internalOpen;

  const [step, setStep] = useState<Step>("phone");
  const [e164, setE164] = useState("");
  const [choice, setChoice] = useState<"subscription" | "one-month">("subscription");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ecoute ouverture globale
  useEffect(() => {
    const onAct = () => setInternalOpen(true);
    window.addEventListener("ob:open-activate", onAct);
    return () => window.removeEventListener("ob:open-activate", onAct);
  }, []);

  // Sync <dialog> natif
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
      handleClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, []);

  function handleClose() {
    if (props.onClose) props.onClose();
    else setInternalOpen(false);
    // reset soft
    setStep("phone");
    setError(null);
    setSending(false);
  }

  function onBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const d = dialogRef.current;
    if (!d) return;
    const r = d.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) handleClose();
  }

  // Étape 1 → Étape 2
  async function continueFromPhone() {
    try {
      setSending(true);
      setError(null);
      if (!e164.trim()) {
        setError("Numéro requis.");
        return;
      }
      try { localStorage.setItem("oneboarding.phoneE164", e164.trim()); } catch {}
      setStep("plan");
    } finally {
      setSending(false);
    }
  }

  // Ouvre le modal de paiement "natif" (PaymentModal) + ferme celui-ci
  function goNativePayment(plan: "subscription" | "one-month") {
    try { localStorage.setItem("oneboarding.phoneE164", e164.trim()); } catch {}
    window.dispatchEvent(
      new CustomEvent("ob:open-payment", { detail: { phoneE164: e164.trim(), plan } })
    );
    handleClose();
  }

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
              {step === "phone" ? "Créer / activer mon espace" : "Activer votre espace"}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {/* ====== ÉTAPE 1 : NUMÉRO ====== */}
          {step === "phone" && (
            <div className="space-y-4">
              <div className="text-xs text-black/70">
                Identité = <strong>numéro de téléphone</strong>. Aucun nom/prénom requis.
              </div>

              <input
                value={e164}
                onChange={(e) => { setE164(e.target.value); setError(null); }}
                placeholder="+2126…"
                inputMode="tel"
                className="w-full rounded-2xl border border-black/15 px-4 py-3 font-mono"
              />

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={continueFromPhone}
                  disabled={!e164.trim() || sending}
                  className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
                >
                  {sending ? "…" : "Continuer"}
                </button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="text-[11px] text-black/55 pt-1">
                Après validation, votre appareil est autorisé automatiquement. Aucun code requis.
              </div>
            </div>
          )}

          {/* ====== ÉTAPE 2 : PLANS (NATIF) ====== */}
          {step === "plan" && (
            <div className="space-y-3">
              {/* Cartes cliquables */}
              <button
                onClick={() => goNativePayment("subscription")}
                className="w-full text-left rounded-2xl border border-black/10 bg-black/[0.04] hover:bg-black/[0.07] p-3"
              >
                <div className="font-semibold">Abonnement — 5 €/mois (accès continu, sans interruption)</div>
                <div className="text-sm text-black/60 mt-0.5">Renouvellement automatique. Résiliation à tout moment.</div>
              </button>

              <button
                onClick={() => goNativePayment("one-month")}
                className="w-full text-left rounded-2xl border border-black/10 bg-black/[0.04] hover:bg-black/[0.07] p-3"
              >
                <div className="font-semibold">Accès libre — 5 € (un mois complet, sans engagement)</div>
                <div className="text-sm text-black/60 mt-0.5">Paiement unique. Non reconduit.</div>
              </button>

              {/* Sélection + Continuer (optionnel) */}
              <div className="mt-2 rounded-xl border border-black/10 p-3">
                <div className="text-sm font-medium mb-2">Ou bien, sélectionner puis continuer :</div>
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={choice === "subscription"}
                      onChange={() => setChoice("subscription")}
                    />
                    <span>Abonnement</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={choice === "one-month"}
                      onChange={() => setChoice("one-month")}
                    />
                    <span>Accès libre</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => goNativePayment(choice)}
                    className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow"
                    style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
                  >
                    Continuer vers le paiement
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
              }
