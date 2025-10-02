"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";

// Convertit "MA" -> 🇲🇦
function flagEmoji(cc: string) {
  return cc
    .toUpperCase()
    .replace(/./g, (ch) =>
      String.fromCodePoint(127397 + ch.charCodeAt(0))
    );
}

type Props = {
  value: string;                 // ex. "+212671140025" (composé)
  onChange: (v: string) => void; // renvoie le numéro en E.164
  defaultCountry?: string;       // ex. "MA"
};

export default function PhoneField({ value, onChange, defaultCountry = "MA" }: Props) {
  // décomposition simple: on tente d’extraire indicatif en lisant le début de la valeur
  const [country, setCountry] = useState<string>(defaultCountry);
  const [national, setNational] = useState<string>("");

  const countries = useMemo(() => {
    const list = getCountries();
    return list
      .map((c) => ({ code: c, dial: getCountryCallingCode(c) }))
      .sort((a, b) => Number(a.dial) - Number(b.dial));
  }, []);

  useEffect(() => {
    if (!value) return;
    // Essaie de retrouver l’indicatif courant pour recomposer le champ national
    const c = countries.find((x) => value.startsWith("+" + x.dial));
    if (c) {
      setCountry(c.code);
      const rest = value.replace("+" + c.dial, "");
      setNational(rest);
    }
  }, [value, countries]);

  // Compose "+indicatif" + national (en supprimant les zéros initiaux)
  useEffect(() => {
    const dial = getCountryCallingCode(country);
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
          onChange={(e) => setCountry(e.target.value)}
        >
          {countries.map((c) => (
            <option
              key={c.code}
              value={c.code}
              className="bg-zinc-900 text-white"
            >
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
