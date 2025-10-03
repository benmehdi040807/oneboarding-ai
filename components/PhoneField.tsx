"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Country = { num: number; name: string; dial: string; flag: string };
const COUNTRIES: Country[] = [/* ... tes 33 pays ... */];
const DEFAULT = COUNTRIES[0];

type Props = { value: string; onChange: (e164: string) => void };

export default function PhoneField({ value, onChange }: Props) {
  const [country, setCountry] = useState<Country>(DEFAULT);
  const [local, setLocal] = useState<string>("");
  const [open, setOpen] = useState(false);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const cleaned = (local || "").replace(/[^\d]/g, "").replace(/^0+/, "");
    const e164 = cleaned ? `+${country.dial}${cleaned}` : "";
    onChange(e164);
  }, [country, local, onChange]);

  // Gestion du back : ferme la liste si ouverte
  useEffect(() => {
    if (!open) return;
    const onPop = () => setOpen(false);
    window.history.pushState({ obCountry: true }, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  // Scroll vers le pays sélectionné quand la liste s’ouvre
  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [open]);

  const dial = useMemo(() => `+${country.dial}`, [country]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-left text-black flex items-center justify-between"
        >
          <span>{country.num}. {country.name} {country.flag}</span>
          <span className={`ml-3 transition ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-black flex items-center min-w-[82px]">
          {dial}
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Numéro (sans 0 initial)"
          className="w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-black placeholder-black/60 outline-none"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
      </div>

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-50" aria-hidden>
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 -translate-x-1/2 bottom-[160px]
                       w-[92vw] max-w-lg rounded-2xl bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl
                       max-h-[60vh] overflow-y-auto scroll-smooth divide-y divide-black/10"
          >
            {COUNTRIES.map((c) => {
              const selected = c.num === country.num;
              return (
                <button
                  key={c.num}
                  type="button"
                  ref={selected ? selectedRef : null}
                  onClick={() => { setCountry(c); setOpen(false); }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-2 ${selected ? "bg-white/70" : "hover:bg-white/60"}`}
                >
                  <span className="w-7">{c.num}.</span>
                  <span>{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span>(+{c.dial})</span>
                  {selected && <span className="ml-2">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
