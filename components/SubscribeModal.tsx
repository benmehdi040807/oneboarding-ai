"use client";


import { useEffect, useRef, useState } from "react";
import PhoneField from "./PhoneField";


/* -------------------------------------------------------------------------- /
/                                    Types                                   /
/ -------------------------------------------------------------------------- */
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


/* -------------------------------------------------------------------------- /
/                             Utils & Local Storage                          /
/ -------------------------------------------------------------------------- */
function safeSet(k: string, v: string) {
try { localStorage.setItem(k, v); } catch {}
}
function safeGet(k: string): string {
try { return localStorage.getItem(k) || ""; } catch { return ""; }
}


/* -------------------------------------------------------------------------- /
/                                 Composant                                  /
/ -------------------------------------------------------------------------- */
export default function SubscribeModal(props: ControlledProps) {
const dialogRef = useRef<HTMLDialogElement | null>(null);


// Mode contrôlé OU autonome (événements)
const [internalOpen, setInternalOpen] = useState(false);
const isOpen = props.open ?? internalOpen;


const closeAll = () => {
if (props.onClose) props.onClose();
else setInternalOpen(false);
// reset doux
setStep("phone");
setE164(safeGet("oneboarding.phoneE164"));
setConfirmOneEur(false);
setError(null);
};


/* --------------------------------- États --------------------------------- */
const [step, setStep] = useState("phone");
const [e164, setE164] = useState(safeGet("oneboarding.phoneE164"));
const [confirmOneEur, setConfirmOneEur] = useState(false);
const [error, setError] = useState<string | null>(null);


/* ------------------------ Ouverture via évènement ------------------------- */
useEffect(() => {
const onAct = () => setInternalOpen(true);
window.addEventListener("ob:open-activate", onAct);
return () => window.removeEventListener("ob:open-activate", onAct);
}, []);


/* ------ Écoute de l'activation réussie pour passage direct connecté ------- */
useEffect(() => {
// Quand le PaymentModal (ou backend) confirme l'abonnement actif,
// il doit émettre: new CustomEvent("ob:subscription-active", {detail})
const onActive = (e: Event) => {
const detail = (e as CustomEvent).detail;
if (!detail) return;
if (detail.status === "active") {
// Propager un évènement unique pour le passage en mode connecté global
window.dispatchEvent(new CustomEvent("ob:set-connected", {
detail: {
phoneE164: e164,
plan: detail.plan,
deviceId: detail.deviceId,
customerId: detail.customerId,
paymentRef: detail.paymentRef,
source: "SubscribeModal"
}
}));
closeAll();
}
};
window.addEventListener("ob:subscription-active", onActive as EventListener);
return () => window.removeEventListener("ob:subscription-active", onActive as EventListener);
}, [e164]);


/* --------------------------- Sync 
 natif -------------------------- */
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


const onBackdropClick = (e: React.MouseEvent) => {
const d = dialogRef.current;
if (!d) return;
const r = d.getBoundingClientRect();
const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
if (!inside) closeAll();
};


/* ------------------------------ Navigation UI ----------------------------- */
function goPlan() {
setError(null);
if (!e164 || !e164.startsWith("+") || e164.length < 6) {
setError("Numéro de téléphone invalide (format E.164, ex : +2126…).");
return;
}
safeSet("oneboarding.phoneE164", e164);
setStep("plan");
}


function pickPlan(plan: Plan) {
setError(null);
if (!confirmOneEur) {
setError("Veuillez confirmer l'autorisation de vérification 1 € pour activer immédiatement votre espace.");
return;
}
// Ouvre le PaymentModal en lui passant le numéro + plan + consentement 1 €
window.dispatchEvent(new CustomEvent("ob:open-payment", { detail: { phoneE164: e164, plan, confirmOneEur: true } }));
// La fermeture se fera quand on recevra ob:subscription-active (succès) ou immédiatement si on préfère :
// closeAll();
}


/* ---------------------------------- JSX ---------------------------------- */
return (
<>



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

      {/* Étape 2 — Plan */}
      {step === "plan" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => pickPlan("subscription")}
            className="w-full text-left rounded-2xl border border-black/10 p-4 hover:bg-black/[0.03]"
          >
            <div className="font-semibold">Abonnement — 5 €/mois</div>
            <div className="text-sm text-black/60">Accès continu, sans interruption.</div>
          </button>

          <button
            type="button"
            onClick={() => pickPlan("one-month")}
            className="w-full text-left rounded-2xl border border-black/10 p-4 hover:bg-black/[0.03]"
          >
            <div className="font-semibold">Accès libre — 5 €</div>
            <div className="text-sm text-black/60">Un mois complet, sans engagement.</div>
          </button>

          {/* Consentement 1€ */}
          <label className="flex items-start gap-2 text-sm pt-1">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmOneEur}
              onChange={(e) => setConfirmOneEur(e.target.checked)}
            />
            <span>
              Je confirme l'autorisation d'un prélèvement de vérification de <strong>1 €</strong> si nécessaire (remboursé/ajusté). Ceci permet d'activer immédiatement mon espace.
            </span>
          </label>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="rounded-2xl border border-black/15 px-4 py-3"
            >
              Retour
            </button>
          </div>
        </div>
      )}
    </div>
  </dialog>
</>



);
      }
