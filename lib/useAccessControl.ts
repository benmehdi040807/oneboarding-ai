// lib/useAccessControl.ts
"use client";

import { useEffect, useMemo, useState } from "react";

export type AccessReason = "NONE" | "NEED_CONNECT" | "NEED_SUB";

export type AccessSnapshot = {
  connected: boolean;
  planActive: boolean;
  unlimited: boolean; // (connected && planActive) => “membre complet”
};

function readBoolLS(key: string): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

/**
 * useAccessControl()
 *
 * ✅ UI-only snapshot (aucune logique métier de barrière)
 * ✅ Aucun appel réseau (plus de /api/quota/consume)
 *
 * Rôle :
 * - donner à l’UI un “état” : connecté ? plan actif ?
 * - permettre d’afficher des indices/menus/CTA, sans bloquer.
 *
 * La barrière “3 free / day” est désormais souveraine côté serveur (/api/generate).
 */
export function useAccessControl() {
  const [connected, setConnected] = useState(false);
  const [planActive, setPlanActive] = useState(false);

  useEffect(() => {
    // init
    setConnected(readBoolLS("ob_connected"));
    setPlanActive(readBoolLS("oneboarding.spaceActive"));

    // listeners
    const onConnectedChanged = () => setConnected(readBoolLS("ob_connected"));

    const onSpaceActivated = () => setPlanActive(true);
    const onSpaceDeactivated = () => setPlanActive(false);

    const onPlanChanged = () => setPlanActive(readBoolLS("oneboarding.spaceActive"));

    window.addEventListener("ob:connected-changed", onConnectedChanged);
    window.addEventListener("ob:space-activated", onSpaceActivated);
    window.addEventListener("ob:space-deactivated", onSpaceDeactivated);
    window.addEventListener("ob:plan-changed", onPlanChanged);

    // bonus : sync via storage (si multi-tabs)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ob_connected") setConnected(readBoolLS("ob_connected"));
      if (e.key === "oneboarding.spaceActive") setPlanActive(readBoolLS("oneboarding.spaceActive"));
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("ob:connected-changed", onConnectedChanged);
      window.removeEventListener("ob:space-activated", onSpaceActivated);
      window.removeEventListener("ob:space-deactivated", onSpaceDeactivated);
      window.removeEventListener("ob:plan-changed", onPlanChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const snapshot: AccessSnapshot = useMemo(() => {
    const unlimited = connected && planActive;
    return { connected, planActive, unlimited };
  }, [connected, planActive]);

  return { snapshot };
                                                                        }
