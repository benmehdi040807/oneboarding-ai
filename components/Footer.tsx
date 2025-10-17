// components/Footer.tsx
"use client";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="
        fixed inset-x-0 bottom-0 z-[40]
        border-t border-black/10
        bg-[rgba(17,24,39,0.08)]   /* gris très léger, distinct mais discret */
        backdrop-blur-[6px]        /* verre dépoli doux */
        text-gray-600
      "
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)", // safe-area iOS/Android
      }}
    >
      <div className="mx-auto max-w-3xl px-4 py-2 text-center">
        <p className="text-xs leading-5 tracking-[0.01em]">
          OneBoarding AI® — Marque déposée fondée et représentée par Benmehdi Mohamed Rida.
          © 2025 OneBoardingAI.com — Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
