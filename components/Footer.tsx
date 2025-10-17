// components/Footer.tsx
"use client";

export default function Footer() {
  return (
    <footer
      className="
        fixed inset-x-0 bottom-0 z-[50]
        bg-white/30 backdrop-blur-[2px] border-t border-white/40
        px-3 py-[6px] text-center select-text
      "
    >
      <p
        className="
          mx-auto
          text-[10px] leading-[1.15] text-[#777]
          max-w-[66ch]  /* largeur cible ~2 lignes pleines */
          [text-wrap:balance]  /* équilibre les 2 lignes */
          break-words
        "
      >
        OneBoarding AI® — Marque déposée fondée et représentée par Benmehdi Mohamed Rida.
        © 2025 OneBoardingAI.com — Tous droits réservés.
      </p>
    </footer>
  );
}
