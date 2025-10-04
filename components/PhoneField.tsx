"use client";

import { useEffect, useMemo, useState } from "react";

type Country = { num: number; name: string; dial: string; flag: string };

const COUNTRIES: Country[] = [
  { num: 1, name: "Maroc", flag: "🇲🇦", dial: "212" },
  { num: 2, name: "États-Unis", flag: "🇺🇸", dial: "1" },
  { num: 3, name: "Chine", flag: "🇨🇳", dial: "86" },
  { num: 4, name: "Canada", flag: "🇨🇦", dial: "1" },
  { num: 5, name: "Japon", flag: "🇯🇵", dial: "81" },
  { num: 6, name: "Corée du Sud", flag: "🇰🇷", dial: "82" },
  { num: 7, name: "Inde", flag: "🇮🇳", dial: "91" },
  { num: 8, name: "Singapour", flag: "🇸🇬", dial: "65" },
  { num: 9, name: "Émirats Arabes Unis", flag: "🇦🇪", dial: "971" },
  { num: 10, name: "Arabie Saoudite", flag: "🇸🇦", dial: "966" },
  { num: 11, name: "Qatar", flag: "🇶🇦", dial: "974" },
  { num: 12, name: "Koweït", flag: "🇰🇼", dial: "965" },
  { num: 13, name: "Bahreïn", flag: "🇧🇭", dial: "973" },
  { num: 14, name: "Oman", flag: "🇴🇲", dial: "968" },
  { num: 15, name: "France", flag: "🇫🇷", dial: "33" },
  { num: 16, name: "Belgique", flag: "🇧🇪", dial: "32" },
  { num: 17, name: "Suisse", flag: "🇨🇭", dial: "41" },
  { num: 18, name: "Luxembourg", flag: "🇱🇺", dial: "352" },
  { num: 19, name: "Espagne", flag: "🇪🇸", dial: "34" },
  { num: 20, name: "Italie", flag: "🇮🇹", dial: "39" },
  { num: 21, name: "Allemagne", flag: "🇩🇪", dial: "49" },
  { num: 22, name: "Royaume-Uni", flag: "🇬🇧", dial: "44" },
  { num: 23, name: "Pays-Bas", flag: "🇳🇱", dial: "31" },
  { num: 24, name: "Suède", flag: "🇸🇪", dial: "46" },
  { num: 25, name: "Russie", flag: "🇷🇺", dial: "7" },
  { num: 26, name: "Algérie", flag: "🇩🇿", dial: "213" },
  { num: 27, name: "Tunisie", flag: "🇹🇳", dial: "216" },
  { num: 28, name: "Égypte", flag: "🇪🇬", dial: "20" },
  { num: 29, name: "Sénégal", flag: "🇸🇳", dial: "221" },
  { num: 30, name: "Côte d’Ivoire", flag: "🇨🇮", dial: "225" },
  { num: 31, name: "Cameroun", flag: "🇨🇲", dial: "237" },
  { num: 32, name: "Nigeria", flag: "🇳🇬", dial: "234" },
  { num: 33, name: "Afrique du Sud", flag: "🇿🇦", dial: "27" },
];

const DEFAULT_INDEX = 0;

type Props = { value: string; onChange: (e164: string) => void };

export default function PhoneField({ value, onChange }: Props) {
  const [idx, setIdx] = useState<number>(DEFAULT_INDEX);
  const [local, setLocal] = useState<string>("");

  const country = COUNTRIES[idx];
  const dial = useMemo(() => `+${country.dial}`, [country]);

  // Compose E.164 à chaque changement
  useEffect(() => {
    const cleaned = (local || "").replace(/[^\d]/g, "").replace(/^0+/, "");
    const e164 = cleaned ? `+${country.dial}${cleaned}` : "";
    onChange(e164);
  }, [country, local, onChange]);

  return (
    <div className="space-y-3">
      {/* Sélecteur natif (toute la zone est cliquable) */}
      <div className="relative">
        <select
          value={idx}
          onChange={(e) => setIdx(parseInt(e.target.value, 10))}
          className="w-full appearance-none rounded-2xl border border-black/10 bg-white px-4 py-3 pr-10 text-black"
        >
          {COUNTRIES.map((c, i) => (
            <option key={c.num} value={i}>
              {c.num}. {c.name} {c.flag}  (+{c.dial})
            </option>
          ))}
        </select>
        {/* caret visuel (mais la zone entière est cliquable) */}
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none">▾</span>
      </div>

      {/* Indicatif + numéro */}
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-black flex items-center min-w-[82px]"
          aria-hidden
        >
          {dial}
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Numéro (sans 0 initial)"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder-black/40 outline-none"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
      </div>
    </div>
  );
}
