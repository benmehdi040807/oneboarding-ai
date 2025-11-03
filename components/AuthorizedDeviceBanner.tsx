// components/AuthorizedDeviceBanner.tsx
import { usePairingMailbox } from "./hooks/usePairingMailbox";

export default function AuthorizedDeviceBanner({ menuOpen }: { menuOpen: boolean }) {
  const { pending, clear } = usePairingMailbox(menuOpen);
  if (!pending.has) return null;

  return (
    <div className="fixed inset-x-0 top-4 mx-auto w-[min(560px,92%)] rounded-2xl border border-black/10 bg-white p-4 shadow-lg">
      <div className="text-sm opacity-70 mb-1">
        Tentative d’ajout d’un nouvel appareil
      </div>
      <div className="text-2xl font-semibold tracking-widest text-center my-2">
        {pending.code.slice(0,3)} {pending.code.slice(3)}
      </div>
      <div className="text-xs opacity-60">
        Recopiez ce code sur le nouvel appareil pour confirmer. Sinon, ignorez.
      </div>
      <div className="mt-3 flex justify-end">
        <button onClick={clear} className="rounded-xl px-3 py-2 text-sm bg-black text-white">
          Fermer
        </button>
      </div>
    </div>
  );
}
