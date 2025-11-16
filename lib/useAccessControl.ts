// lib/useAccessControl.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { consumeOne } from "@/lib/quotaClient";

export type AccessReason = "NONE" | "NEED_CONNECT" | "NEED_SUB";

type AccessSnapshot = {
  connected: boolean;
  planActive: boolean;
  unlimited: boolean;
};

type CheckResult =
  | { allowed: true; snapshot: AccessSnapshot }
  | { allowed: false; reason: AccessReason; snapshot: AccessSnapshot };

function readBoolLS(key: string): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

// Hook central : règle produit
// - planActive && connected  → illimité (pas d’appel quota)
// - sinon → quota 3/jour via /api/quota/consume
//   • planActive && !connected → NEED_CONNECT
//   • planInactive            → NEED_SUB
export function useAccessControl() {
  const [connected, setConnected] = useState(false);
  const [planActive, setPlanActive] = useState(false);

  // Lecture initiale depuis localStorage
  useEffect(() => {
    setConnected(readBoolLS("ob_connected"));
    setPlanActive(readBoolLS("oneboarding.spaceActive"));

    const onConnectedChanged = () => {
      setConnected(readBoolLS("ob_connected"));
    };
    const onSpaceActivated = () => {
      setPlanActive(true);
    };
    const onSpaceDeactivated = () => {
      setPlanActive(false);
    };
    const onPlanChanged = () => {
      // recalcul doux à partir du localStorage
      setPlanActive(readBoolLS("oneboarding.spaceActive"));
    };

    window.addEventListener("ob:connected-changed", onConnectedChanged);
    window.addEventListener("ob:space-activated", onSpaceActivated);
    window.addEventListener("ob:space-deactivated", onSpaceDeactivated);
    window.addEventListener("ob:plan-changed", onPlanChanged);

    return () => {
      window.removeEventListener("ob:connected-changed", onConnectedChanged);
      window.removeEventListener("ob:space-activated", onSpaceActivated);
      window.removeEventListener("ob:space-deactivated", onSpaceDeactivated);
      window.removeEventListener("ob:plan-changed", onPlanChanged);
    };
  }, []);

  const unlimited = connected && planActive;
  const snapshot: AccessSnapshot = { connected, planActive, unlimited };

  // À appeler AVANT chaque envoi de message
  const checkAndConsume = useCallback(async (): Promise<CheckResult> => {
    // 1) Abonné + connecté → illimité, on ne touche PAS au quota serveur
    if (unlimited) {
      return { allowed: true, snapshot };
    }

    // 2) Autres cas → on passe par le quota cookie (/api/quota/consume)
    try {
      const res: any = await consumeOne();

      if (res?.ok) {
        // ok: quota consommé, interaction autorisée
        return { allowed: true, snapshot };
      }

      // quota atteint
      const reason: AccessReason = planActive ? "NEED_CONNECT" : "NEED_SUB";
      return { allowed: false, reason, snapshot };
    } catch {
      // En cas d’erreur réseau quota → on ne bloque pas l’utilisateur
      return { allowed: true, snapshot };
    }
  }, [unlimited, connected, planActive, snapshot]);

  return { snapshot, checkAndConsume };
}
