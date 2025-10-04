"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

const DEFAULT = COUNTRIES[0];

type Props = { value: string; onChange: (e164: string) => void };

export default function PhoneField({ value, onChange }: Props) {
  const [country, setCountry] = useState<Country>(DEFAULT);
  const [local, setLocal] = useState<string>("");
  const [open, setOpen] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null); // conteneur scrollable

  // Compose E.164
  useEffect(() => {
    const cleaned = (local || "").replace(/[^\d]/g, "").replace(/^0+/, "");
    const e164 = cleaned ? `+${country.dial}${cleaned}` : "";
    onChange(e164);
  }, [country, local, onChange]);

  // À chaque ouverture : repartir en haut de liste (évite l'effet "commence à 6")
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [open]);

  const dial = useMemo(() => `+${country.dial}`, [country]);

  return (
    <div className="space-y-3">
      {/* 1) Sélecteur de pays */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full rounded-2xl border border-black/10 bg-white/60 backdrop-blur
                     px-4 py-3 text-left text-black flex items-center justify-between"
        >
          <span className="truncate">
            {country.num}. {country.name} <span className="ml-1">{country.flag}</span>
          </span>
          <span className={`ml-3 transition ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>

      {/* 2) Indicatif + Numéro */}
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div
          className="rounded-2xl border border-black/10 bg-white/60 backdrop-blur
                     px-4 py-3 text-black flex items-center min-w-[82px]"
          aria-hidden
        >
          {dial}
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Numéro (sans 0 initial)"
          className="w-full rounded-2xl border border-black/10 bg-white/60 backdrop-blur
                     px-4 py-3 text-black placeholder-white/90 outline-none"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
      </div>

      {/* 3) Liste flottante — scroll interne fiable */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[2147483602]"
          aria-hidden
          // bloque gestes globaux (pull-to-refresh, etc.)
          style={{ overscrollBehavior: "contain", touchAction: "none" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            ref={listRef}
            className="fixed left-1/2 -translate-x-1/2 bottom-[160px]
                       w-[92vw] max-w-lg rounded-2xl
                       bg-white/90 backdrop-blur-2xl border border-white/70 shadow-2xl
                       max-h-[60vh] overflow-y-auto text-black/90
                       divide-y divide-black/10"
            // autorise le scroll vertical naturel à l’intérieur
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
            }}
          >
            {COUNTRIES.map((c) => {
              const selected = c.num === country.num;
              return (
                <button
                  key={c.num}
                  type="button"
                  onClick={() => {
                    setCountry(c);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-2
                              ${selected ? "bg-white" : "bg-white/80 active:bg-white/90"}`}
                >
                  <span className="w-7 tabular-nums">{c.num}.</span>
                  <span className="shrink-0">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="tabular-nums">(+{c.dial})</span>
                  {selected && <span aria-hidden className="ml-2">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
