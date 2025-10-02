"use client";

import React, { useMemo } from "react";
import PhoneInput, {
  DefaultInputComponentProps,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags"; // drapeaux SVG
import "react-phone-number-input/style.css";

type Props = {
  value: string;
  onChange: (value: string | undefined) => void;
};

// composant d’input pour mieux contrôler styles
function TextInput(props: DefaultInputComponentProps) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={`flex-1 min-w-0 bg-white/10 border border-white/15 rounded-xl px-3 py-2 outline-none focus:border-white/30 ${className || ""}`}
      inputMode="numeric"
      placeholder="Numéro"
    />
  );
}

// on réduit la largeur du sélecteur : drapeau + code seulement
function CountrySelect({
  value,
  onChange,
  labels,
  options,
  iconComponent: Icon,
}: any) {
  return (
    <div className="relative">
      <select
        aria-label="Indicatif"
        value={value}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="appearance-none pr-8 pl-9 h-10 rounded-xl bg-white/10 border border-white/15 text-[var(--fg)]/95 text-sm outline-none focus:border-white/30"
        style={{
          // garder taille compacte
          width: 112,
          color: "white",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {options.map((o: any) => (
          <option key={o.value} value={o.value} className="text-black">
            {/* on affiche “+code” */}
            +{o.countryCallingCode}
          </option>
        ))}
      </select>

      {/* drapeau positionné à gauche dans le select */}
      {Icon && value ? (
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
          <Icon country={value} title={value} />
        </span>
      ) : null}

      {/* caret */}
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/70">
        ▾
      </span>
    </div>
  );
}

export default function PhoneField({ value, onChange }: Props) {
  // config commune
  const inputProps = useMemo(
    () => ({
      name: "phone",
      autoComplete: "tel",
    }),
    []
  );

  return (
    <div className="flex gap-2 items-stretch w-full">
      <PhoneInput
        value={value}
        onChange={onChange}
        defaultCountry="MA"
        international
        countryCallingCodeEditable={false}
        flags={flags}
        // composant champ numéro
        inputComponent={TextInput as any}
        // composant sélecteur personnalisé (drapeau + +code)
        countrySelectComponent={CountrySelect as any}
        // classes : on masque les labels longs du lib
        className="flex w-full items-stretch gap-2"
        inputProps={inputProps}
      />
    </div>
  );
}
