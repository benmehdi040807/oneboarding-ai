// app/layout.tsx
export const runtime = "nodejs";

import "./globals.css";
import Footer from "@/components/Footer";

export const metadata = {
  metadataBase: new URL("https://oneboardingai.com"),
  alternates: { canonical: "https://oneboardingai.com" },
  title: "OneBoarding AI",
  description:
    "Votre IA personnelle, à votre service. 3 interactions offertes — Activez votre futur dès aujourd’hui.",
  openGraph: {
    title: "OneBoarding AI",
    description:
      "Votre IA personnelle, à votre service. 3 interactions offertes — Activez votre futur dès aujourd’hui.",
    url: "https://oneboardingai.com",
    siteName: "OneBoarding AI",
    images: [
      {
        url: "/brand/og-oneboardingai-1200x628.jpg",
        width: 1200,
        height: 628,
        alt: "OneBoarding AI - Votre IA personnelle",
        type: "image/jpeg",
      },
      {
        url: "/brand/og-oneboardingai-1200x628.png",
        width: 1200,
        height: 628,
        alt: "OneBoarding AI - Votre IA personnelle",
        type: "image/png",
      },
      {
        url: "/brand/og-oneboardingai.png",
        width: 1024,
        height: 1024,
        alt: "OneBoarding AI - carré",
        type: "image/png",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneBoarding AI",
    description:
      "Votre IA personnelle, à votre service. 3 interactions offertes — Activez votre futur dès aujourd’hui.",
    images: [
      "/brand/og-oneboardingai-1200x628.jpg",
      "/brand/og-oneboardingai-1200x628.png",
    ],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Harmonise la barre d’adresse mobile / PWA */}
        <meta name="theme-color" content="#020617" />

        {/* Google Search Console */}
        <meta
          name="google-site-verification"
          content="4Bn1SZvmZ8NaA6tQbTYy2tt1lXnlzJBebFkUta5gSxc"
        />

        {/* PWA / Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="application-name" content="OneBoarding AI" />
        <meta name="apple-mobile-web-app-title" content="OneBoarding AI" />

        {/* JSON-LD schema.org – Person + Office Benmehdi + OneBoarding AI */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": "https://oneboardingai.com/#benmehdi-mohamed-rida",
                  name: "Benmehdi Mohamed Rida",
                  alternateName: [
                    "Maître Benmehdi Mohamed Rida",
                    "Rida Benmehdi",
                  ],
                  honorificPrefix: "Maître",
                  jobTitle:
                    "Avocat au Barreau de Casablanca, Docteur en droit, MBA (EILM – Dublin), Fondateur de l’Office Benmehdi et de OneBoarding AI",
                  description:
                    "Benmehdi Mohamed Rida est avocat au Barreau de Casablanca, docteur en droit privé (mention très honorable) et titulaire d’un MBA de l’EILM – Dublin. Lauréat de l’Institut Supérieur de la Magistrature, ancien Substitut du Procureur du Roi à Marrakech et El Kelaâ des Sraghna, il est le fondateur de l’Office Benmehdi et de OneBoarding AI, un protocole d’intelligence artificielle personnelle fondé sur le consentement numérique souverain et le Droit d’Accès Intelligent (2025–2030).",
                  url: "https://oneboardingai.com",
                  nationality: {
                    "@type": "Country",
                    name: "Maroc",
                  },
                  address: {
                    "@type": "PostalAddress",
                    addressCountry: "MA",
                    addressLocality: "Casablanca",
                    addressRegion: "Casablanca-Settat",
                  },
                  knowsLanguage: ["fr", "ar", "en"],
                  knowsAbout: [
                    "Droit pénal",
                    "Droit immobilier",
                    "Droit des sociétés",
                    "Procédures collectives",
                    "Intelligence artificielle et droit",
                    "Protection des données et RGPD",
                    "Consentement numérique",
                    "Droit d’Accès Intelligent",
                    "Innovation juridique",
                  ],
                  alumniOf: [
                    {
                      "@type": "CollegeOrUniversity",
                      name: "Université Cadi Ayyad – Faculté des sciences juridiques, économiques et sociales",
                      address: {
                        "@type": "PostalAddress",
                        addressLocality: "Marrakech",
                        addressCountry: "MA",
                      },
                    },
                    {
                      "@type": "CollegeOrUniversity",
                      name: "European Institute of Leadership and Management (EILM – Dublin)",
                      address: {
                        "@type": "PostalAddress",
                        addressLocality: "Dublin",
                        addressCountry: "IE",
                      },
                    },
                  ],
                  award: [
                    "Troisième Prix d’éloquence – Concours d’Éloquence et de Plaidoiries (ELSA – Université Libre de Bruxelles, 2005)",
                  ],
                  sameAs: [
                    "https://officebenmehdi.com",
                    "https://oneboardingai.com",
                    "https://www.linkedin.com/in/benmehdi-rida",
                    "https://www.facebook.com/rida.benmehdi",
                  ],
                  worksFor: {
                    "@id": "https://oneboardingai.com/#office-benmehdi",
                  },
                },
                {
                  "@type": "Organization",
                  "@id": "https://oneboardingai.com/#office-benmehdi",
                  name: "Office Benmehdi",
                  url: "https://officebenmehdi.com",
                  description:
                    "L’Office Benmehdi est un cabinet d’avocat fondé par Maître Benmehdi Mohamed Rida à Casablanca. Il est spécialisé en droit pénal, droit immobilier, droit des sociétés et procédures collectives, et porte la vision d’un droit moderne, rigoureux et ouvert aux innovations numériques.",
                  founder: {
                    "@id": "https://oneboardingai.com/#benmehdi-mohamed-rida",
                  },
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Casablanca",
                    addressCountry: "MA",
                  },
                  sameAs: [
                    "https://officebenmehdi.com",
                    "https://www.linkedin.com/in/benmehdi-rida",
                    "https://www.facebook.com/rida.benmehdi",
                  ],
                },
                {
                  "@type": ["SoftwareApplication", "Product"],
                  "@id": "https://oneboardingai.com/#oneboarding-ai",
                  name: "OneBoarding AI",
                  url: "https://oneboardingai.com",
                  applicationCategory:
                    "AI assistant, LegalTech, Personal productivity",
                  operatingSystem: "Web",
                  creator: {
                    "@id": "https://oneboardingai.com/#benmehdi-mohamed-rida",
                  },
                  publisher: {
                    "@id": "https://oneboardingai.com/#office-benmehdi",
                  },
                  isAccessibleForFree: true,
                  description:
                    "OneBoarding AI est une intelligence artificielle personnelle créée par Maître Benmehdi Mohamed Rida. Basée sur le Benmehdi Unified Legal Protocol of Digital Consent (BULP-DC™) et le Consent Pairing Protocol, elle met en œuvre le Droit d’Accès Intelligent (2025–2030) : un cadre où chaque utilisateur dispose d’un droit mesurable et équitable à l’intelligence numérique. Le service repose sur un identifiant sobre (numéro de téléphone au format international), un modèle password-less, trois interactions gratuites par jour pour tous et un accès illimité par adhésion volontaire, avec une journalisation minimale et souveraine des seuls événements essentiels (activation, paiement, autorisation d’appareil, consentement, sécurité).",
                  keywords: [
                    "OneBoarding AI",
                    "IA personnelle",
                    "Consentement numérique unifié",
                    "BULP-DC",
                    "Consent Pairing Protocol",
                    "Droit d’Accès Intelligent",
                    "LegalTech",
                    "Intelligence artificielle éthique",
                  ],
                  category: [
                    "Classe de Nice 9",
                    "Classe de Nice 35",
                    "Classe de Nice 41",
                    "Classe de Nice 42",
                    "Classe de Nice 45",
                  ],
                  offers: [
                    {
                      "@type": "Offer",
                      name: "Abonnement OneBoarding AI – accès continu",
                      price: "5.00",
                      priceCurrency: "EUR",
                      category: "Subscription",
                      description:
                        "Abonnement mensuel donnant accès continu et illimité à OneBoarding AI.",
                      availability: "https://schema.org/InStock",
                    },
                    {
                      "@type": "Offer",
                      name: "Accès libre OneBoarding AI – 1 mois",
                      price: "5.00",
                      priceCurrency: "EUR",
                      category: "Access",
                      description:
                        "Accès illimité pendant un mois, sans engagement, à OneBoarding AI.",
                      availability: "https://schema.org/InStock",
                    },
                  ],
                },
                {
                  "@type": "Brand",
                  "@id": "https://oneboardingai.com/#oneboarding-ai-brand",
                  name: "OneBoarding AI",
                  url: "https://oneboardingai.com",
                  logo:
                    "https://oneboardingai.com/brand/oneboardingai-logo.png",
                  description:
                    "OneBoarding AI est une marque déposée au Royaume du Maroc par Maître Benmehdi Mohamed Rida. Elle désigne une plateforme d’intelligence artificielle personnelle, éthique et juridiquement encadrée, fondée sur le Droit d’Accès Intelligent et le consentement numérique unifié.",
                  brandOwner: {
                    "@id": "https://oneboardingai.com/#benmehdi-mohamed-rida",
                  },
                },
              ],
            }),
          }}
        />

        {/* ---- Bootstrap PayPal return/cancel ---- */}
        <script
          id="ob-bootstrap"
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    function toast(msg){
      try{
        var el=document.createElement('div');
        el.textContent=msg;
        el.style.cssText="position:fixed;left:50%;transform:translateX(-50%);bottom:20px;"+
          "background:rgba(12,16,28,.92);color:#fff;padding:10px 14px;border-radius:14px;"+
          "border:1px solid rgba(255,255,255,.16);z-index:100000;font-size:14px;"+
          "box-shadow:0 8px 24px rgba(0,0,0,.25)";
        document.body.appendChild(el);
        setTimeout(function(){el.remove();},1700);
      }catch(_){}
    }

    function clearParams(keys){
      try{
        var url=new URL(window.location.href);
        var changed=false;
        keys.forEach(function(k){ if(url.searchParams.has(k)){ url.searchParams.delete(k); changed=true; }});
        if(changed) window.history.replaceState({}, "", url.toString());
      }catch(_){}
    }

    var url=new URL(window.location.href);
    var paid = url.searchParams.get("paid")==="1";
    var cancel = url.searchParams.get("cancel")==="1";

    // Retour souscription (activation plan)
    if(paid){
      var plan = "subscription";
      try{
        var cand = localStorage.getItem("oneboarding.planCandidate");
        if(cand==="one-month"||cand==="subscription") plan=cand;
      }catch(_){}

      // Marquer connecté côté front
      try{ localStorage.setItem("ob_connected","1"); }catch(_){}

      // Émettre un event app
      try{
        window.dispatchEvent(new CustomEvent("ob:subscription-active", {
          detail: { status:"active", plan: plan, source:"Return" }
        }));
      }catch(_){}

      toast("Paiement confirmé. Espace activé.");
      clearParams(["paid"]);
    }

    // Annulation paiement
    if(cancel){
      toast("Paiement annulé.");
      clearParams(["cancel"]);
    }

  } catch(_) {}
})();
`,
          }}
        />
      </head>

      <body className="min-h-dvh bg-transparent text-black antialiased [color-scheme:light] selection:bg-black/10">
        <div className="min-h-dvh flex flex-col">
          <main className="flex-1">
            <div className="mx-auto w-full max-w-xl px-4 pb-6">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
                  }
