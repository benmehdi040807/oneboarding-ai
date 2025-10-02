"use client";
import React, { useEffect, useMemo, useState } from "react";

const COUNTRIES = [
  { cc: "+212", flag: "🇲🇦", name: "Maroc", dropLeadingZero: true },
  { cc: "+33",  flag: "🇫🇷", name: "France", dropLeadingZero: true },
  { cc: "+1",   flag: "🇺🇸", name: "USA/Canada", dropLeadingZero: false },
];

function assembleE164(cc: string, local: string, dropLeadingZero: boolean) {
  const digits = local.replace(/\D+/g, "");
  const normalized = dropLeadingZero && digits.startsWith("0") ? digits.slice(1) : digits;
  return `${cc}${normalized}`;
}

export default function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem("oba.phone");
      if (saved) {
        const j = JSON.parse(saved);
        const found = COUNTRIES.find((c) => c.cc === j.cc) || COUNTRIES[0];
        setCountry(found);
        setLocalNumber(j.local || "");
      }
    } catch {}
  }, [open]);

  const e164 = useMemo(
    () => assembleE164(country.cc, localNumber, country.dropLeadingZero),
    [country, localNumber]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-base font-semibold">Accéder à mon espace</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15" aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="p-5 grid gap-3">
          <div className="grid grid-cols-[8.5rem,1fr] gap-2">
            <select
              className="px-3 py-3 rounded-xl bg-white/10 border border-white/15 focus:outline-none"
              value={country.cc}
              onChange={(e) => {
                const next = COUNTRIES.find((c) => c.cc === e.target.value)!;
                setCountry(next);
              }}
              aria-label="Préfixe"
            >
              {COUNTRIES.map((c) => (
                <option key={c.cc} value={c.cc}>
                  {c.flag} {c.name} ({c.cc})
                </option>
              ))}
            </select>
            <input
              inputMode="tel"
              placeholder="Téléphone (sans le 0 après l’indicatif)"
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/15 focus:outline-none"
              value={localNumber}
              onChange={(e) => setLocalNumber(e.target.value)}
            />
          </div>

          <p className="text-xs opacity-80">
            Format envoyé : <span className="font-mono">{e164}</span>
            {country.dropLeadingZero && localNumber.trim().startsWith("0")
              ? " (le 0 est retiré automatiquement)"
              : ""}
          </p>

          <button
            disabled={loading || !localNumber.trim()}
            onClick={async () => {
              setLoading(true);
              try {
                localStorage.setItem("oba.phone", JSON.stringify({ cc: country.cc, local: localNumber }));
                const res = await fetch("/api/auth/send-otp", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone: e164, channel: "whatsapp" }),
                });
                if (!res.ok) throw new Error("send-otp failed");
                alert("Code envoyé. Ouvre WhatsApp puis reviens saisir le code (écran à ajouter).");
                onClose();
              } catch (e) {
                alert("Envoi impossible pour le moment.");
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-3 rounded-xl bg-[var(--accent)] text-black font-semibold hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Envoi…" : "Recevoir le code"}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
