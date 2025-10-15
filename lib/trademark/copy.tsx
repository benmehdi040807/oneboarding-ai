// lib/trademark/copy.tsx
import type { ReactNode } from "react";

export const TRADEMARK_META = {
  title: "OneBoarding AI® — Marque déposée (OMPIC #291822)",
  description:
    "OneBoarding AI® est une marque déposée auprès de l’OMPIC (Royaume du Maroc). Notice officielle trilingue (FR/EN/AR), classes de Nice et mentions légales.",
  canonical: "https://oneboardingai.com/trademark",
  ogImage: "https://oneboardingai.com/brand/oneboardingai-logo.png",
};

export const JSON_LD = {
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
    name: "OneBoarding AI®",
    logo: "https://oneboardingai.com/brand/oneboardingai-logo.png",
    isFamilyFriendly: true,
  },
};

export function Signature({ rtl = false }: { rtl?: boolean }) {
  return (
    <div className={`mt-8 border-t pt-4 ${rtl ? "text-right" : ""}`}>
      <h3>✒️ Signature officielle</h3>
      <p>
        <strong>Maître Benmehdi Mohamed Rida</strong>
        <br />
        Avocat au Barreau de Casablanca
        <br />
        Docteur en droit | MBA (EILM – Dublin)
        <br />
        Fondateur de <strong>OneBoarding AI®</strong>
      </p>
      <p className="text-sm mt-2">
        📱 WhatsApp : +212 6 61 14 00 25<br />
        ✉️ Email : office.benmehdi@gmail.com<br />
        🌐 https://oneboardingai.com<br />
        🔗 https://linkedin.com/in/benmehdi-rida<br />
        🔗 https://facebook.com/rida.benmehdi
      </p>
    </div>
  );
}

export const COPY = {
  fr: (
    <article className="prose prose-neutral max-w-none">
      <h2>🇫🇷 FR — Notice officielle</h2>
      <p>
        <strong>OneBoarding AI®</strong> est une marque déposée au{" "}
        <strong>Royaume du Maroc</strong> auprès de l’<strong>OMPIC</strong>{" "}
        (Récépissé n° <strong>291822</strong>, du{" "}
        <strong>13 octobre 2025</strong>, CCIS El Jadida), enregistrée par :
      </p>
      <p>
        <strong>Maître Benmehdi Mohamed Rida</strong>
        <br />
        Avocat au Barreau de Casablanca
        <br />
        Docteur en droit | MBA (EILM – Dublin)
        <br />
        Fondateur de <strong>OneBoarding AI®</strong>
      </p>
      <h3>📜 Mention légale & domaines (Classification de Nice)</h3>
      <ul>
        <li><strong>Classe 9 :</strong> Logiciels et applications d’intelligence artificielle.</li>
        <li><strong>Classe 35 :</strong> Conseil, gestion et communication assistés par IA.</li>
        <li><strong>Classe 41 :</strong> Formation et apprentissage liés à l’IA.</li>
        <li><strong>Classe 42 :</strong> Recherche et développement de solutions d’IA.</li>
        <li><strong>Classe 45 :</strong> Services juridiques, conformité et éthique IA.</li>
      </ul>
      <Signature />
    </article>
  ),

  en: (
    <article className="prose prose-neutral max-w-none">
      <h2>🇬🇧 EN — Official notice</h2>
      <p>
        <strong>OneBoarding AI®</strong> is a registered trademark in the{" "}
        <strong>Kingdom of Morocco</strong> with <strong>OMPIC</strong> (Filing
        No. <strong>291822</strong>, dated <strong>13 October 2025</strong>,
        filed at CCIS El Jadida), registered by:
      </p>
      <p>
        <strong>Maître Benmehdi Mohamed Rida</strong>
        <br />
        Attorney at the Casablanca Bar
        <br />
        Doctor of Law | MBA (EILM – Dublin)
        <br />
        Founder of <strong>OneBoarding AI®</strong>
      </p>
      <h3>📜 Legal scope (Nice Classification)</h3>
      <ul>
        <li><strong>Class 9:</strong> AI software and applications.</li>
        <li><strong>Class 35:</strong> Business and strategy consulting assisted by AI.</li>
        <li><strong>Class 41:</strong> Education and digital learning in AI.</li>
        <li><strong>Class 42:</strong> Research and development of AI technologies.</li>
        <li><strong>Class 45:</strong> Legal, compliance and ethics services in AI.</li>
      </ul>
      <Signature />
    </article>
  ),

  ar: (
    <article dir="rtl" className="prose prose-neutral max-w-none">
      <h2>🇲🇦 إشعار رسمي</h2>
      <p>
        <strong>®OneBoarding AI</strong> علامة مسجلة بالمملكة المغربية لدى{" "}
        <strong>OMPIC</strong> (إيصال رقم <strong>291822</strong>{" "}
        بتاريخ <strong>13 أكتوبر 2025</strong>، لدى غرفة التجارة والصناعة
        والخدمات بالجديدة)، مسجلة باسم:
      </p>
      <p>
        <strong>الأستاذ بنمهدي محمد رضى</strong>
        <br />
        محامٍ بهيئة الدار البيضاء
        <br />
        دكتور في القانون | ماستر إدارة الأعمال (EILM – دبلن)
        <br />
        مؤسس <strong>®OneBoarding AI</strong>
      </p>
      <h3>📜 النطاق القانوني (تصنيف نيس)</h3>
      <ul>
        <li><strong>الفئة 9:</strong> برمجيات وتطبيقات الذكاء الاصطناعي.</li>
        <li><strong>الفئة 35:</strong> خدمات الاستشارة في الأعمال والإدارة.</li>
        <li><strong>الفئة 41:</strong> التعليم والتدريب في مجال الذكاء الاصطناعي.</li>
        <li><strong>الفئة 42:</strong> البحث والتطوير في تقنيات الذكاء الاصطناعي.</li>
        <li><strong>الفئة 45:</strong> الخدمات القانونية والأخلاقية المتعلقة بالذكاء الاصطناعي.</li>
      </ul>
      <Signature rtl />
    </article>
  ),
};
