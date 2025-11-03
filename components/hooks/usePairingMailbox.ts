// components/hooks/usePairingMailbox.ts
import { useCallback, useEffect, useRef, useState } from "react";

type PendingResp =
  | { has: false }
  | { has: true; challengeId: string; code: string; expiresAt: string; attemptsLeft: number };

export function usePairingMailbox(enabled: boolean) {
  const [pending, setPending] = useState<PendingResp>({ has: false });
  const pollingRef = useRef<number | null>(null);

  const fetchOnce = useCallback(async () => {
    try {
      const r = await fetch("/api/pairing/pending", { cache: "no-store" });
      const data = (await r.json()) as PendingResp;
      setPending(data);
      // Mini-boucle courte uniquement si un code existe (pour TTL/refresh) – max 30s
      if (data.has && pollingRef.current == null) {
        pollingRef.current = window.setInterval(fetchOnce, 5000);
        window.setTimeout(() => {
          if (pollingRef.current) {
            window.clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }, 30000);
      }
    } catch {
      // neutre
    }
  }, []);

  // Tir ponctuel quand la modale/menu s’ouvre
  useEffect(() => {
    if (!enabled) return;
    fetchOnce();
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [enabled, fetchOnce]);

  // Tir ponctuel quand l’onglet revient au premier plan
  useEffect(() => {
    if (!enabled) return;
    const onVis = () => {
      if (document.visibilityState === "visible") fetchOnce();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled, fetchOnce]);

  return {
    pending,              // { has:false } ou { has:true, code, challengeId, ... }
    clear: () => setPending({ has: false }),
  };
}
