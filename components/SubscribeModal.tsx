"use client";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children?: never;
};

export default function SubscribeModal({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-modal
      role="dialog"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose} // clic sur le backdrop => ferme
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full sm:max-w-lg rounded-3xl bg-white/85 shadow-2xl border border-white/40 mx-0 sm:mx-auto sm:w-[92%] p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()} // bloque la propagation à l’overlay
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-semibold">Créer mon espace</h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-black/5 hover:bg-black/10 active:bg-black/20"
          >
            Fermer
          </button>
        </div>

        {/* ---- Formulaire ---- */}
        <form className="space-y-3">
          <input
            placeholder="Nom"
            className="w-full h-12 rounded-2xl px-4 bg-white/90 border border-black/10 outline-none"
          />
          <input
            placeholder="Prénom"
            className="w-full h-12 rounded-2xl px-4 bg-white/90 border border-black/10 outline-none"
          />

          {/* Sélecteur pays + téléphone */}
          <PhoneField />

          <p className="text-sm text-black/60">
            Format : <b>+212</b> + numéro national (sans le 0 de tête).
          </p>

          <button
            type="submit"
            className="w-full h-12 rounded-2xl bg-[#5c9df2] text-white font-medium hover:opacity-90"
          >
            Continuer avec PayPal
          </button>
        </form>
      </div>
    </div>
  );
}

/** -------- PHONE FIELD (numérotation 1 → 33) -------- */
type Country = { code: string; name: string; dial: string; flag: string };

const COUNTRIES: Country[] = [
  // 33 pays dans l’ordre souhaité
  { code: "MA", name: "Maroc", flag: "🇲🇦", dial: "212" },
  { code: "US", name: "États-Unis", flag: "🇺🇸", dial: "1" },
  { code: "CN", name: "Chine", flag: "🇨🇳", dial: "86" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "1" },
  { code: "JP", name: "Japon", flag: "🇯🇵", dial: "81" },
  { code: "KR", name: "Corée du Sud", flag: "🇰🇷", dial: "82" },
  { code: "IN", name: "Inde", flag: "🇮🇳", dial: "91" },
  { code: "SG", name: "Singapour", flag: "🇸🇬", dial: "65" },

  { code: "AE", name: "Émirats Arabes Unis", flag: "🇦🇪", dial: "971" },
  { code: "SA", name: "Arabie Saoudite", flag: "🇸🇦", dial: "966" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", dial: "974" },
  { code: "KW", name: "Koweït", flag: "🇰🇼", dial: "965" },
  { code: "BH", name: "Bahreïn", flag: "🇧🇭", dial: "973" },
  { code: "OM", name: "Oman", flag: "🇴🇲", dial: "968" },

  { code: "FR", name: "France", flag: "🇫🇷", dial: "33" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", dial: "32" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", dial: "41" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", dial: "352" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", dial: "34" },
  { code: "IT", name: "Italie", flag: "🇮🇹", dial: "39" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", dial: "49" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", dial: "44" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱", dial: "31" },
  { code: "SE", name: "Suède", flag: "🇸🇪", dial: "46" },
  { code: "RU", name: "Russie", flag: "🇷🇺", dial: "7" },

  { code: "DZ", name: "Algérie", flag: "🇩🇿", dial: "213" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", dial: "216" },
  { code: "EG", name: "Égypte", flag: "🇪🇬", dial: "20" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", dial: "221" },
  { code: "CI", name: "Côte d’Ivoire", flag: "🇨🇮", dial: "225" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", dial: "237" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dial: "234" },
  { code: "ZA", name: "Afrique du Sud", flag: "🇿🇦", dial: "27" } // n°33
];

import { useState, useMemo } from "react";

function PhoneField() {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [national, setNational] = useState("");

  const e164 = useMemo(() => {
    const local = national.replace(/[^0-9]/g, "").replace(/^0+/, "");
    return local ? `+${country.dial}${local}` : "";
  }, [country, national]);

  return (
    <>
      {/* Select pays avec numérotation 1..33 */}
      <label className="block">
        <select
          value={country.code}
          onChange={(e) =>
            setCountry(COUNTRIES.find((c) => c.code === e.target.value) || COUNTRIES[0])
          }
          className="w-full h-12 rounded-2xl px-4 bg-white/90 border border-black/10 outline-none"
        >
          {COUNTRIES.map((c, idx) => (
            <option key={c.code} value={c.code}>
              {`${idx + 1}. ${c.name} (${c.flag} +${c.dial})`}
            </option>
          ))}
        </select>
      </label>

      {/* Ligne téléphone : +indicatif (readonly) + numéro */}
      <div className="flex gap-2">
        <input
          readOnly
          value={`+${country.dial}`}
          className="w-24 h-12 rounded-2xl px-3 bg-white/90 border border-black/10 text-center"
        />
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={national}
          onChange={(e) => setNational(e.target.value)}
          placeholder="Numéro (sans 0 initial)"
          className="flex-1 h-12 rounded-2xl px-4 bg-white/90 border border-black/10"
        />
      </div>

      {/* Valeur E.164 (si besoin pour la suite) */}
      <input type="hidden" name="phone" value={e164} />
    </>
  );
    }
