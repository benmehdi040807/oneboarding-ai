"use client";

import RightAuthButtons from "./RightAuthButtons";

export default function QuestionBar() {
  return (
    <div className="relative w-full max-w-[720px] mx-auto">
      {/* Barre / Input */}
      <input
        placeholder="Votre question…"
        className="
          w-full h-12 rounded-2xl bg-black/80 text-white
          pl-32 pr-28  /* place pour les boutons gauche/droite */
          outline-none placeholder-white/60
        "
      />

      {/* Boutons GAUCHE – style identique */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-30">
        <button
          type="button"
          aria-label="Joindre un fichier"
          className="h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow flex items-center justify-center"
        >
          {/* icône trombone simple (caractère) – remplace par ton SVG si tu veux */}
          <span className="text-black/80 text-xl">📎</span>
        </button>
        <button
          type="button"
          aria-label="Dicter au micro"
          className="h-12 w-12 rounded-2xl bg-white/70 hover:bg-white/80 shadow flex items-center justify-center"
        >
          <span className="text-black/80 text-xl">🎤</span>
        </button>
      </div>

      {/* Boutons DROITE – via le composant existant */}
      <RightAuthButtons />
    </div>
  );
}
