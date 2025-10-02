"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

// Convertit "MA" -> 🇲🇦
function flagEmoji(cc: string) {
  return cc
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

type Props = {
  value: string;                 // ex. "+212671140025"
  onChange: (v: string) => void; // renvoie E.164 ou "" si vide
  defaultCountry?: CountryCode;  // ex. "MA"
};

export default function PhoneField({
  value,
  onChange,
  defaultCountry = "MA",
}: Props) {
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [national, setNational] = useState<string>("");

  const countries = useMemo(() => {
    const list = getCountries(); // CountryCode[]
    return list
      .map((c) => ({ code: c as CountryCode, dial: getCountryCallingCode(c as CountryCode) }))
      .sort((a, b) => Number(a.dial) - Number(b.dial));
  }, []);

  // Hydrate à partir de value complète
  useEffect(() => {
    if (!value) return;
    const found = countries.find((x) => value.startsWith("+" + x.dial));
    if (found) {
      setCountry(found.code);
      const rest = value.replace("+" + found.dial, "");
      setNational(rest);
    }
  }, [value, countries]);

  // Compose "+indicatif" + national (sans zéros initiaux)
  useEffect(() => {
    const dial = getCountryCallingCode(country as CountryCode);
    const local = national.replace(/^\s+/, "").replace(/[^0-9]/g, "").replace(/^0+/, "");
    onChange(local ? `+${dial}${local}` : "");
  }, [country, national, onChange]);

  return (
    <div className="flex gap-2">
      {/* sélecteur drapeau + indicatif */}
      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
        <select
          className="bg-transparent outline-none text-white/90"
          value={country}
          onChange={(e) => setCountry(e.target.value as CountryCode)}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
              {flagEmoji(c.code)} +{c.dial}
            </option>
          ))}
        </select>
      </div>

      {/* numéro local */}
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Numéro de téléphone"
        className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/90 placeholder-white/40 outline-none"
        value={national}
        onChange={(e) => setNational(e.target.value)}
      />
    </div>
  );
}
