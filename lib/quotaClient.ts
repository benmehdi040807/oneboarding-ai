// lib/quotaClient.ts
export type QuotaState = {
  ok: true;
  limit: number;
  used: number;
  remaining: number;
  stamp: string; // "YYYY-MM-DD" (Africa/Casablanca)
  tz: string;
};

export async function fetchQuota(): Promise<QuotaState> {
  const r = await fetch("/api/quota", { method: "GET", credentials: "include" });
  const j = await r.json();
  if (!r.ok || !j.ok) throw new Error("Failed to read quota");
  return j as QuotaState;
}

export async function consumeOne(): Promise<
  | { ok: true; used: number; remaining: number; stamp: string; bypass?: boolean }
  | { ok: false; code: "LIMIT_REACHED"; stamp: string }
> {
  const r = await fetch("/api/quota/consume", {
    method: "POST",
    credentials: "include",
  });
  return r.json();
}
