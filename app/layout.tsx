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

        {/* JSON-LD schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "OneBoarding AI",
              url: "https://oneboardingai.com",
              founder: "Benmehdi Mohamed Rida",
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
