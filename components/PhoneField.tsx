// components/PhoneField.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// ---- Club des 33 (ordre validé ; #1 = Maroc) ----
type Country = { id: number; code: string; label: string; dial: number; flag: string };

const CLUB_33: Country[] = [
  // Ancrage & identité
  { id: 1, code: "MA", label: "Maroc", dial: 212, flag: "🇲🇦" },

  // Marchés IA & Tech précurseurs
  { id: 2, code: "US", label: "États-Unis", dial: 1, flag: "🇺🇸" },
  { id: 3, code: "CN", label: "Chine", dial: 86, flag: "🇨🇳" },
  { id: 4, code: "CA", label: "Canada", dial: 1, flag: "🇨🇦" },
  { id: 5, code: "JP", label: "Japon", dial: 81, flag: "🇯🇵" },
  { id: 6, code: "KR", label: "Corée du Sud", dial: 82, flag: "🇰🇷" },
  { id: 7, code: "IN", label: "Inde", dial: 91, flag: "🇮🇳" },
  { id: 8, code: "SG", label: "Singapour", dial: 65, flag: "🇸🇬" },

  // Golfe – IA & investissements
  { id: 9, code: "AE", label: "Émirats Arabes Unis", dial: 971, flag: "🇦🇪" },
  { id: 10, code: "SA", label: "Arabie Saoudite", dial: 966, flag: "🇸🇦" },
  { id: 11, code: "QA", label: "Qatar", dial: 974, flag: "🇶🇦" },
  { id: 12, code: "KW", label: "Koweït", dial: 965, flag: "🇰🇼" },
  { id: 13, code: "BH", label: "Bahreïn", dial: 973, flag: "🇧🇭" },
  { id: 14, code: "OM", label: "Oman", dial: 968, flag: "🇴🇲" },

  // Europe francophone & voisins
  { id: 15, code: "FR", label: "France", dial: 33, flag: "🇫🇷" },
  { id: 16, code: "BE", label: "Belgique", dial: 32, flag: "🇧🇪" },
  { id: 17, code: "CH", label: "Suisse", dial: 41, flag: "🇨🇭" },
  { id: 18, code: "LU", label: "Luxembourg", dial: 352, flag: "🇱🇺" },
  { id: 19, code: "ES", label: "Espagne", dial: 34, flag: "🇪🇸" },
  { id: 20, code: "IT", label: "Italie", dial: 39, flag: "🇮🇹" },
  { id: 21, code: "DE", label: "Allemagne", dial: 49, flag: "🇩🇪" },
  { id: 22, code: "GB", label: "Royaume-Uni", dial: 44, flag: "🇬🇧" },
  { id: 23, code: "NL", label: "Pays-Bas", dial: 31, flag: "🇳🇱" },
  { id: 24, code: "SE", label: "Suède", dial: 46, flag: "🇸🇪" },
  { id: 25, code: "RU", label: "Russie", dial: 7, flag: "🇷🇺" },

  // Afrique – leadership & potentiel IA
  { id: 26, code: "DZ", label: "Algérie", dial: 213, flag: "🇩🇿" },
  { id: 27, code: "TN", label: "Tunisie", dial: 216, flag: "🇹🇳" },
  { id: 28, code: "EG", label: "Égypte", dial: 20, flag: "🇪🇬" },
  { id: 29, code: "SN", label: "Sénégal", dial: 221, flag: "🇸🇳" },
  { id: 30, code: "CI", label: "Côte d’Ivoire", dial: 225, flag: "🇨🇮" },
  { id: 31, code: "CM", label: "Cameroun", dial: 237, flag: "🇨🇲" },
  { id: 32, code: "NG", label: "Nigeria", dial: 234, flag: "🇳🇬" },
  { id: 33, code: "ZA", label: "Afrique du Sud", dial: 27, flag: "🇿🇦" },
];

export default function PhoneField() {
  const [country, setCountry] = useState<Country>(CLUB_33[0]); // Maroc par défaut
  const [open, setOpen] = useState(false);
  const [national, setNational] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const dialStr = useMemo(() => `+${country.dial}`, [country.dial]);

  return (
    <div className="w-full space-y-3">
      {/* LIGNE 3 — Sélecteur PAYS (Club des 33) */}
      <div className="relative" ref={wrapperRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full h-12 rounded-2xl px-4 bg-white/75 border border-black/10
                     flex items-center justify-between"
        >
          <span className="min-w-0 truncate text-left">
            {country.id}. {country.label} <span className="ml-1">{country.flag}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-black/60" />
        </button>

        {/* Menu “drop-UP” : moitié d’écran max, scrollable, cliquable */}
        {open && (
          <div
            className="absolute z-[70] bottom-[calc(100%+0.5rem)]
                       w-full rounded-2xl bg-white shadow-xl border border-black/10
                       max-h-[45vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {CLUB_33.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={c.code === country.code}
                onClick={() => {
                  setCountry(c);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3"
              >
                <span className="flex-1 min-w-0 truncate">
                  {c.id}. {c.label} <span className="ml-1">{c.flag}</span>
                </span>
                <span className="ml-3 shrink-0 tabular-nums text-black/70">
                  (+{c.dial})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LIGNE 4 — Indicatif auto + numéro national */}
      <div className="flex items-center gap-3">
        <div className="h-12 rounded-2xl px-4 bg-white/75 border border-black/10 flex items-center shrink-0">
          <span className="tabular-nums">{dialStr}</span>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={national}
          onChange={(e) =>
            setNational(e.target.value.replace(/[^0-9]/g, "").replace(/^0+/, ""))
          }
          placeholder="Numéro (sans 0 initial)"
          className="flex-1 h-12 rounded-2xl px-4 bg-white/75 border border-black/10"
        />
      </div>
    </div>
  );
}
