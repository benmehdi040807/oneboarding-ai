export const runtime = 'nodejs';  // ✅ empêche le warning Edge

export const metadata = {
title: "Mentions / Données — OneBoarding AI",
};

export default function LegalPage() {
return (
<main className="py-8 px-4 max-w-2xl mx-auto text-white">
<h1 className="text-xl font-bold mb-4">Données & confidentialité</h1>
<p className="text-white/80 mb-3">
Cette démo stocke localement sur votre appareil :
</p>
<ul className="list-disc pl-5 text-white/80 mb-4">
<li>Votre historique de prompts,</li>
<li>Votre consentement au bandeau RGPD.</li>
</ul>
<p className="text-white/70">
Aucune donnée n’est envoyée côté serveur dans cette version MVP.
</p>
</main>
);
}
