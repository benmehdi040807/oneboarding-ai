"use client";
import React from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css"; // style de base

export default function PhoneField({
  value,
  onChange,
  disabled,
}: {
  value: string | undefined;
  onChange: (e164?: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <PhoneInput
        international
        defaultCountry="MA"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white"
      />
      {value && !isValidPhoneNumber(value) && (
        <span className="text-xs text-amber-300">Numéro invalide</span>
      )}
      <style jsx global>{`
        /* adoucit le composant natif */
        .PhoneInput {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .PhoneInputCountry {
          background: transparent !important;
        }
        .PhoneInputInput {
          background: transparent !important;
          border: none !important;
          color: white !important;
          outline: none;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
