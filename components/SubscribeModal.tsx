"use client";
import React, { useEffect, useState } from "react";
import PhoneField from "@/components/PhoneField";

export default function SubscribeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone, setPhone] = useState<string | undefined>(); // e164
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem("oba.phone.e164");
      if (saved) setPhone(saved);
    } catch {}
  }, [open]);

  const canSubmit = firstName.trim() && lastName.trim() && phone;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-base font-semibold">Activer mon espace</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15" aria-label="Fermer">✕</button>
        </div>

        <div className="p-5 grid gap-3">
          <input
            placeholder="Prénom"
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/15 focus:outline-none"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            placeholder="Nom"
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/15 focus:outline-none"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <PhoneField value={phone} onChange={(v) => setPhone(v)} />

          <button
            disabled={loading || !canSubmit}
            onClick={async () => {
              if (!phone) return;
              setLoading(true);
              try {
                localStorage.setItem("oba.phone.e164", phone);
                const res = await fetch("/api/subscribe", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ firstName, lastName, phone }),
                });
                const data = await res.json();
                if (!res.ok || !data?.url) throw new Error(data?.error || "subscribe failed");
                window.location.href = data.url; // redirection Stripe Checkout
              } catch (e: any) {
                alert("Activation impossible pour le moment.");
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-3 rounded-xl bg-[var(--accent)] text-black font-semibold hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Redirection…" : "Activer mon espace"}
          </button>

          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
