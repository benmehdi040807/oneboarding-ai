// ...
const allowFree = process.env.DEV_ALLOW_FREE === "1";

// (Optionnel) Vérifier statut d'abonnement : user:phone
const user = await kv.get<{ status: "paid" | "free" }>(`user:${phoneE164}`);

if (!allowFree) {
  if (!user || user.status !== "paid") {
    return NextResponse.json({ ok: false, error: "PAYMENT_REQUIRED" }, { status: 402 });
  }
}
// sinon, en dev on laisse passer
