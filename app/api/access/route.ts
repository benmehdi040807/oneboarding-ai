// app/api/access/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Point d’accès public décrivant la politique d’utilisation.
 * - 3 interactions gratuites par jour
 * - Invitation à activer l’espace pour un accès illimité
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    policy: {
      freeInteractions: 3,
      renewal: "quotidien",
      message:
        "Vous disposez de 3 interactions gratuites par jour. Pour continuer votre expérience OneBoarding AI, activez votre espace personnel en 30 secondes (paiement inclus).",
      link: "https://oneboardingai.com",
    },
    time: new Date().toISOString(),
  });
}
