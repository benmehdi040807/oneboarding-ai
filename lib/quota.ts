// lib/quota.ts
export const LS = {
  LANG: "oneboarding.lang",
  DAILY_COUNT: "oneboarding.dailyCount",
  DAILY_STAMP: "oneboarding.dailyStamp",
  PROMO_UNTIL: "oneboarding.promoUntil",
};

function todayStamp() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function endOfTodayTs() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}
function readNum(key: string, def = 0) {
  try { const v = localStorage.getItem(key); return v ? Number(JSON.parse(v)) : def; } catch { return def; }
}
function write(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function resetIfNewDay() {
  const stamp = localStorage.getItem(LS.DAILY_STAMP);
  const today = todayStamp();
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

export function noteInteractionAndMaybeLock(): { count: number; reached: boolean } {
  resetIfNewDay();
  const c = getDailyCount() + 1;
  write(LS.DAILY_COUNT, c);
  const reached = c >= 3;
  if (reached) {
    write(LS.PROMO_UNTIL, endOfTodayTs());
    // notifie la bannière de s’afficher immédiatement
    window.dispatchEvent(new Event("ob:interaction-limit-reached"));
  }
  return { count: c, reached };
}

export function promoActiveNow(): boolean {
  resetIfNewDay();
  const until = readNum(LS.PROMO_UNTIL, 0);
  return until > Date.now();
}
