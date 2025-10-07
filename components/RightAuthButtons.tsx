"use client";

import { useEffect, useRef, useState } from "react";

/**
 * RightAuthButtons — Vitrine “Coming soon”
 * ---------------------------------------------------------
 * • O bleu  : One IA (Génération II) — message officiel, bouton OK
 * • O doré  : Mirror IA (Génération III) — message officiel, bouton OK
 * • Re-cliquer sur le bouton ferme le dialog (toggle)
 * • Dialog natif <dialog> (backdrop système), fermeture par clic extérieur / ESC
 * • Aucun lien avec la création/connexion : ces flux sont désormais gérés par le Menu.
 */

export default function RightAuthButtons() {
  const [openBlue, setOpenBlue] = useState(false);
  const [openGold, setOpenGold] = useState(false);

  const blueRef = useRef<HTMLDialogElement | null>(null);
  const goldRef = useRef<HTMLDialogElement | null>(null);

  // Ouvrir/fermer les dialogs selon état
  useEffect(() => {
    const d = blueRef.current;
    if (!d) return;
    if (openBlue && !d.open) d.showModal();
    if (!openBlue && d.open) d.close();
  }, [openBlue]);
  useEffect(() => {
    const d = goldRef.current;
    if (!d) return;
    if (openGold && !d.open) d.showModal();
    if (!openGold && d.open) d.close();
  }, [openGold]);

  // Gérer ESC / Cancel natif
  useEffect(() => {
    const attach = (dlg: HTMLDialogElement | null, onClose: () => void) => {
      if (!dlg) return () => {};
      const onCancel = (e: Event) => {
        e.preventDefault();
        onClose();
      };
      dlg.addEventListener("cancel", onCancel);
      return () => dlg.removeEventListener("cancel", onCancel);
    };
    const cleanBlue = attach(blueRef.current, () => setOpenBlue(false));
    const cleanGold = attach(goldRef.current, () => setOpenGold(false));
    return () => {
      cleanBlue();
      cleanGold();
    };
  }, []);

  // Fermer si clic sur le backdrop
  const onBackdropClick =
    (setOpen: (v: boolean) => void, ref: React.RefObject<HTMLDialogElement>) =>
    (e: React.MouseEvent<HTMLDialogElement>) => {
      const d = ref.current;
      if (!d) return;
      const r = d.getBoundingClientRect();
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      if (!inside) setOpen(false);
    };

  // Styles communs
  const circle =
    "h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] " +
    "hover:bg-[var(--chip-hover)] grid place-items-center transition select-none";

  // Toggle par re-clic
  function onBlueClick() {
    setOpenBlue((v) => !v);
    if (openGold) setOpenGold(false);
  }
  function onGoldClick() {
    setOpenGold((v) => !v);
    if (openBlue) setOpenBlue(false);
  }

  return (
    <>
      {/* Boutons droits */}
      <div className="inline-flex items-center gap-3">
        {/* O bleu — One IA (Génération II) */}
        <button
          type="button"
          aria-label="One IA — Génération II (Coming soon)"
          onClick={onBlueClick}
          className={circle}
          title="One IA — Coming soon"
        >
          <span
            className="text-xl font-extrabold"
            style={{
              lineHeight: 1,
              background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            O
          </span>
        </button>

        {/* O doré — Mirror IA (Génération III) */}
        <button
          type="button"
          aria-label="Mirror IA — Génération III (Coming soon)"
          onClick={onGoldClick}
          className={circle}
          title="Mirror IA — Coming soon"
        >
          <span
            className="text-xl font-extrabold"
            style={{
              lineHeight: 1,
              background: "linear-gradient(90deg,#FFD451,#EABE3F,#D9D1C0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            O
          </span>
        </button>
      </div>

      {/* Backdrop natif doux */}
      <style>{`
        dialog::backdrop {
          background: rgba(0,0,0,.45);
          -webkit-backdrop-filter: saturate(120%) blur(2px);
          backdrop-filter: saturate(120%) blur(2px);
        }
      `}</style>

      {/* Dialog — O bleu */}
      <dialog
        ref={blueRef}
        onMouseDown={onBackdropClick(setOpenBlue, blueRef)}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg"
      >
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-semibold">One IA — Votre Intelligence personnelle</h2>
            <button
              type="button"
              onClick={() => setOpenBlue(false)}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-[15px] leading-6">
            <p>Une nouvelle ère s’annonce. L’intelligence devient personnelle, intime, à votre image.</p>
            <p>Votre IA vous accompagne, vous comprend, et évolue avec vous.</p>
            <p className="font-medium">Coming soon — La génération II.<br/>L’intelligence qui se souvient de vous, pour vous.</p>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setOpenBlue(false)}
              className="px-4 py-2 rounded-2xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
            >
              OK
            </button>
          </div>
        </div>
      </dialog>

      {/* Dialog — O doré */}
      <dialog
        ref={goldRef}
        onMouseDown={onBackdropClick(setOpenGold, goldRef)}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg"
      >
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-semibold">Mirror IA — L’Internet des intelligences</h2>
            <button
              type="button"
              onClick={() => setOpenGold(false)}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-[15px] leading-6">
            <p>L’intelligence ne sera plus seule. Elle dialoguera avec d’autres, sous votre regard, pour votre monde.</p>
            <p>Les IA personnelles se rencontreront, coopéreront, et créeront ensemble.</p>
            <p className="font-medium">Coming soon — La génération III.<br/>L’intelligence connectée, au service de l’humain.</p>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setOpenGold(false)}
              className="px-4 py-2 rounded-2xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg,#F1C049,#B5892D)" }}
            >
              OK
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
