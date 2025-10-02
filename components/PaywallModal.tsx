"use client";
import React, { useEffect } from "react";

export default function PaywallModal({
  open,
  firstName,
  onClose,
  onSubscribe,
}: {
  open: boolean;
  firstName?: string;
  onClose: () => void;
  onSubscribe: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-base font-semibold">
            {firstName ? `Bonjour ${firstName} !` : "Bienvenue !"}
          </h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15" aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="p-5 grid gap-3">
          <p className="opacity-90">
            Votre espace est maintenant <strong>actif</strong>.  
            Pour lancer vos interactions avec l’IA, activez votre abonnement.
          </p>

          <ul className="text-sm opacity-85 list-disc pl-5 space-y-1">
            <li>Réponses illimitées et plus rapides</li>
            <li>Historique synchronisé</li>
            <li>Accès prioritaire aux nouveautés</li>
          </ul>

          <button
            onClick={onSubscribe}
            className="mt-2 px-4 py-3 rounded-xl bg-[var(--accent)] text-black font-semibold hover:brightness-110"
          >
            Activer mon abonnement
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
