// app/api/pro/endpoint/route.ts
import { NextResponse } from "next/server";
import { assertPaidAccess, clearSessionCookie } from "@/lib/auth";

export async function GET() {
  const { ok } = await assertPaidAccess();
  if (!ok) {
    // Session invalide ou abonnement expiré
    // (optionnel : clearSessionCookie();)
    return NextResponse.json(
      { ok: false, error: "Accès réservé — veuillez activer votre espace." },
      { status: 403 }
    );
  }

  // ✅ Accès autorisé — contenu réservé
  return NextResponse.json({
    ok: true,
    message: "Bienvenue dans l’espace premium.",
  });
}
