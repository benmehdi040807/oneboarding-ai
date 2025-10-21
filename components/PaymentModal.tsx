// components/PaymentModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Plan = "subscription" | "one-month";

type OpenEventDetail = {
  phoneE164?: string;
  plan?: Plan;                // si présent => activation plan
  confirmOneEur?: boolean;    // si true & pas de plan => autorisation 1 €
  revokeOldest?: boolean;     // optionnel, seulement pour l'autorisation 1 €
};

type Props = {
  open?: boolean;
  onClose?: () => void;
  plan?: Plan;            // pré-sélection (mode contrôlé)
  phoneE164?: string;     // identifiant (mode contrôlé)
};

const PHONE_KEY = "oneboarding.phoneE164";

// Utils deviceId (pour API 1€)
function uuid4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
const DEVICE_ID_KEY = "oneboarding.deviceId";
function getOrCreateDeviceId(): string {
  try {
    const cur = localStorage.getItem(DEVICE_ID_KEY);
    if (cur) return cur;
    const id = uuid4();
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return "device-fallback";
  }
}

export default function PaymentModal(props: Props) {
  const controlled = typeof props.open === "boolean";
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // état open & contexte d’appel
  const [open, setOpen] = useState<boolean>(Boolean(props.open));
  const [e164, setE164] = useState<string>(props.phoneE164 || "");
  const [pickedPlan, setPickedPlan] = useState<Plan>(props.plan || "subscription");

  // mode d’opération
  const [isPlanActivation, setIsPlanActivation] = useState<boolean>(Boolean(props.plan));
  const [isOneEuroAuth, setIsOneEuroAuth] = useState<boolean>(false);
  const [revokeOldest, setRevokeOldest] = useState<boolean>(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // seed e164 depuis LS si non fourni (montage)
  useEffect(() => {
    if (!e164) {
      try {
        const lsPhone = localStorage.getItem(PHONE_KEY) || "";
        if (lsPhone) setE164(lsPhone);
      } catch {}
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ==================== Ouverture via évènement global ==================== */
  useEffect(() => {
    const handler = (e: Event) => {
      if (controlled) return; // en mode contrôlé, on ignore l’event
      const ce = e as CustomEvent<OpenEventDetail>;
      const detail = ce.detail || {};

      // phone
      if (detail.phoneE164) {
        setE164(detail.phoneE164);
        try { localStorage.setItem(PHONE_KEY, detail.phoneE164); } catch {}
      } else {
        try {
          const lsPhone = localStorage.getItem(PHONE_KEY) || "";
          if (lsPhone) setE164(lsPhone);
        } catch {}
      }

      // routing du flux
      if (detail.plan) {
        setPickedPlan(detail.plan);
        setIsPlanActivation(true);
        setIsOneEuroAuth(false);
      } else if (detail.confirmOneEur) {
        setIsPlanActivation(false);
        setIsOneEuroAuth(true);
      } else {
        // si rien n’est fourni, on reste en activation plan par défaut
        setIsPlanActivation(true);
        setIsOneEuroAuth(false);
      }

      setRevokeOldest(Boolean(detail.revokeOldest));

      setErr(null);
      setOpen(true);
      setTimeout(() => dialogRef.current?.showModal(), 0);
    };

    window.addEventListener("ob:open-payment", handler as EventListener);
    return () => window.removeEventListener("ob:open-payment", handler as EventListener);
  }, [controlled]);

  /* ==================== Suivre props en mode contrôlé ===================== */
  useEffect(() => {
    if (!controlled) return;

    // phone
    if (typeof props.phoneE164 === "string") {
      setE164(props.phoneE164);
      try { if (props.phoneE164) localStorage.setItem(PHONE_KEY, props.phoneE164); } catch {}
    }

    // plan -> activation
    if (props.plan) {
      setPickedPlan(props.plan);
      setIsPlanActivation(true);
      setIsOneEuroAuth(false);
    }

    // open/close
    if (props.open && !dialogRef.current?.open) {
      setOpen(true);
      dialogRef.current?.showModal();
    } else if (!props.open && dialogRef.current?.open) {
      setOpen(false);
      dialogRef.current?.close();
    }
  }, [controlled, props.open, props.plan, props.phoneE164]);

  /* ============================== Fermer modal ============================ */
  function closeInternal() {
    if (controlled) props.onClose?.();
    else {
      setOpen(false);
      dialogRef.current?.close();
    }
  }
  function onBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const d = dialogRef.current;
    if (!d) return;
    const r = d.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeInternal();
  }
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onCancel = (e: Event) => { e.preventDefault(); closeInternal(); };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, []);
  useEffect(() => {
    if (!controlled && open && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [controlled, open]);

  /* =============================== API calls ============================== */
  async function apiStartPlan(kind: Plan, phoneE164: string): Promise<{ ok: true; approvalUrl: string }> {
    const res = await fetch("/api/pay/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // côté /api/pay/start : { kind, phone } uniquement
      body: JSON.stringify({ kind, phone: phoneE164 }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out?.ok) {
      const msg = out?.error || `HTTP_${res.status}`;
      throw new Error(msg);
    }
    return out as { ok: true; approvalUrl: string };
  }

  async function apiAuthorizeDeviceOneEuro(
    phoneE164: string,
    revoke: boolean
  ): Promise<{ ok: true; approvalUrl?: string; paymentRef?: string }> {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch("/api/pay/authorize-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneE164, deviceId, revokeOldest: revoke }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out?.ok) {
      const msg = out?.error || `HTTP_${res.status}`;
      throw new Error(msg);
    }
    return out as { ok: true; approvalUrl?: string; paymentRef?: string };
  }

  /* ============================= Actions flux ============================= */
  async function onConfirmPlan() {
    setErr(null);
    setLoading(true);
    try {
      const p = (e164 || "").trim();
      if (!p.startsWith("+") || p.length < 6) {
        setErr("Numéro invalide (format E.164).");
        setLoading(false);
        return;
      }

      // lancer la création de la souscription PayPal
      const out = await apiStartPlan(pickedPlan, p);

      // si approvalUrl → rediriger (le retour + webhook finalisent l’activation)
      if (out.approvalUrl) {
        window.location.href = out.approvalUrl;
        return;
      }

      // fallback “dev/demo” : succès local
      window.dispatchEvent(
        new CustomEvent("ob:subscription-active", {
          detail: {
            status: "active",
            plan: pickedPlan,
            deviceId: getOrCreateDeviceId(),
            source: "PaymentModal",
          },
        })
      );
      closeInternal();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  async function onAuthorizeOneEuro() {
    setErr(null);
    setLoading(true);
    try {
      const p = (e164 || "").trim();
      if (!p.startsWith("+") || p.length < 6) {
        setErr("Numéro invalide (format E.164).");
        setLoading(false);
        return;
      }

      const out = await apiAuthorizeDeviceOneEuro(p, revokeOldest);

      if (out.approvalUrl) {
        window.location.href = out.approvalUrl; // retour/webhook → ob:device-authorized
        return;
      }

      // fallback “dev/demo”
      window.dispatchEvent(
        new CustomEvent("ob:device-authorized", {
          detail: {
            status: "active",
            phoneE164: p,
            deviceId: getOrCreateDeviceId(),
            planActive: true,
            paymentRef: out?.paymentRef,
            source: "PaymentModal",
          } as const,
        })
      );
      closeInternal();
    } catch (e: any) {
      if (e?.message === "NO_USER") {
        setErr("Compte introuvable. Utilisez « Activer mon espace » pour choisir un plan.");
      } else {
        setErr(e?.message || "Erreur inconnue.");
      }
    } finally {
      setLoading(false);
    }
  }

  /* ================================= UI ================================== */
  const title = isPlanActivation ? "Activer mon espace" : "Autoriser cet appareil (1 €)";
  const subtitle = isPlanActivation
    ? "Choisissez librement votre formule."
    : "Pour sécuriser votre espace, nous confirmons votre identité (1 €) et ajoutons cet appareil.";

  return (
    <>
      <style>{`
        dialog::backdrop{
          background:rgba(0,0,0,.45);
          -webkit-backdrop-filter:saturate(120%) blur(2px);
          backdrop-filter:saturate(120%) blur(2px);
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

          {isPlanActivation && (
            <>
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
                    <div className="text-xs text-black/60">Accès continu, sans interruption.</div>
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
                    <div className="text-xs text-black/60">Un mois complet, sans engagement.</div>
                  </div>
                </label>
              </div>

              {err && <div className="text-sm text-red-600 mb-2">{err}</div>}

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
                  onClick={onConfirmPlan}
                  disabled={loading}
                  className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow bg-black disabled:opacity-60"
                >
                  {loading ? "…" : "Confirmer"}
                </button>
              </div>
            </>
          )}

          {isOneEuroAuth && (
            <>
              {/* Note: aucune case 1€ ici (déjà traitée côté ConnectModal) */}
              {revokeOldest && (
                <div className="mb-3 p-3 rounded-xl border border-yellow-400/30 bg-yellow-300/15 text-black/85 text-sm">
                  Un ancien appareil sera révoqué automatiquement.
                </div>
              )}

              {err && <div className="text-sm text-red-600 mb-2">{err}</div>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeInternal}
                  className="flex-1 rounded-2xl border border-black/15 px-4 py-3"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onAuthorizeOneEuro}
                  disabled={loading}
                  className="flex-1 rounded-2xl px-4 py-3 text-white font-semibold shadow bg-black disabled:opacity-60"
                >
                  {loading ? "…" : "Autoriser (1 €)"}
                </button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
      }
