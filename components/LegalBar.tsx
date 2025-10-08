// components/LegalBar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "fr" | "en" | "ar";
const CONSENT_KEY = "oneboarding.legalConsent.v1";

const TXT: Record<Lang, any> = {
  fr: {
    pill: "CGU / Privacy",
    title: "Informations légales",
    accept: "J’accepte",
    later: "Plus tard",
    manifestoTitle: "Manifeste de Confiance — OneBoarding AI",
    manifesto: [
      "Clarté & sécurité : l’utilisateur reste maître de son usage et responsable de ses choix.",
      "Universalité : respect des règles d’ordre public de chaque pays.",
      "Équilibre : moyens raisonnables côté éditeur, responsabilité d’usage côté utilisateur.",
      "Confiance & transparence : confidentialité, respect mutuel et bonne foi.",
    ],
    cguTitle: "Conditions Générales d’Utilisation (CGU)",
    cguBullets: [
      "Objet : assistance alimentée par IA — aide à la décision.",
      "Responsabilité utilisateur : les contenus générés ne sont pas des conseils professionnels personnalisés.",
      "Indemnisation : l’utilisateur indemnise l’éditeur en cas d’usage contraire à la loi.",
    ],
    privacyTitle: "Politique de Confidentialité",
    privacyBullets: [
      "Stockage local : historique et consentements sur votre appareil.",
      "Sous-traitants techniques : acheminement des requêtes IA — aucune vente/partage publicitaire.",
      "Monétisation : accès au service (abonnements, crédits), jamais cession de données.",
      "Statistiques : mesures agrégées et anonymisées.",
      "Effacement : suppression possible à tout moment des données locales.",
    ],
  },
  en: {
    pill: "TOS / Privacy",
    title: "Legal information",
    accept: "Accept",
    later: "Later",
    manifestoTitle: "Trust Manifesto — OneBoarding AI",
    manifesto: [
      "Clarity & safety: you control usage and remain responsible for your choices.",
      "Universality: comply with each country’s public-order rules.",
      "Balance: reasonable means on publisher’s side; responsible use on user’s side.",
      "Trust & transparency: confidentiality, mutual respect, good faith.",
    ],
    cguTitle: "Terms of Service (TOS)",
    cguBullets: [
      "Purpose: AI-powered assistance — decision support.",
      "User responsibility: generated content is not personalized professional advice.",
      "Indemnification: user indemnifies publisher for unlawful use.",
    ],
    privacyTitle: "Privacy Policy",
    privacyBullets: [
      "Local storage: history and consents on your device.",
      "Processors: routing of AI requests — no ad selling/sharing.",
      "Monetization: service access (subscriptions/credits), never data sales.",
      "Stats: aggregated, anonymized measurements.",
      "Erasure: you can delete local data at any time.",
    ],
  },
  ar: {
    pill: "الشروط / الخصوصية",
    title: "معلومات قانونية",
    accept: "موافقة",
    later: "لاحقاً",
    manifestoTitle: "بيان الثقة — OneBoarding AI",
    manifesto: [
      "الوضوح والأمان: أنت المتحكم بالاستخدام ومسؤول عن اختياراتك.",
      "العالمية: احترام القواعد العامة في كل بلد.",
      "التوازن: وسائل معقولة من طرف الناشر ومسؤولية الاستخدام على المستخدم.",
      "الثقة والشفافية: سرية واحترام متبادل وحسن نية.",
    ],
    cguTitle: "شروط الاستخدام",
    cguBullets: [
      "الغرض: مساعدة مدعومة بالذكاء الاصطناعي — دعم اتخاذ القرار.",
      "مسؤولية المستخدم: المحتوى المولّد ليس نصيحة مهنية شخصية.",
      "التعويض: المستخدم يعوض الناشر عند الاستخدام المخالف للقانون.",
    ],
    privacyTitle: "سياسة الخصوصية",
    privacyBullets: [
      "تخزين محلي: السجل والموافقات على جهازك.",
      "معالِجون تقنيون: تمرير الطلبات — لا بيع/مشاركة إعلانية.",
      "الربحية: الوصول للخدمة (اشتراكات/أرصدة) وليس بيع البيانات.",
      "إحصاءات: مجمعة ومجهولة.",
      "المحو: يمكنك حذف البيانات المحلية في أي وقت.",
    ],
  },
};

export default function LegalBar() {
  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");

  const t = useMemo(() => TXT[lang], [lang]);

  useEffect(() => {
    try {
      const L = (localStorage.getItem("oneboarding.lang") as Lang) || "fr";
      setLang(L);
      setConsented(localStorage.getItem(CONSENT_KEY) === "1");
    } catch {}
  }, []);

  // écoute des changements de langue
  useEffect(() => {
    const onLang = (e: Event) => {
      const det = (e as CustomEvent).detail as { lang?: Lang };
      if (det?.lang) setLang(det.lang);
    };
    window.addEventListener("ob:lang-changed", onLang);
    return () => window.removeEventListener("ob:lang-changed", onLang);
  }, []);

  // ✅ hook d’ouverture forcée depuis le bouton Menu
  useEffect(() => {
    const onOpenLegal = () => {
      const ok = localStorage.getItem(CONSENT_KEY) === "1";
      if (!ok) setOpen(true);
    };
    window.addEventListener("ob:open-legal", onOpenLegal);
    return () => window.removeEventListener("ob:open-legal", onOpenLegal);
  }, []);

  function accept() {
    try { localStorage.setItem(CONSENT_KEY, "1"); } catch {}
    setConsented(true);
    setOpen(false);
  }

  return (
    <>
      {/* pill compact, mobile-first */}
      {!consented && (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-[56] flex justify-center">
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-full text-sm font-medium bg-white/90 hover:bg-white
                       border border-black/10 shadow-md text-black backdrop-blur active:scale-[.99]"
            aria-label={t.pill}
          >
            {t.pill}
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-2xl text-black">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold">{t.title}</h2>
              <div className="flex items-center gap-1">
                {(["fr","en","ar"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded-md text-xs border ${
                      lang === l ? "bg-black text-white border-black" : "bg-white text-black border-black/20"
                    }`}
                    aria-label={l.toUpperCase()}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={() => setOpen(false)}
                  className="ml-1 px-3 py-1.5 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              <section>
                <h3 className="font-semibold mb-1">{t.manifestoTitle}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {t.manifesto.map((li: string, i: number) => <li key={i}>{li}</li>)}
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">{t.cguTitle}</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  {t.cguBullets.map((li: string, i: number) => <li key={i}>{li}</li>)}
                </ol>
              </section>

              <section>
                <h3 className="font-semibold mb-1">{t.privacyTitle}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {t.privacyBullets.map((li: string, i: number) => <li key={i}>{li}</li>)}
                </ul>
              </section>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10"
              >
                {t.later}
              </button>
              <button
                onClick={accept}
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-black/90"
              >
                {t.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
