// components/PaymentModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  open?: boolean;
  onClose?: () => void;
  plan?: "subscription" | "one-month";
  phoneE164?: string;
};

const PLAN_KEY = "oneboarding.plan";
const ACTIVE_KEY = "oneboarding.spaceActive";
const UNTIL_KEY = "oneboarding.activeUntil";
const NAG_AT_KEY = "oneboarding.renewalNagAt";
const PHONE_KEY = "oneboarding.phoneE164";

// 30 jours (approx. 30 * 24h)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// Abonnement : on met loin (10 ans)
const SUBSCRIPTION_HORIZON_MS = 3650 * 24 * 60 * 60 * 1000; // ≈ 10 ans

export default function PaymentModal(props: Props) {
  const controlled = typeof props.open === "boolean"; // si prop fournie, on la respecte
  const [open, setOpen] = useState<boolean>(Boolean(props.open));
  const [pickedPlan, setPickedPlan] = useState<"subscription" | "one-month">(
    props.plan || "subscription"
  );
  const [e164, setE164] = useState<string>(props.phoneE164 || "");

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // s’ouvrir via event global: window.dispatchEvent(new CustomEvent("ob:open-payment", { detail:{ phoneE164? }}))
  useEffect(() => {
    const handler = (e: Event) => {
      // si contrôlé par prop, on ignore l’event
      if (controlled) return;
      const ce = e as CustomEvent<{ phoneE164?: string }>;
      if (ce.detail?.phoneE164) setE164(ce.detail.phoneE164);
      setOpen(true);
      setTimeout(() => {
        dialogRef.current?.showModal();
      }, 0);
    };
    window.addEventListener("ob:open-payment", handler as EventListener);
    return () => window.removeEventListener("ob:open-payment", handler as EventListener);
  }, [controlled]);

  // suivre props.open quand on est en mode contrôlé
  useEffect(() => {
    if (!controlled) return;
    if (props.open && !dialogRef.current?.open) {
      setOpen(true);
      dialogRef.current?.showModal();
    } else if (!props.open && dialogRef.current?.open) {
      setOpen(false);
      dialogRef.current?.close();
    }
  }, [controlled, props.open]);

  // fermer côté interne
  function closeInternal() {
    if (controlled) {
      props.onClose?.();
    } else {
      setOpen(false);
      dialogRef.current?.close();
    }
  }

  // backdrop click
  function onBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const d = dialogRef.current;
    if (!d) return;
    const r = d.getBoundingClientRect();
    const inside =
      e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeInternal();
  }

  // ESC/CANCEL
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      closeInternal();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, []);

  // quand on passe en open=true (non contrôlé), ouvrir le <dialog>
  useEffect(() => {
    if (!controlled && open && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, [controlled, open]);

  // ---------- “Simulation” paiement (à remplacer par PayPal plus tard) ----------
  function confirmPayment() {
    const now = Date.now();

    const plan = pickedPlan;
    let activeUntil = now + THIRTY_DAYS_MS;
    let nagAt: number | null = activeUntil - 3 * 24 * 60 * 60 * 1000;

    if (plan === "subscription") {
      activeUntil = now + SUBSCRIPTION_HORIZON_MS;
      nagAt = null; // pas de rappel pour abonnement
    }

    try {
      localStorage.setItem(PLAN_KEY, plan);
      localStorage.setItem(ACTIVE_KEY, "1");
      localStorage.setItem(UNTIL_KEY, String(activeUntil));
      if (nagAt) {
        localStorage.setItem(NAG_AT_KEY, String(nagAt));
      } else {
        localStorage.removeItem(NAG_AT_KEY);
      }
      if (e164) localStorage.setItem(PHONE_KEY, e164);

      // pour homogénéité d’UI si d’autres composants écoutent :
      window.dispatchEvent(new Event("ob:space-activated"));
      window.dispatchEvent(new Event("ob:connected-changed"));

      // feedback simple pour cette étape “stub”
      alert(
        plan === "subscription"
          ? "✅ Espace activé (abonnement)."
          : "✅ Espace activé pour 1 mois."
      );
    } catch {
      // noop
    }

    closeInternal();
  }

  // Texte principal
  const title = "Activer mon espace";
  const subtitle =
    "Choisissez librement votre formule. L’accès est le même, la liberté aussi.";

  // Couleurs bouton primaire
  const primaryBg =
    pickedPlan === "subscription"
      ? "linear-gradient(135deg,#0EA5E9,#0284C7)"
      : "linear-gradient(135deg,#10B981,#059669)";

  return (
    <>
      <style>{`
        dialog::backdrop {
          background: rgba(0,0,0,.45);
          -webkit-backdrop-filter: saturate(120%) blur(2px);
          backdrop-filter: saturate(120%) blur(2px);
        }
      `}</style>

      <dialog
        ref={dialogRef}
        onMouseDown={onBackdropClick}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg"
      >
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              type="button"
              onClick={closeInternal}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <p className="text-sm text-black/70 mb-3">{subtitle}</p>

          {e164 ? (
            <p className="text-xs text-black/60 mb-3">
              Identifiant : <span className="font-mono">{e164}</span>
            </p>
          ) : null}

          {/* Choix des plans */}
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 rounded-2xl border border-black/10 p-3 hover:bg-black/[0.03] cursor-pointer">
              <input
                type="radio"
                name="plan"
                checked={pickedPlan === "subscription"}
                onChange={() => setPickedPlan("subscription")}
              />
              <div>
                <div className="font-semibold">Abonnement — 5 € / mois</div>
                <div className="text-xs text-black/60">
                  Accès continu, renouvellement automatique, sans interruption.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-black/10 p-3 hover:bg-black/[0.03] cursor-pointer">
              <input
                type="radio"
                name="plan"
                checked={pickedPlan === "one-month"}
                onChange={() => setPickedPlan("one-month")}
              />
              <div>
                <div className="font-semibold">Accès libre — 5 €</div>
                <div className="text-xs text-black/60">
                  Un mois complet, sans engagement.
                </div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={closeInternal}
              className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
            >
              Plus tard
            </button>
            <button
              type="button"
              onClick={confirmPayment}
              className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow"
              style={{ background: primaryBg }}
            >
              Confirmer
            </button>
          </div>

          {/* Note “stub” (à enlever quand PayPal branché) */}
          <p className="text-[11px] text-black/50 mt-3">
            Mode démo (sans paiement). Les clés d’activation sont posées localement.
          </p>
        </div>
      </dialog>
    </>
  );
    }
