// components/SubscribeModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import PhoneField from "./PhoneField";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */
type ControlledProps = { open?: boolean; onClose?: () => void };
type Step = "phone" | "plan";
type Plan = "subscription" | "one-month";

type SubscriptionActiveDetail = {
  status: "active" | "pending" | "failed";
  plan: Plan;
  deviceId?: string;
  customerId?: string;
  paymentRef?: string;
};

/* -------------------------------------------------------------------------- */
/*                          LocalStorage helpers (safe)                       */
/* -------------------------------------------------------------------------- */
const LS_PHONE = "oneboarding.phoneE164";
const LS_PENDING_PLAN = "oneboarding.pendingPlanKind";

function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}
function lsGet(key: string, fallback = ""): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

/* -------------------------------------------------------------------------- */
/*                                 Composant                                  */
/* -------------------------------------------------------------------------- */
export default function SubscribeModal(props: ControlledProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Mode contrôlé OU autonome (via évènement global)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = props.open ?? internalOpen;

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

  /* ------ Écoute activation réussie → connexion + fermeture automatique ----- */
  useEffect(() => {
    // Emis par le bridge de retour PayPal / backend:
    // new CustomEvent("ob:subscription-active", { detail: { status:'active', plan, ... } })
    const onActive = (e: Event) => {
      const detail = (e as CustomEvent<SubscriptionActiveDetail>).detail;
      if (!detail) return;
      if (detail.status === "active") {
        // L’app globale s’aligne déjà dessus (Menu/Connect etc.)
        closeAll();
      }
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
    const onCancel = (e: Event) => { e.preventDefault(); closeAll(); };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, []);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const d = dialogRef.current;
    if (!d) return;
    const r = d.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeAll();
  };

  function closeAll() {
    if (props.onClose) props.onClose();
    else setInternalOpen(false);
    // reset doux
    setStep("phone");
    setE164(lsGet(LS_PHONE));
    setError(null);
    setLoading(false);
  }

  /* ------------------------------ Navigation UI ----------------------------- */
  function goPlan() {
    setError(null);
    const p = e164.trim();
    if (!p || !p.startsWith("+") || p.length < 6) {
      setError("Numéro de téléphone invalide (format E.164, ex : +2126…).");
      return;
    }
    lsSet(LS_PHONE, p);
    setStep("plan");
  }

  async function startPlan(plan: Plan) {
    try {
      setLoading(true);
      setError(null);

      const p = (e164 || "").trim();
      if (!p.startsWith("+") || p.length < 6) {
        setError("Numéro de téléphone invalide (format E.164, ex : +2126…).");
        setLoading(false);
        return;
      }

      // Contexte pour le bridge de retour PayPal
      lsSet(LS_PHONE, p);
      lsSet(LS_PENDING_PLAN, plan);

      // Appel backend: crée la souscription PayPal et nous renvoie l’approvalUrl
      const res = await fetch("/api/pay/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: plan, phone: p }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out?.ok || !out?.approvalUrl) {
        throw new Error(out?.error || `HTTP_${res.status}`);
      }

      // Redirection vers PayPal
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
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {step === "phone" ? "Créer / activer mon espace" : "Choisir ma formule"}
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
              <div className="text-xs text-black/70">
                Identité = <strong>numéro de téléphone</strong>. Aucun nom/prénom requis.
              </div>

              <PhoneField
                value={e164}
                onChange={(v) => { setE164(v); setError(null); }}
              />

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeAll}
                  className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={goPlan}
                  className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow"
                  style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}
                >
                  Suivant
                </button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <p className="text-[11px] text-black/55 pt-1">
                Vous choisirez ensuite votre formule :
                <br />— Abonnement 5 €/mois • accès continu
                <br />— Accès libre 5 € • 1 mois sans engagement
              </p>
            </div>
          )}

          {/* Étape 2 — Plan (+ démarrage paiement PayPal) */}
          {step === "plan" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => startPlan("subscription")}
                disabled={loading}
                className="w-full text-left rounded-2xl border border-black/10 p-4 hover:bg-black/[0.03] disabled:opacity-60"
              >
                <div className="font-semibold">Abonnement — 5 €/mois</div>
                <div className="text-sm text-black/60">Accès continu, sans interruption.</div>
              </button>

              <button
                type="button"
                onClick={() => startPlan("one-month")}
                disabled={loading}
                className="w-full text-left rounded-2xl border border-black/10 p-4 hover:bg-black/[0.03] disabled:opacity-60"
              >
                <div className="font-semibold">Accès libre — 5 €</div>
                <div className="text-sm text-black/60">Un mois complet, sans engagement.</div>
              </button>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="rounded-2xl border border-black/15 px-4 py-3"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={closeAll}
                  className="rounded-2xl border border-black/15 px-4 py-3"
                >
                  Fermer
                </button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
