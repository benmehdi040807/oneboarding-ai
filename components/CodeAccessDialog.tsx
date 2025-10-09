"use client";

import { useEffect, useRef, useState } from "react";

type ControlledProps = { open?: boolean; onClose?: () => void };

export default function CodeAccessDialog(props: ControlledProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // contrôlé (props.open) OU autonome (évènements)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = props.open ?? internalOpen;
  const close = () => {
    if (props.onClose) props.onClose();
    else setInternalOpen(false);
  };

  const [phoneE164, setPhoneE164] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // gestion expiration OTP
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0); // en secondes

  /* ---------- Ouverture auto quand l’OTP vient d’être envoyé ---------- */
  useEffect(() => {
    const onOtpSent = (e: Event) => {
      const det = (e as CustomEvent).detail || {};
      const ph = String(det.phoneE164 || localStorage.getItem("oneboarding.phoneE164") || "");
      const exp = Number(det.expiresAt || localStorage.getItem("oneboarding.otpExpiresAt") || 0);

      setPhoneE164(ph);
      if (exp) setExpiresAt(exp);
      setCode("");
      setError(null);
      setInternalOpen(true);
    };
    window.addEventListener("ob:otp-sent", onOtpSent);
    return () => window.removeEventListener("ob:otp-sent", onOtpSent);
  }, []);

  /* ---------- Sync <dialog> natif ---------- */
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
      close();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [close]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const d = dialogRef.current;
    if (!d) return;
    const r = d.getBoundingClientRect();
    const inside =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;
    if (!inside) close();
  };

  /* ---------- Compte à rebours (5 min) ---------- */
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const sec = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemaining(sec);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  /* ---------- Vérification OTP ---------- */
  async function verify() {
    setError(null);

    if (!phoneE164) {
      setError("Numéro requis.");
      return;
    }
    if (!code) {
      setError("Code requis.");
      return;
    }
    if (expiresAt && Date.now() > expiresAt) {
      setError("Code expiré. Veuillez redemander un nouveau code.");
      return;
    }

    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneE164, code }),
    });
    const j = await res.json();

    if (!res.ok || !j.ok) {
      setError(j.error || "Code invalide");
      return;
    }

    // état local "connecté" (pré-paiement)
    try {
      localStorage.setItem("ob_connected", "1");
      localStorage.setItem("ob_token", String(j.token || ""));
      localStorage.setItem("oneboarding.phoneE164", phoneE164);
    } catch {}

    // 🔔 Normaliser les events pour le Menu
    window.dispatchEvent(new Event("ob:connected"));
    window.dispatchEvent(new Event("ob:auth-changed"));

    // ouvrir le paiement (abonnement / libre)
    window.dispatchEvent(
      new CustomEvent("ob:open-payment", { detail: { phoneE164 } })
    );

    close();
  }

  /* ---------- Renvoyer un code ---------- */
  async function resend() {
    setError(null);
    if (!phoneE164) {
      setError("Numéro requis pour renvoyer le code.");
      return;
    }
    const res = await fetch("/api/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneE164 }),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) {
      setError(j.error || "Erreur lors de l’envoi du code.");
      return;
    }
    const exp = Date.now() + 5 * 60 * 1000;
    try {
      localStorage.setItem("oneboarding.otpExpiresAt", String(exp));
    } catch {}
    setExpiresAt(exp);
    setCode("");
    alert("Nouveau code envoyé.");
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const expired = expiresAt ? Date.now() > expiresAt : false;

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
            <h2 className="text-xl font-semibold">Se connecter</h2>
            <button
              type="button"
              onClick={close}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <label className="block text-sm">Numéro (E.164)</label>
            <input
              className="w-full rounded-2xl border border-black/10 px-4 py-3 font-mono"
              placeholder="+2126…"
              value={phoneE164}
              onChange={(e) => setPhoneE164(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <label className="block text-sm">Code d’accès</label>
              {expiresAt ? (
                <span className={`text-xs ${expired ? "text-red-600" : "text-black/60"}`}>
                  {expired ? "Expiré" : `Expire dans ${mm}:${ss}`}
                </span>
              ) : null}
            </div>

            <input
              className="w-full rounded-2xl border border-black/10 px-4 py-3 font-mono uppercase"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Code reçu (ex: 4B5MPS)"
            />

            <button
              onClick={verify}
              className="w-full rounded-2xl px-4 py-3 text-white font-semibold"
              style={{ background: "linear-gradient(135deg,#F1C049,#B5892D)" }}
            >
              Valider
            </button>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="text-sm text-center">
              <button className="underline" onClick={resend}>
                Recevoir un nouveau code
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
