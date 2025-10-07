"use client";

import { useEffect, useRef, useState } from "react";
import PhoneField from "./PhoneField";

type ControlledProps = { open?: boolean; onClose?: () => void };

export default function SubscribeModal(props: ControlledProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // mode contrôlé OU autonome
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = props.open ?? internalOpen;
  const onClose = () => {
    if (props.onClose) props.onClose();
    else setInternalOpen(false);
  };

  const [e164, setE164] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* --------- Ouverture via évènement global --------- */
  useEffect(() => {
    const onAct = () => setInternalOpen(true);
    window.addEventListener("ob:open-activate", onAct);
    return () => window.removeEventListener("ob:open-activate", onAct);
  }, []);

  /* --------- Sync <dialog> natif --------- */
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

  /* --------- Envoi OTP (WhatsApp) --------- */
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
      const j = await res.json();

      if (!res.ok || !j?.ok) {
        setError(j?.error || "Erreur OTP");
        return;
      }

      // mémoriser téléphone + fenêtre de validité (5 min)
      const expiresAt = Date.now() + 5 * 60 * 1000;
      try {
        localStorage.setItem("oneboarding.phoneE164", e164);
        localStorage.setItem("oneboarding.otpExpiresAt", String(expiresAt));
      } catch {}

      // notifier le reste de l’app (CodeAccessDialog, etc.)
      window.dispatchEvent(
        new CustomEvent("ob:otp-sent", { detail: { phoneE164: e164, expiresAt } })
      );

      alert("Code envoyé via WhatsApp.");
      onClose();
    } catch {
      setError("SERVER_ERROR");
    } finally {
      setSending(false);
    }
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
            <h2 className="text-xl font-semibold">Créer / activer mon espace</h2>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

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
        </div>
      </dialog>
    </>
  );
}
