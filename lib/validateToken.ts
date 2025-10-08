// lib/checkToken.ts
export async function checkTokenServerSide(): Promise<boolean> {
  const t = localStorage.getItem("ob_token");
  if (!t) return false;
  try {
    const res = await fetch("/api/verify-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: t }),
    });
    const j = await res.json();
    if (j?.ok) return true;
  } catch {}
  // invalide → nettoyage
  localStorage.removeItem("ob_connected");
  localStorage.removeItem("ob_token");
  return false;
}
