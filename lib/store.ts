// lib/store.ts
// ultra-simple in-memory store for dev/testing (will reset on server restart)

export type OtpEntry = { code: string; expiresAt: number };
export type SubRecord = {
  userPhone: string;
  subscriptionId: string;
  plan: "CONTINU" | "PASS1MOIS";
  planId: string;
  status: string;
  accessStart: string;
  accessEnd: string | null;
  payer?: any;
};

const otpMap = new Map<string, OtpEntry>();      // key: phoneE164
const sessionMap = new Map<string, string>();    // key: sessionToken -> phoneE164
const subs: SubRecord[] = [];

export const Store = {
  otpMap, sessionMap, subs,
};
