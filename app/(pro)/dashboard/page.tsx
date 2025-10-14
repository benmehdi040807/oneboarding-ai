// app/(pro)/dashboard/page.tsx
import { assertPaidAccess } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { ok } = await assertPaidAccess();
  if (!ok) {
    // 🔒 Redirection vers la page d’accueil pour activer l’accès
    redirect("/?subscribe=1");
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Espace Premium</h1>
      <p className="text-gray-700">
        Vous avez accès à la zone illimitée ✅
      </p>
    </main>
  );
}
