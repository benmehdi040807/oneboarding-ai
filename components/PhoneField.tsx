// components/PhoneField.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  value: string;                 // E.164 (+2126…)
  onChange: (v: string) => void; // renvoyé en E.164 ou "" si vide
};

type Country = {
  code: string;     // ISO alpha-2 (utile si besoin plus tard)
  dial: string;     // sans "+"
  label: string;    // "1. Maroc (🇲🇦 +212)"
  flag: string;     // "🇲🇦"
};

// ---- Club des 33 (ordre = capture de ton screen) ----
const CLUB33: Country[] = [
  // 🟥 Ancrage & identité
  { code: "MA", dial: "212", flag: "🇲🇦", label: "1. Maroc (🇲🇦 +212)" },

  // 🌐 Marchés IA & Tech précurseurs
  { code: "US", dial: "1",   flag: "🇺🇸", label: "États-Unis (🇺🇸 +1)" },
  { code: "CN", dial: "86",  flag: "🇨🇳", label: "Chine (🇨🇳 +86)" },

  // (suite du bloc précurseurs)
  { code: "CA", dial: "1",   flag: "🇨🇦", label: "Canada (🇨🇦 +1)" },
  { code: "JP", dial: "81",  flag: "🇯🇵", label: "Japon (🇯🇵 +81)" },
  { code: "KR", dial: "82",  flag: "🇰🇷", label: "Corée du Sud (🇰🇷 +82)" },
  { code: "IN", dial: "91",  flag: "🇮🇳", label: "Inde (🇮🇳 +91)" },
  { code: "SG", dial: "65",  flag: "🇸🇬", label: "Singapour (🇸🇬 +65)" },

  // 🏦 Golfe – IA & investissements
  { code: "AE", dial: "971", flag: "🇦🇪", label: "Émirats Arabes Unis (🇦🇪 +971)" },
  { code: "SA", dial: "966", flag: "🇸🇦", label: "Arabie Saoudite (🇸🇦 +966)" },
  { code: "QA", dial: "974", flag: "🇶🇦", label: "Qatar (🇶🇦 +974)" },
  { code: "KW", dial: "965", flag: "🇰🇼", label: "Koweït (🇰🇼 +965)" },
  { code: "BH", dial: "973", flag: "🇧🇭", label: "Bahreïn (🇧🇭 +973)" },
  { code: "OM", dial: "968", flag: "🇴🇲", label: "Oman (🇴🇲 +968)" },

  // 🇪🇺 Europe francophone & voisins
  { code: "FR", dial: "33",  flag: "🇫🇷", label: "France (🇫🇷 +33)" },
  { code: "BE", dial: "32",  flag: "🇧🇪", label: "Belgique (🇧🇪 +32)" },
  { code: "CH", dial: "41",  flag: "🇨🇭", label: "Suisse (🇨🇭 +41)" },
  { code: "LU", dial: "352", flag: "🇱🇺", label: "Luxembourg (🇱🇺 +352)" },
  { code: "ES", dial: "34",  flag: "🇪🇸", label: "Espagne (🇪🇸 +34)" },
  { code: "IT", dial: "39",  flag: "🇮🇹", label: "Italie (🇮🇹 +39)" },
  { code: "DE", dial: "49",  flag: "🇩🇪", label: "Allemagne (🇩🇪 +49)" },

  // (voisins supplémentaires)
  { code: "GB", dial: "44",  flag: "🇬🇧", label: "Royaume-Uni (🇬🇧 +44)" },
  { code: "NL", dial: "31",  flag: "🇳🇱", label: "Pays-Bas (🇳🇱 +31)" },
  { code: "SE", dial: "46",  flag: "🇸🇪", label: "Suède (🇸🇪 +46)" },
  { code: "RU", dial: "7",   flag: "🇷🇺", label: "Russie (🇷🇺 +7)" },

  // 🌍 Afrique – leadership & potentiel IA
  { code: "DZ", dial: "213", flag: "🇩🇿", label: "Algérie (🇩🇿 +213)" },
  { code: "TN", dial: "216", flag: "🇹🇳", label: "Tunisie (🇹🇳 +216)" },
  { code: "EG", dial: "20",  flag: "🇪🇬", label: "Égypte (🇪🇬 +20)" },
  { code: "SN", dial: "221", flag: "🇸🇳", label: "Sénégal (🇸🇳 +221)" },
  { code: "CI", dial: "225", flag: "🇨🇮", label: "Côte d’Ivoire (🇨🇮 +225)" },
  { code: "CM", dial: "237", flag: "🇨🇲", label: "Cameroun (🇨🇲 +237)" },
  { code: "NG", dial: "234", flag: "🇳🇬", label: "Nigeria (🇳🇬 +234)" },
  { code: "ZA", dial: "27",  flag: "🇿🇦", label: "Afrique du Sud (🇿🇦 +27)" },
];

export default function PhoneField({ value, onChange }: Props) {
  // Sélection par défaut : Maroc
  const [country, setCountry] = useState<string>(CLUB33[0].dial);
  const [national, setNational] = useState<string>("");

  // Compose E.164 à chaque changement
  useEffect(() => {
    const local = national.replace(/\s+/g, "").replace(/[^0-9]/g, "").replace(/^0+/, "");
    const e164 = local ? `+${country}${local}` : "";
    onChange(e164);
  }, [country, national, onChange]);

  // Si une valeur E.164 arrive de l’extérieur, on tente de la refléter dans les champs
  useEffect(() => {
    if (!value?.startsWith("+")) return;
    const digits = value.slice(1);
    // Trouve le pays dont l’indicatif est préfixe
    const match = CLUB33
      .slice() // on ne modifie pas l’original
      .sort((a, b) => b.dial.length - a.dial.length)
      .find(c => digits.startsWith(c.dial));
    if (match) {
      setCountry(match.dial);
      setNational(digits.slice(match.dial.length));
    }
  }, [value]);

  const options = useMemo(
    () =>
      CLUB33.map((c) => ({
        value: c.dial,
        label: c.label,
      })),
    []
  );

  return (
    <div className="w-full">
      {/* Sélecteur pays (Club des 33) */}
      <div className="grid grid-cols-[1fr] sm:grid-cols-[1.5fr,1fr] gap-2">
        <select
          className="w-full rounded-xl bg-white/60 border border-black/10 px-3 py-3 outline-none"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Zone numéro national (sans 0 initial) */}
        <div className="flex rounded-xl overflow-hidden border border-black/10 bg-white/60">
          <div className="px-3 py-3 text-black/70 border-r border-black/10">
            +{country}
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Numéro (sans 0 initial)"
            value={national}
            onChange={(e) => setNational(e.target.value)}
            className="flex-1 px-3 py-3 bg-transparent outline-none"
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-black/70">
        Format : <strong>+{country}</strong> + numéro national (sans le 0 de tête).
      </p>
    </div>
  );
}
