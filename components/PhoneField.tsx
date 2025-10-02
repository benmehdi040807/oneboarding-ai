// components/PhoneField.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * Props :
 *  - value : numéro composé au format E.164 (ex: "+212612345678") ou "" si vide
 *  - onChange : callback avec le E.164 recalculé à chaque saisie
 */
type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
};

/** Petites utils drapeau (emoji regional indicators) */
function flagEmoji(cc: string): string {
  // cc = "MA", "US"...
  const A = 0x1f1e6;
  const upper = cc.toUpperCase();
  if (upper.length !== 2) return "🏳️";
  return String.fromCodePoint(A + (upper.charCodeAt(0) - 65)) + String.fromCodePoint(A + (upper.charCodeAt(1) - 65));
}

/** Définition d’un pays sélectionné dans notre "club 33" */
type CountryItem = {
  code: string;    // ISO2 (approx) pour le drapeau
  name: string;    // libellé
  dial: string;    // indicatif sans "+"
};

/**
 * Club des 33 — ordre voulu :
 *  1. Maroc en premier (🇲🇦 +212) — et UNIQUEMENT "Maroc" pour +212 (pas d’entrée séparée pour le Sahara).
 *  2. Marchés clés IA (USA, Chine, Canada, Japon, Corée, Inde)
 *  3. Francophonie Afrique/Europe prioritaire
 *  4. Golfe et MENA stratégiques
 *  5. Afrique anglophone à fort potentiel
 *  6. Grands pays d’Europe (prestige + économie)
 */
const CLUB_33: CountryItem[] = [
  // 1) Maroc
  { code: "MA", name: "Maroc", dial: "212" },

  // 2) Marchés clés IA
  { code: "US", name: "États-Unis", dial: "1" },
  { code: "CN", name: "Chine", dial: "86" },
  { code: "CA", name: "Canada", dial: "1" },
  { code: "JP", name: "Japon", dial: "81" },
  { code: "KR", name: "Corée du Sud", dial: "82" },
  { code: "IN", name: "Inde", dial: "91" },

  // 3) Francophonie Afrique / Europe prioritaire
  { code: "FR", name: "France", dial: "33" },
  { code: "DZ", name: "Algérie", dial: "213" },
  { code: "TN", name: "Tunisie", dial: "216" },
  { code: "SN", name: "Sénégal", dial: "221" },
  { code: "CI", name: "Côte d’Ivoire", dial: "225" },
  { code: "CM", name: "Cameroun", dial: "237" },
  { code: "BE", name: "Belgique", dial: "32" },
  { code: "CH", name: "Suisse", dial: "41" },
  { code: "LU", name: "Luxembourg", dial: "352" },
  { code: "CA", name: "Canada (Québec)", dial: "1" }, // alias culturel (reste +1)

  // 4) Golfe & MENA
  { code: "SA", name: "Arabie saoudite", dial: "966" },
  { code: "AE", name: "Émirats arabes unis (Dubai)", dial: "971" },
  { code: "QA", name: "Qatar", dial: "974" },
  { code: "KW", name: "Koweït", dial: "965" },
  { code: "BH", name: "Bahreïn", dial: "973" },
  { code: "OM", name: "Oman", dial: "968" },
  { code: "EG", name: "Égypte", dial: "20" },
  { code: "JO", name: "Jordanie", dial: "962" },

  // 5) Afrique anglophone à fort potentiel
  { code: "NG", name: "Nigéria", dial: "234" },
  { code: "KE", name: "Kenya", dial: "254" },
  { code: "GH", name: "Ghana", dial: "233" },
  { code: "ZA", name: "Afrique du Sud", dial: "27" },

  // 6) Europe “prestige & voisins”
  { code: "ES", name: "Espagne", dial: "34" },
  { code: "IT", name: "Italie", dial: "39" },
  { code: "DE", name: "Allemagne", dial: "49" },
  { code: "GB", name: "Royaume-Uni", dial: "44" },
  { code: "RU", name: "Russie", dial: "7" },
];

/** Map indicatif -> codes possible (utile si on veut inférer plus tard) */
const DIAL_INDEX = new Map(CLUB_33.map((c) => [c.dial, c]));

/** Normalise la saisie locale en ne gardant que chiffres et en supprimant les zéros de tête */
function normalizeLocal(n: string): string {
  return n.replace(/[^\d]/g, "").replace(/^0+/, "");
}

export default function PhoneField({ value, onChange, className }: Props) {
  // État local : pays sélectionné + saisi national
  const [country, setCountry] = useState<CountryItem>(CLUB_33[0]); // Maroc par défaut
  const [national, setNational] = useState<string>("");

  // Si on reçoit un "value" E.164 (externe), on pourrait essayer d’inférer le pays / local
  useEffect(() => {
    if (!value || !value.startsWith("+")) return;
    const digits = value.slice(1);
    // On matche sur l’indicatif le plus long possible
    const match = [...DIAL_INDEX.keys()]
      .sort((a, b) => b.length - a.length)
      .find((d) => digits.startsWith(d));
    if (!match) return;
    const c = DIAL_INDEX.get(match)!;
    setCountry(c);
    setNational(digits.slice(match.length));
  }, [value]);

  // Recompose E.164 dès que le pays ou la saisie changent
  useEffect(() => {
    const local = normalizeLocal(national);
    const out = local ? `+${country.dial}${local}` : "";
    onChange(out);
  }, [country, national, onChange]);

  // Options avec numérotation + drapeau + indicatif
  const options = useMemo(
    () =>
      CLUB_33.map((c, idx) => ({
        key: `${c.code}-${idx}`,
        value: c.code,
        label: `${idx + 1}. ${c.name} (${flagEmoji(c.code)} +${c.dial})`,
      })),
    []
  );

  // Récupère l’item pays à partir d’un code (pour le <select>)
  function pickCountryByCode(code: string): CountryItem | null {
    const found = CLUB_33.find((c) => c.code === code);
    return found || null;
    // NB: +212 = Maroc uniquement, nous ne listons PAS d’entrée séparée pour “Sahara”.
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 ${className || ""}`}>
      {/* Sélecteur pays — club 33 numéroté */}
      <label className="block">
        <span className="sr-only">Pays</span>
        <select
          value={country.code}
          onChange={(e) => {
            const c = pickCountryByCode(e.target.value);
            if (c) setCountry(c);
          }}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-white/90 outline-none hover:bg-white/10"
        >
          {options.map((o) => (
            <option key={o.key} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {/* Saisie numéro national (sans indicatif) */}
      <label className="block">
        <span className="sr-only">Numéro de téléphone</span>
        <div className="flex items-stretch rounded-xl overflow-hidden border border-white/10 bg-white/5">
          <div className="px-3 py-3 shrink-0 text-white/80 border-r border-white/10 bg-white/10">
            +{country.dial}
          </div>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="tel"
            placeholder="Numéro (sans 0 initial)"
            value={national}
            onChange={(e) => setNational(e.target.value)}
            className="flex-1 min-w-0 px-3 py-3 bg-transparent outline-none text-white/90"
          />
        </div>
      </label>

      {/* Petit hint lisible */}
      <p className="col-span-full text-xs opacity-75 mt-1">
        Format: <strong>+{country.dial}</strong> + numéro national (sans le 0 de tête). Exemple Maroc : <code>+2126…</code>
      </p>
    </div>
  );
}
