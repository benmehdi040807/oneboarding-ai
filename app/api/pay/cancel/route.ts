// app/api/pay/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Utilisé par le flow d'abonnement (Subscriptions v1) comme cancel_url.
// Redirige vers /?cancel=1 afin que PaymentReturnBridge nettoie l'URL côté client.
function baseUrl() {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "https://oneboardingai.com";
  return b.endsWith("/") ? b.slice(0, -1) : b;
}

export async function GET(_req: NextRequest) {
  return NextResponse.redirect(`${baseUrl()}/?cancel=1`, 302);
}
