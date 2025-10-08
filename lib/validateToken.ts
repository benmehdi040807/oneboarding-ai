// lib/validateToken.ts
/**
 * Validation "serveur" du token stocké en localStorage (ob_token).
 * - Appelle /api/verify-token (signature + fenêtre de validité)
 * - Nettoie localStorage si invalide
 * - Mémoise le résultat 5 minutes dans sessionStorage pour éviter le spam
 */

type VerifyResp =
  | { ok: true; sub: string; iat: number; ageMs: number; expiresInMs: number }
  | { ok: false; error: string };

const LS_TOKEN = "ob_token";
const LS_CONNECTED = "ob_connected";
const SS_LAST_CHECK_AT = "oneboarding.tokenLastCheckAt";
const SS_LAST_RESULT = "oneboarding.tokenLastResult"; // "1" | "0"
const CHECK_TTL_MS = 5 * 60_000; // 5 min

function now() {
  return Date.now();
}

function readLS(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLS(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {}
}

function rmLS(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function readSS(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSS(key: string, val: string) {
  try {
    sessionStorage.setItem(key, val);
  } catch {}
}

/**
 * Vérifie le token côté serveur.
 * @returns true si valide, false sinon (et dans ce cas ob_connected/ob_token sont supprimés)
 */
export async function checkTokenServerSide(opts?: { force?: boolean }): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const token = readLS(LS_TOKEN);
  if (!token) {
    // Pas de token → on s'assure que l'UI est "déconnectée"
    rmLS(LS_CONNECTED);
    return false;
  }

  // Throttle (mémoise pendant 5 min par session navigateur)
  if (!opts?.force) {
    const lastAtStr = readSS(SS_LAST_CHECK_AT);
    const lastRes = readSS(SS_LAST_RESULT);
    const lastAt = lastAtStr ? Number(lastAtStr) : 0;
    if (lastRes && lastAt && now() - lastAt < CHECK_TTL_MS) {
      // On renvoie le dernier résultat connu rapidement
      return lastRes === "1";
    }
  }

  try {
    const res = await fetch("/api/verify-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Empêche tout cache intermédaire
        "Cache-Control": "no-store",
      },
      cache: "no-store",
      body: JSON.stringify({ token }),
    });

    const j: VerifyResp = await res.json();

    const ok = !!j && (j as any).ok === true;
    writeSS(SS_LAST_CHECK_AT, String(now()));
    writeSS(SS_LAST_RESULT, ok ? "1" : "0");

    if (ok) {
      // On s’assure que l’UI reste en “connecté”
      writeLS(LS_CONNECTED, "1");
      return true;
    }

    // Invalide → nettoyage strict
    rmLS(LS_CONNECTED);
    rmLS(LS_TOKEN);
    // Informe le reste de l’app si quelqu’un écoute
    window.dispatchEvent(new Event("ob:connected-changed"));
    return false;
  } catch {
    // En cas d’erreur réseau, on ne casse pas l’UX : on laisse l’état tel quel,
    // mais on mémorise un "échec" court pour éviter de spammer.
    writeSS(SS_LAST_CHECK_AT, String(now()));
    writeSS(SS_LAST_RESULT, "0");
    return false;
  }
}

/**
 * Ajoute une garde automatique globale :
 *  - Vérifie au chargement
 *  - Revérifie quand “ob:connected-changed” est déclenché
 */
export function attachAutoTokenGuard() {
  if (typeof window === "undefined") return;

  // 1) Au chargement (micro-délais pour laisser le reste s’initialiser)
  setTimeout(() => { void checkTokenServerSide({ force: true }); }, 50);

  // 2) Quand un autre module change l’état de connexion
  const onEvt = () => { void checkTokenServerSide({ force: true }); };
  window.addEventListener("ob:connected-changed", onEvt);

  // Retourne un disposer (si tu veux l’appeler dans un useEffect)
  return () => window.removeEventListener("ob:connected-changed", onEvt);
}
