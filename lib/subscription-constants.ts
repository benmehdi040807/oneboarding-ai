// lib/subscription-constants.ts

export const PLANS = {
  ONE_DAY: "ONE_DAY",
  ONE_MONTH: "ONE_MONTH",
  ONE_YEAR: "ONE_YEAR",
  ONE_LIFE: "ONE_LIFE",
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];

export const STATUSES = {
  CREATED: "CREATED",
  APPROVED: "APPROVED",
  COMPLETED: "COMPLETED",
  CAPTURED: "CAPTURED",
  CANCELLED: "CANCELLED",
  DENIED: "DENIED",
  REFUNDED: "REFUNDED",
  UNKNOWN: "UNKNOWN",
} as const;

export type PayStatus = (typeof STATUSES)[keyof typeof STATUSES];

export function isPlan(v: any): v is Plan {
  return typeof v === "string" && Object.values(PLANS).includes(v as Plan);
}

export function isPayStatus(v: any): v is PayStatus {
  return typeof v === "string" && Object.values(STATUSES).includes(v as PayStatus);
}
