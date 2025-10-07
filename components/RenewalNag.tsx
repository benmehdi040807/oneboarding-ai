"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * RenewalNag
 * – Affiche un rappel lorsque la période "one-month" arrive à échéance.
 * – Se base sur localStorage:
 *    • oneboarding.plan           -> "one-month" | "subscription"
 *    • oneboarding.activeUntil    -> ms epoch (fin d'accès)
 *    • oneboarding.renewalNagAt   -> ms epoch (3 jours avant la fin – posé par PaymentModal)
 *    • oneboarding.phoneE164      -> identifiant (facultatif, pour l'event)
 * – Dismiss:
 *    • oneboarding.nagDismissedAt -> ms epoch (bannière masquée jusqu'à la prochaine session)
 *
 * Visibilité:
 * – Si plan = "subscription"  -> jamais.
 * – Si plan = "one-month" et Date.now() >= nagAt -> afficher.
 * – Si expiré (Date.now() > activeUntil) -> texte adapté "Accès expiré".
 */

export default function RenewalNag() {
  const [now, setNow] = useState<number>(() => Date.now());
  const [visible, setVisible] = useState(false);

  // lecture des états persistés
  const state = useMemo(() => {
    try {
      const plan = localStorage.getItem("oneboarding.plan") as
        | "subscription"
        | "one-month"
        | null;

      const activeUntilStr = localStorage.getItem("oneboarding.activeUntil");
      const activeUntil = activeUntilStr ? Number(activeUntilStr) : null;

      const nagAtStr = localStorage.getItem("oneboarding.renewalNagAt");
      const nagAt = nagAtStr ? Number(nagAtStr) : null;

      const dismissedStr = localStorage.getItem("oneboarding.nagDismissedAt");
      const dismissedAt = dismissedStr ? Number(dismissedStr) : null;

      const phone = localStorage.getItem("oneboarding.phoneE164") || "";

      return { plan, activeUntil, nagAt, dismissedAt, phone };
    } catch {
      return {
        plan: null,
        activeUntil: null,
        nagAt: null,
        dismissedAt: null,
        phone: "",
      };
    }
  }, [now]);

  // rafraîchit "now" toutes les 60s pour refléter l'écoulement du temps
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // calcule la visibilité
  useEffect(() => {
    const { plan, nagAt, dismissedAt } = state;
    if (plan !== "one-month") {
      setVisible(false);
      return;
    }
    if (dismissedAt && dismissedAt > performance.timing?.navigationStart) {
      // banniere fermée durant cette session
      setVisible(false);
      return;
    }
    if (nagAt && now >= nagAt) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [state, now]);

  if (!visible) return null;

  const expired =
    !!state.activeUntil && now > (state.activeUntil as number);

  const daysLeft = (() => {
    if (!state.activeUntil) return null;
    const ms = state.activeUntil - now;
    if (ms <= 0) return 0;
    return Math.ceil(ms / (24 * 60 * 60 * 1000));
  })();

  function closeNag() {
    try {
      localStorage.setItem("oneboarding.nagDismissedAt", String(Date.now()));
    } catch {}
    setVisible(false);
  }

  function openPayment() {
    window.dispatchEvent(
      new CustomEvent("ob:open-payment", {
        detail: { phoneE164: state.phone || undefined },
      })
    );
  }

  return (
    <>
      <style jsx>{`
        .nag {
          position: fixed;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          width: min(720px, 92vw);
          z-index: 50;
          background: rgba(255, 255, 255, 0.92);
          color: #0b1b2b;
          border: 1px solid rgba(11, 27, 43, 0.12);
          border-radius: 16px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
          backdrop-filter: saturate(120%) blur(4px);
        }
        .nag-inner {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          padding: 12px 12px 12px 16px;
          align-items: center;
        }
        .nag-title {
          font-weight: 700;
          margin-bottom: 2px;
        }
        .nag-sub {
          font-size: 13px;
          opacity: 0.8;
        }
        .nag-actions {
          display: flex;
          gap: 8px;
        }
        .btn {
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 600;
          border: 1px solid rgba(11, 27, 43, 0.12);
          background: #ffffff;
        }
        .btn-primary {
          color: #fff;
          border: none;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
        }
        .btn-ghost {
          background: rgba(0, 0, 0, 0.04);
        }
        @media (max-width: 460px) {
          .nag-inner {
            grid-template-columns: 1fr;
          }
          .nag-actions {
            justify-content: flex-end;
          }
        }
      `}</style>

      <div className="nag">
        <div className="nag-inner">
          <div>
            <div className="nag-title">
              {expired ? "Accès expiré" : "Votre accès se termine bientôt"}
            </div>
            <div className="nag-sub">
              {expired
                ? "Renouvelez pour reprendre vos échanges sans interruption."
                : daysLeft
                ? `Il reste environ ${daysLeft} jour(s). Prolongez en un clic.`
                : "Fin imminente. Prolongez en un clic."}
            </div>
          </div>

          <div className="nag-actions">
            <button className="btn btn-ghost" onClick={closeNag}>
              Plus tard
            </button>
            <button className="btn btn-primary" onClick={openPayment}>
              Prolonger maintenant
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
