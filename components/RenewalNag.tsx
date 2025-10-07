// components/RenewalNag.tsx
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
 *    • oneboarding.nagDismissedAt -> ms epoch (historique – non bloquant)
 *    • (session) oneboarding.nagDismissed.session -> "1" pour ne pas réafficher dans l'onglet courant
 *
 * Visibilité:
 * – Si plan = "subscription"  -> jamais.
 * – Si plan = "one-month" et Date.now() >= nagAt -> afficher (sauf si dismiss session).
 * – Si expiré (Date.now() > activeUntil) -> texte adapté "Accès expiré".
 */

const PLAN_KEY = "oneboarding.plan";
const UNTIL_KEY = "oneboarding.activeUntil";
const NAG_AT_KEY = "oneboarding.renewalNagAt";
const PHONE_KEY = "oneboarding.phoneE164";
const DISMISS_LOCAL_KEY = "oneboarding.nagDismissedAt";
const DISMISS_SESSION_KEY = "oneboarding.nagDismissed.session";

// RgpdBanner utilise ce key côté localStorage
const RGPD_CONSENT_KEY = "oneboarding.rgpdConsent";

type Plan = "one-month" | "subscription" | null;

export default function RenewalNag() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const [visible, setVisible] = useState(false);

  // marquer la session (optionnel)
  useEffect(() => {
    setMounted(true);
  }, []);

  // rafraîchit "now" toutes les 60s pour refléter l'écoulement du temps
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // lecture des états persistés
  const state = useMemo(() => {
    if (!mounted) {
      return {
        plan: null as Plan,
        activeUntil: null as number | null,
        nagAt: null as number | null,
        dismissedAt: null as number | null,
        phone: "",
      };
    }
    try {
      const plan = (localStorage.getItem(PLAN_KEY) as Plan) ?? null;

      const activeUntilStr = localStorage.getItem(UNTIL_KEY);
      const activeUntil = activeUntilStr ? Number(activeUntilStr) : null;

      const nagAtStr = localStorage.getItem(NAG_AT_KEY);
      const nagAt = nagAtStr ? Number(nagAtStr) : null;

      const dismissedStr = localStorage.getItem(DISMISS_LOCAL_KEY);
      const dismissedAt = dismissedStr ? Number(dismissedStr) : null;

      const phone = localStorage.getItem(PHONE_KEY) || "";

      return { plan, activeUntil, nagAt, dismissedAt, phone };
    } catch {
      return {
        plan: null as Plan,
        activeUntil: null,
        nagAt: null,
        dismissedAt: null,
        phone: "",
      };
    }
  }, [mounted, now]);

  // détecter si la barre RGPD est (probablement) visible → décaler la bannière
  const rgpdVisible = useMemo(() => {
    if (!mounted) return false;
    try {
      const consent = localStorage.getItem(RGPD_CONSENT_KEY) === "1";
      const onLegal = typeof window !== "undefined" && window.location.pathname.startsWith("/legal");
      return !consent && !onLegal;
    } catch {
      return true; // par défaut on suppose visible pour éviter le chevauchement
    }
  }, [mounted]);

  // calcule la visibilité
  useEffect(() => {
    if (!mounted) return;

    const { plan, nagAt } = state;

    // 1) Abonnement : jamais de bannière
    if (plan !== "one-month") {
      setVisible(false);
      return;
    }

    // 2) Si l'utilisateur a fermé la bannière durant CETTE session, ne pas réafficher
    try {
      if (sessionStorage.getItem(DISMISS_SESSION_KEY) === "1") {
        setVisible(false);
        return;
      }
    } catch {
      // ignore
    }

    // 3) Afficher si on a atteint le seuil de rappel
    setVisible(Boolean(nagAt && now >= nagAt));
  }, [mounted, state, now]);

  if (!mounted || !visible) return null;

  const expired = Boolean(state.activeUntil && now > (state.activeUntil as number));

  const daysLeft = (() => {
    if (!state.activeUntil) return null;
    const ms = state.activeUntil - now;
    if (ms <= 0) return 0;
    return Math.ceil(ms / (24 * 60 * 60 * 1000));
  })();

  function closeNag() {
    try {
      localStorage.setItem(DISMISS_LOCAL_KEY, String(Date.now())); // trace historique (non bloquant)
      sessionStorage.setItem(DISMISS_SESSION_KEY, "1"); // blocage durant l'onglet courant
    } catch {
      // ignore
    }
    setVisible(false);
  }

  function openPayment() {
    window.dispatchEvent(
      new CustomEvent("ob:open-payment", {
        detail: { phoneE164: state.phone || undefined },
      })
    );
  }

  const bottomPx = rgpdVisible ? 92 : 18; // décale si la barre RGPD est affichée

  return (
    <>
      <style jsx>{`
        .nag {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          width: min(720px, 92vw);
          z-index: 2147483190; /* au-dessus de la plupart des overlays, en dessous d’un éventuel 2147483200 */
          background: rgba(255, 255, 255, 0.94);
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
          background: rgba(0, 0, 0, 0.06);
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

      <div className="nag" style={{ bottom: bottomPx }}>
        <div className="nag-inner">
          <div>
            <div className="nag-title">
              {expired ? "Accès expiré" : "Votre accès se termine bientôt"}
            </div>
            <div className="nag-sub">
              {expired
                ? "Renouvelez pour reprendre vos échanges sans interruption."
                : daysLeft !== null
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
