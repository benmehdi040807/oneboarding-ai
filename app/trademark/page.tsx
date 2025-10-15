// oneboarding-ai/app/trademark/page.tsx
import Link from "next/link";
import { Metadata } from "next";
import Script from "next/script";
import { useState } from "react";

export const metadata: Metadata = {
  title: "OneBoarding AI® — Marque déposée (OMPIC #291822)",
  description:
    "Notice officielle de la marque OneBoarding AI® — classes revendiquées (Nice 9, 35, 41, 42, 45), portée juridique et informations de contact.",
  openGraph: {
    title: "OneBoarding AI® — Registered Trademark",
    description:
      "Official notice for OneBoarding AI® — Nice classes 9, 35, 41, 42, 45. Legal scope and contact.",
    url: "https://oneboardingai.com/trademark",
    siteName: "OneBoarding AI",
    images: [
      {
        url: "https://oneboardingai.com/brand/oneboardingai-logo.png",
        width: 1200,
        height: 630,
        alt: "OneBoarding AI®",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  alternates: { canonical: "https://oneboardingai.com/trademark" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OneBoarding AI",
  url: "https://oneboardingai.com",
  logo: "https://oneboardingai.com/brand/oneboardingai-logo.png",
  sameAs: [
    "https://linkedin.com/in/benmehdi-rida",
    "https://facebook.com/rida.benmehdi",
  ],
  brand: {
    "@type": "Brand",
    name: "OneBoarding AI",
    logo: "https://oneboardingai.com/brand/oneboardingai-logo.png",
    slogan: "Legal-grade onboarding for AI",
    isFamilyFriendly: true,
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-3xl mx-auto my-6 p-5 rounded-2xl shadow-sm border">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="prose prose-zinc dark:prose-invert">{children}</div>
    </section>
  );
}

function Signature() {
  return (
    <div className="max-w-3xl mx-auto my-8 p-5 rounded-2xl bg-neutral-50 border">
      <h3 className="text-lg font-semibold mb-2">✒️ Signature officielle</h3>
      <p className="leading-relaxed">
        <strong>Maître Benmehdi Mohamed Rida</strong><br />
        Avocat au Barreau de Casablanca<br />
        Docteur en droit | MBA (EILM – Dublin)<br />
        Fondateur de <strong>OneBoarding AI®</strong>
      </p>
      <ul className="mt-3 space-y-1">
        <li>📱 WhatsApp : +212 6 61 14 00 25</li>
        <li>✉️ Email : <a className="underline" href="mailto:office.benmehdi@gmail.com">office.benmehdi@gmail.com</a></li>
        <li>🌐 <a className="underline" href="https://oneboardingai.com">oneboardingai.com</a></li>
        <li>🔗 <a className="underline" href="https://linkedin.com/in/benmehdi-rida">linkedin.com/in/benmehdi-rida</a></li>
        <li>🔗 <a className="underline" href="https://facebook.com/rida.benmehdi">facebook.com/rida.benmehdi</a></li>
      </ul>
    </div>
  );
}

const content = {
  fr: {
    title: "🏛️ OneBoarding AI® — Marque déposée (OMPIC #291822)",
    intro:
      "OneBoarding AI® est une marque déposée au Royaume du Maroc auprès de l’OMPIC (Récépissé de dépôt n° 291822, en date du 13 octobre 2025, CCIS El Jadida).",
    holder: (
      <>
        <strong>Maître Benmehdi Mohamed Rida</strong><br />
        Avocat au Barreau de Casablanca<br />
        Docteur en droit | MBA (EILM – Dublin)<br />
        Fondateur de <strong>OneBoarding AI®</strong>
      </>
    ),
    classes: (
      <ul>
        <li><strong>Classe 9 :</strong> Logiciels et applications d’intelligence artificielle ; programmes informatiques ; plateformes numériques et systèmes de traitement de données.</li>
        <li><strong>Classe 35 :</strong> Services de conseil en affaires, gestion, stratégie et communication assistés par intelligence artificielle.</li>
        <li><strong>Classe 41 :</strong> Formation, éducation, apprentissage numérique et accompagnement personnalisé liés aux technologies d’intelligence artificielle.</li>
        <li><strong>Classe 42 :</strong> Recherche, conception et développement de solutions et technologies d’intelligence artificielle.</li>
        <li><strong>Classe 45 :</strong> Services juridiques, conformité, éthique et régulation liés à l’intelligence artificielle.</li>
      </ul>
    ),
    legalNote:
      "Référence légale : Classification de Nice, 8ᵉ édition, fondée sur l’Arrangement de Nice du 15 juin 1957 et ses révisions de Stockholm (1967) et Genève (1977).",
  },
  en: {
    title: "🏛️ OneBoarding AI® — Registered Trademark (OMPIC #291822)",
    intro:
      "OneBoarding AI® is a registered trademark in the Kingdom of Morocco with OMPIC (Filing Receipt No. 291822, dated 13 October 2025, CCIS El Jadida).",
    holder: (
      <>
        <strong>Maître Benmehdi Mohamed Rida</strong><br />
        Attorney at the Casablanca Bar<br />
        Doctor of Law | MBA (EILM – Dublin)<br />
        Founder of <strong>OneBoarding AI®</strong>
      </>
    ),
    classes: (
      <ul>
        <li><strong>Class 9:</strong> AI software and applications; computer programs; digital platforms and data-processing systems.</li>
        <li><strong>Class 35:</strong> Business, management, strategy and communication consulting services assisted by AI.</li>
        <li><strong>Class 41:</strong> Training, education, e-learning and tailored coaching related to AI technologies.</li>
        <li><strong>Class 42:</strong> Research, design and development of AI solutions and technologies.</li>
        <li><strong>Class 45:</strong> Legal services, compliance, ethics and regulation related to AI.</li>
      </ul>
    ),
    legalNote:
      "Legal reference: Nice Classification, 8th edition, based on the Nice Agreement of 15 June 1957 and later revisions (Stockholm 1967; Geneva 1977).",
  },
  ar: {
    title: "🏛️ ®OneBoarding AI — علامة مسجلة (OMPIC #291822)",
    intro:
      "®OneBoarding AI علامة مسجلة بالمملكة المغربية لدى OMPIC (إيصال الإيداع رقم 291822 بتاريخ 13 أكتوبر 2025، CCIS الجديدة).",
    holder: (
      <>
        <strong>الأستاذ بنمهدي محمد رضى</strong><br />
        محامٍ بهيئة الدار البيضاء<br />
        دكتور في القانون | ماستر إدارة الأعمال (EILM – دبلن)<br />
        مؤسس <strong>®OneBoarding AI</strong>
      </>
    ),
    classes: (
      <ul dir="rtl">
        <li><strong>الفئة 9:</strong> برمجيات وتطبيقات الذكاء الاصطناعي؛ برامج حاسوبية؛ منصات رقمية وأنظمة معالجة البيانات.</li>
        <li><strong>الفئة 35:</strong> خدمات الاستشارة في الأعمال والإدارة والاستراتيجية والاتصال بمساعدة الذكاء الاصطناعي.</li>
        <li><strong>الفئة 41:</strong> التدريب والتعليم والتعلّم الرقمي والمرافقة الشخصية المتعلقة بتقنيات الذكاء الاصطناعي.</li>
        <li><strong>الفئة 42:</strong> البحث والتصميم والتطوير لحلول وتقنيات الذكاء الاصطناعي.</li>
        <li><strong>الفئة 45:</strong> خدمات قانونية والامتثال والأخلاقيات والتنظيم المتعلقة بالذكاء الاصطناعي.</li>
      </ul>
    ),
    legalNote:
      "مرجع قانوني: تصنيف نيس — الاتفاقية المؤرخة في 15 يونيو 1957 وتعديلات ستوكهولم (1967) وجنيف (1977).",
  },
} as const;

function LanguageSwitcher({
  value,
  onChange,
}: {
  value: keyof typeof content;
  onChange: (v: keyof typeof content) => void;
}) {
  const langs: Array<[keyof typeof content, string]> = [
    ["fr", "FR"],
    ["en", "EN"],
    ["ar", "AR"],
  ];
  return (
    <div className="flex gap-2 justify-center my-6">
      {langs.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`px-4 py-2 rounded-xl border text-sm ${
            value === k ? "bg-black text-white" : "bg-white"
          }`}
          aria-pressed={value === k}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function TrademarkPage() {
  // simple client-side language switch (FR default)
  const [lang, setLang] = useState<keyof typeof content>("fr");
  const t = content[lang];

  return (
    <main className="px-4 py-8">
      <Script
        id="org-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-2xl md:text-3xl font-bold text-center">{t.title}</h1>

      <LanguageSwitcher value={lang} onChange={setLang} />

      <Section title={lang === "ar" ? "بيان تمهيدي" : lang === "en" ? "Official notice" : "Notice officielle"}>
        <p className={lang === "ar" ? "text-right" : ""}>{t.intro}</p>
      </Section>

      <Section title={lang === "ar" ? "صاحب العلامة" : lang === "en" ? "Registrant" : "Titulaire"}>
        <p className={lang === "ar" ? "text-right" : ""}>{t.holder}</p>
      </Section>

      <Section
        title={
          lang === "ar"
            ? "النطاق القانوني (تصنيف نيس)"
            : lang === "en"
            ? "Legal scope (Nice Classification)"
            : "Mention légale & domaines (Classification de Nice)"
        }
      >
        <div className={lang === "ar" ? "text-right" : ""}>{t.classes}</div>
        <p className={`mt-3 text-sm opacity-80 ${lang === "ar" ? "text-right" : ""}`}>{t.legalNote}</p>
      </Section>

      <Signature />

      <div className="max-w-3xl mx-auto my-10 flex justify-center">
        <Link
          href="/"
          className="px-5 py-3 rounded-2xl border shadow-sm hover:shadow transition"
        >
          ⬅️ Retour
        </Link>
      </div>
    </main>
  );
    }
