"use client";

import React from "react";
import PhoneInput, {
  isValidPhoneNumber,
} from "react-phone-number-input";
// ⚠️ NE PAS importer 'react-phone-number-input/style.css'
// On garde notre propre style (Tailwind / classes locales)

type PhoneFieldProps = {
  value: string;
  onChange: (val: string) => void;
  defaultCountry?: string;   // ex: "MA", "FR", "US"…
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  errorText?: string;
  label?: string;
};

export default function PhoneField({
  value,
  onChange,
  defaultCountry = "MA",
  disabled,
  id = "phone",
  name = "phone",
  required,
  errorText = "Numéro invalide",
  label = "Téléphone",
}: PhoneFieldProps) {
  const valid = !value || isValidPhoneNumber(value || "");

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm mb-1.5 opacity-90">
        {label}
      </label>

      <div
        className={[
          "rounded-xl border transition bg-white/10 text-white",
          "border-white/15 focus-within:border-[var(--accent)]",
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <PhoneInput
          id={id}
          name={name}
          value={value}
          onChange={(v) => onChange(v || "")}
          defaultCountry={defaultCountry as any}
          international
          countryCallingCodeEditable={false}
          disabled={disabled}
          // Le composant génère un input + un select pays.
          // On applique des classes « globales » au wrapper,
          // puis on cible les éléments via le style ci-dessous.
          className="px-3 py-2 text-[15px] leading-6"
        />
      </div>

      {/* Aide / erreur */}
      {!valid ? (
        <p className="mt-1.5 text-sm text-red-200">{errorText}</p>
      ) : (
        <p className="mt-1.5 text-xs opacity-70">
          Format international recommandé (ex. +212…)
        </p>
      )}

      {/* Skin minimal pour cibler les sous-éléments générés par la lib */}
      <style jsx>{`
        /* Le wrapper reçoit className="px-3 py-2 …" ci-dessus */
        :global(.PhoneInput) {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        :global(.PhoneInputCountry) {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        :global(.PhoneInputCountrySelect) {
          background: transparent;
          color: white;
          border: none;
          outline: none;
          cursor: pointer;
        }
        :global(.PhoneInputInput) {
          flex: 1 1 auto;
          min-width: 0;
          background: transparent;
          color: white;
          border: none;
          outline: none;
        }
        :global(.PhoneInputInput::placeholder) {
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
}
