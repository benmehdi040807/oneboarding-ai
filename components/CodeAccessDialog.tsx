"use client";

import { useEffect, useRef, useState } from "react";

type Props = { open: boolean; onClose: () => void };

export default function CodeAccessDialog({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [phoneE164, setPhoneE164] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onCancel = (e: Event) => { e.preventDefault(); onClose(); };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const d = dialogRef.current; if (!d) return;
    const r = d.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) onClose();
  };

  async function verify() {
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneE164, code }),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) { setError(j.error || "Code invalide"); return; }
    localStorage.setItem("ob_connected", "1");
    localStorage.setItem("ob_token", j.token);
    window.dispatchEvent(new Event("ob:connected-changed"));
    onClose();
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
            <h2 className="text-xl font-semibold">Se connecter</h2>
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
            <label className="block text-sm">Numéro (E.164)</label>
            <input
              className="w-full rounded-2xl border border-black/10 px-4 py-3 font-mono"
              placeholder="+2126…"
              value={phoneE164}
              onChange={(e) => setPhoneE164(e.target.value)}
            />

            <label className="block text-sm">Code d’accès (5 min)</label>
            <input
              className="w-full rounded-2xl border border-black/10 px-4 py-3 font-mono uppercase"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
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
              <button
                className="underline"
                onClick={() => {
                  fetch("/api/otp/request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phoneE164 }),
                  })
                    .then((r) => r.json())
                    .then((j) => alert(j.ok ? "Nouveau code envoyé." : "Erreur: " + (j.error || "")));
                }}
              >
                Recevoir un nouveau code
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
