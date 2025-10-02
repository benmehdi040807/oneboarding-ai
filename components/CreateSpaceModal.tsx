// components/CreateSpaceModal.tsx
import React, { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void; // appelé après vérif OTP (session créée)
};

export default function CreateSpaceModal({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(""); // ex: +2126XXXXXXX
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function sendOtp() {
    try {
      setLoading(true);
      const r = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, firstName, lastName }),
      });
      if (!r.ok) throw new Error("Echec envoi OTP");
      setStep("otp");
    } catch (e) {
      alert("Impossible d’envoyer le code. Vérifie le numéro.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    try {
      setLoading(true);
      const r = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, firstName, lastName }),
      });
      if (!r.ok) throw new Error("Code incorrect ou expiré");
      onCreated(); // session OK -> parent gère ➕ -> ✅
    } catch (e) {
      alert("Code incorrect ou expiré.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#15171b] p-5 shadow-xl">
        {step === "form" ? (
          <>
            <h3 className="text-lg font-semibold mb-4">Créer mon espace</h3>
            <div className="grid gap-3">
              <input
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-3 outline-none"
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-3 outline-none"
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-3 outline-none"
                placeholder="Téléphone (ex. +2126...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 hover:bg-white/15"
                onClick={sendOtp}
                disabled={loading}
              >
                {loading ? "Envoi..." : "Recevoir le code sur WhatsApp"}
              </button>
            </div>
            <div className="mt-4 text-right">
              <button className="text-sm opacity-80 hover:opacity-100" onClick={onClose}>
                Fermer
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-4">Vérification</h3>
            <div className="grid gap-3">
              <input
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-3 outline-none"
                placeholder="Code à 6 chiffres"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                className="rounded-xl bg-blue-600/90 text-white px-4 py-3 hover:bg-blue-600"
                onClick={verifyOtp}
                disabled={loading}
              >
                {loading ? "Validation..." : "Valider le code"}
              </button>
            </div>
            <div className="mt-4 text-right">
              <button className="text-sm opacity-80 hover:opacity-100" onClick={onClose}>
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
