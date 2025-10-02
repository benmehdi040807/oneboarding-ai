"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type ClubCountry = {
  id: number;             // 1..33 (numérotation visible)
  label: string;          // nom affiché
  dial: string;           // "212"
  flag: string;           // emoji
};

const CLUB_33: ClubCountry[] = [
  { id: 1, label: "Maroc", flag: "🇲🇦", dial: "212" },
  { id: 2, label: "États-Unis", flag: "🇺🇸", dial: "1" },
  { id: 3, label: "Chine", flag: "🇨🇳", dial: "86" },
  { id: 4, label: "Canada", flag: "🇨🇦", dial: "1" },
  { id: 5, label: "Japon", flag: "🇯🇵", dial: "81" },
  { id: 6, label: "Corée du Sud", flag: "🇰🇷", dial: "82" },
  { id: 7, label: "Inde", flag: "🇮🇳", dial: "91" },
  { id: 8, label: "Singapour", flag: "🇸🇬", dial: "65" },

  // — Golfe (codes alignés à droite, jamais 2 lignes)
  { id: 9, label: "Émirats Arabes Unis", flag: "🇦🇪", dial: "971" },
  { id:10, label: "Arabie Saoudite",     flag: "🇸🇦", dial: "966" },
  { id:11, label: "Qatar",               flag: "🇶🇦", dial: "974" },
  { id:12, label: "Koweït",              flag: "🇰🇼", dial: "965" },
  { id:13, label: "Bahreïn",             flag: "🇧🇭", dial: "973" },
  { id:14, label: "Oman",                flag: "🇴🇲", dial: "968" },

  // — Europe & voisins
  { id:15, label: "France",    flag: "🇫🇷", dial: "33" },
  { id:16, label: "Belgique",  flag: "🇧🇪", dial: "32" },
  { id:17, label: "Suisse",    flag: "🇨🇭", dial: "41" },
  { id:18, label: "Luxembourg",flag: "🇱🇺", dial: "352" },
  { id:19, label: "Espagne",   flag: "🇪🇸", dial: "34" },
  { id:20, label: "Italie",    flag: "🇮🇹", dial: "39" },
  { id:21, label: "Allemagne", flag: "🇩🇪", dial: "49" },
  { id:22, label: "Royaume-Uni",flag:"🇬🇧", dial: "44" },
  { id:23, label: "Pays-Bas",  flag: "🇳🇱", dial: "31" },
  { id:24, label: "Suède",     flag: "🇸🇪", dial: "46" },
  { id:25, label: "Russie",    flag: "🇷🇺", dial: "7"  },

  // — Afrique
  { id:26, label: "Algérie",     flag: "🇩🇿", dial: "213" },
  { id:27, label: "Tunisie",     flag: "🇹🇳", dial: "216" },
  { id:28, label: "Égypte",      flag: "🇪🇬", dial: "20"  },
  { id:29, label: "Sénégal",     flag: "🇸🇳", dial: "221" },
  { id:30, label: "Côte d’Ivoire",flag:"🇨🇮", dial: "225" },
  { id:31, label: "Cameroun",    flag: "🇨🇲", dial: "237" },
  { id:32, label: "Nigeria",     flag: "🇳🇬", dial: "234" },
  { id:33, label: "Afrique du Sud", flag:"🇿🇦", dial: "27" },
];

export default function PhoneField() {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<ClubCountry>(CLUB_33[0]);
  const [national, setNational] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Fermeture du menu au clic hors-zone
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3">
      {/* Sélecteur pays (bouton) */}
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full h-12 rounded-2xl bg-white/80 border border-black/10 px-4
                     flex items-center justify-between"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate">
            {country.id}. {country.label} <span className="ml-1">{country.flag}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </button>

        {/* Liste déroulante premium : 6–7 items visibles max, scrollable */}
        {open && (
          <div
            role="listbox"
            className="absolute z-[70] mt-2 w-[22rem] max-w-[90vw]
                       rounded-2xl bg-white shadow-xl border border-black/10
                       max-h-80 overflow-y-auto"
          >
            {CLUB_33.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setCountry(c); setOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-black/5
                           flex items-center gap-3"
              >
                {/* Nom + drapeau (tronqué si trop long) */}
                <span className="flex-1 min-w-0 whitespace-nowrap truncate">
                  {c.id}. {c.label} <span className="ml-1">{c.flag}</span>
                </span>
                {/* Indicatif : bloc fixe, aligné à droite => jamais sur 2 lignes */}
                <span className="ml-3 shrink-0 tabular-nums text-black/70">
                  (+{c.dial})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Champ numéro national */}
      <div className="grid grid-cols-[5rem_1fr] gap-3">
        <div className="h-12 rounded-2xl bg-white/80 border border-black/10
                        flex items-center justify-center font-medium">
          +{country.dial}
        </div>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={national}
          onChange={(e) =>
            setNational(e.target.value.replace(/[^0-9]/g, "").replace(/^0+/, ""))
          }
          placeholder="Numéro (sans 0 initial)"
          className="h-12 rounded-2xl px-4 bg-white/80 border border-black/10"
        />
      </div>
    </div>
  );
}
