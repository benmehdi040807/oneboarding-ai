// lib/quota.ts
export const LS = {
  LANG: "oneboarding.lang",
  DAILY_COUNT: "oneboarding.dailyCount",
  DAILY_STAMP: "oneboarding.dailyStamp", // yyyy-mm-dd en LOCAL (pas UTC)
  PROMO_UNTIL: "oneboarding.promoUntil",
};

/** Stamp de jour strictement LOCAL (yyyy-mm-dd) */
function todayStampLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Minuit local de ce soir (timestamp ms) */
function endOfTodayTs(): number {
  const d = new Date();
  d.setHours(24, 0, 0, 0); // prochain minuit LOCAL
  return d.getTime();
}

function readNum(key: string, def = 0): number {
  try {
    const v = localStorage.getItem(key);
    if (v == null) return def;
    // accepte "3" ou "3.0" ou JSON "3"
    const parsed = JSON.parse(v);
    const n = typeof parsed === "number" ? parsed : Number(parsed);
    return Number.isFinite(n) ? n : def;
  } catch {
    return def;
  }
}

function write(key: string, val: any) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

/** Réinitialise le quota si on a changé de JOUR LOCAL */
export function resetIfNewDay() {
  const stamp = localStorage.getItem(LS.DAILY_STAMP);
  const today = todayStampLocal();
  if (stamp !== today) {
    write(LS.DAILY_STAMP, today);
    write(LS.DAILY_COUNT, 0);
    write(LS.PROMO_UNTIL, 0);
  }
}

export function getDailyCount(): number {
  resetIfNewDay();
  return readNum(LS.DAILY_COUNT, 0);
}

/**
 * Incrémente le compteur et, si on atteint le seuil, active la promo jusqu’à minuit (LOCAL).
 * Émet aussi l’événement 'ob:interaction-limit-reached' pour afficher la bannière immédiatement.
 */
export function noteInteractionAndMaybeLock(): { count: number; reached: boolean } {
  resetIfNewDay();
  const c = getDailyCount() + 1;
  write(LS.DAILY_COUNT, c);

  const reached = c >= 3; // seuil actuel
  if (reached) {
    write(LS.PROMO_UNTIL, endOfTodayTs());
    try {
      window.dispatchEvent(new Event("ob:interaction-limit-reached"));
    } catch {}
  }
  return { count: c, reached };
}

/** TRUE si la promo/quota est actif maintenant (jusqu’à minuit LOCAL) */
export function promoActiveNow(): boolean {
  resetIfNewDay();
  const until = readNum(LS.PROMO_UNTIL, 0);
  return until > Date.now();
}
