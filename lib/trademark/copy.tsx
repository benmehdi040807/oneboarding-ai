// lib/trademark/copy.tsx
import type { ReactNode } from "react";

/** JSON-LD (Organization + Brand) */
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
} as const;

/** Signature commune (FR/EN) ; rtl pour AR */
export function Signature({ rtl = false }: { rtl?: boolean }) {
  return (
    <div className={`mt-10 border-t pt-5 ${rtl ? "text-right" : ""}`}>
      <h3 className="mb-2">✒️ Signature officielle</h3>
      <p>
        <strong>Maître Benmehdi Mohamed Rida</strong>
        <br />
        Avocat au Barreau de Casablanca
        <br />
        Docteur en droit | MBA (EILM – Dublin)
        <br />
        Fondateur de <strong>OneBoarding AI®</strong>
      </p>
      <p className="text-sm mt-3 leading-6">
        📱 WhatsApp : +212 6 61 14 00 25
        <br />
        ✉️ Email : office.benmehdi@gmail.com
        <br />
        🌐 https://oneboardingai.com
        <br />
        🔗 https://linkedin.com/in/benmehdi-rida
        <br />
        🔗 https://facebook.com/rida.benmehdi
      </p>
    </div>
  );
}

/** Contenu trilingue */
export const COPY = {
  fr: (
    <article className="prose prose-neutral max-w-none" lang="fr" dir="ltr">
      <h2>🇫🇷 FR — Notice officielle</h2>

      <p>
        <strong>OneBoarding AI®</strong> est une marque déposée au{" "}
        <strong>Royaume du Maroc</strong> auprès de l’<strong>OMPIC</strong>.
        Récépissé de dépôt n° <strong>291822</strong>, en date du{" "}
        <strong>13 octobre 2025</strong>, déposé au{" "}
        <strong>CCIS El Jadida</strong>.
      </p>

      <br />
      <br />

      <p>
        <strong>Enregistrée par :</strong>
        <br />
        Maître Benmehdi Mohamed Rida
        <br />
        Avocat au Barreau de Casablanca
        <br />
        Docteur en droit | MBA (EILM – Dublin)
        <br />
        Fondateur de <strong>OneBoarding AI®</strong>
      </p>

      <br />

      <h3>📜 Mention légale &amp; Classification</h3>

      <p>
        <em>
          Objet de la marque déposée <strong>OneBoarding AI®</strong> selon la
          Classification internationale de Nice :
        </em>
      </p>

      <p>
        • <strong>Classe 9 :</strong> Logiciels et applications d’intelligence
        artificielle ; programmes informatiques ; plateformes numériques et
        systèmes de traitement de données.
      </p>
      <p>
        • <strong>Classe 35 :</strong> Services de conseil en affaires, gestion,
        stratégie et communication assistés par intelligence artificielle.
      </p>
      <p>
        • <strong>Classe 41 :</strong> Formation, éducation, apprentissage
        numérique et accompagnement personnalisé liés aux technologies
        d’intelligence artificielle.
      </p>
      <p>
        • <strong>Classe 42 :</strong> Recherche, conception et développement de
        solutions et technologies d’intelligence artificielle.
      </p>
      <p>
        • <strong>Classe 45 :</strong> Services juridiques, conformité, éthique
        et régulation liés à l’intelligence artificielle.
      </p>

      <p className="text-sm">
        <em>
          Référence légale : Classification de Nice, 8ᵉ édition, fondée sur
          l’Arrangement de Nice du 15 juin 1957 et ses révisions de Stockholm (1967) et Genève (1977).
        </em>
      </p>

      <Signature />

      {/* Bloc de pied conforme */}
      <p className="mt-8 text-sm">
        2025 © — OneBoarding AI® | Tous droits réservés.
      </p>

      <p className="text-xs text-neutral-500 mt-4">
        (Version : Octobre 2025 · Mainteneur : Maître Benmehdi Mohamed Rida — 
        office.benmehdi@gmail.com · Domaine : Intelligence artificielle, droit, technologie, innovation. · Site : https://oneboardingai.com)
      </p>
    </article>
  ),

  en: (
    <article className="prose prose-neutral max-w-none" lang="en" dir="ltr">
      <h2>🇬🇧 EN — Official notice (informative translation)</h2>

      <p>
        <strong>OneBoarding AI®</strong> is a registered trademark in the{" "}
        <strong>Kingdom of Morocco</strong> with <strong>OMPIC</strong>.
        Filing receipt No. <strong>291822</strong>, dated{" "}
        <strong>13 October 2025</strong>, filed at 
        <strong>CCIS El Jadida</strong>.
      </p>

      <br />
      <br />

      <p>
        <strong>Registered by :</strong>
        <br />
        Maître Benmehdi Mohamed Rida
        <br />
        Attorney at the Casablanca Bar
        <br />
        Doctor of Law | MBA (EILM – Dublin)
        <br />
        Founder of <strong>OneBoarding AI®</strong>
      </p>

      <br />

      <h3>📜 Legal Notice & Classification</h3>

      <p>
        <em>
          Purpose of the registered trademark <strong>OneBoarding AI®</strong>{" "}
          under the International Nice Classification :
        </em>
      </p>

      <p>
        • <strong>Class 9 :</strong> AI software and applications; computer programs; digital platforms and data-processing systems.
      </p>
      <p>
        • <strong>Class 35 :</strong> Business, management, strategy and communication consulting services assisted by AI.
      </p>
      <p>
        • <strong>Class 41 :</strong> Training, education, e-learning and personalized coaching related to AI technologies.
      </p>
      <p>
        • <strong>Class 42 :</strong> Research, design and development of AI solutions and technologies.
      </p>
      <p>
        • <strong>Class 45 :</strong> Legal services, compliance, ethics and regulation related to AI.
      </p>

      <p className="text-sm">
        <em>
          Legal reference: Nice Classification, 8th edition, based on the Nice Agreement of 15 June 1957 and its revisions (Stockholm 1967; Geneva 1977).
        </em>
      </p>

      <Signature />

      <p className="mt-8 text-sm">
        © 2025 — OneBoarding AI® | All rights reserved.
      </p>
    </article>
  ),

  ar: (
    <article
      dir="rtl"
      lang="ar"
      className="prose prose-neutral max-w-none text-right"
    >
      <h2>🇲🇦 إشعار رسمي (ترجمة إعلامية)</h2>

      <p>
        <strong>®OneBoarding AI</strong> علامة مسجلة بالمملكة المغربية لدى{" "}
        <strong>OMPIC</strong>. إيصال الإيداع رقم{" "}
        <strong>291822</strong> بتاريخ <strong>13 أكتوبر 2025</strong>، لدى{" "}
        <strong>غرفة التجارة والصناعة والخدمات بالجديدة</strong>.
      </p>

      <br />
      <br />

      <p>
        <strong>مسجلة باسم :</strong>
        <br />
        الأستاذ بنمهدي محمد رضى
        <br />
        محامٍ بهيئة الدار البيضاء
        <br />
        دكتور في القانون | ماستر إدارة الأعمال (EILM – دبلن)
        <br />
        مؤسس <strong>®OneBoarding AI</strong>
      </p>

      <br />

      <h3>📜 الإشعار القانوني والتصنيف</h3>

      <p>
        <em>موضوع العلامة التجارية المسجلة وفق تصنيف نيس الدولي :</em>
      </p>

      <p>
        • <strong>الفئة 9 :</strong> برمجيات وتطبيقات الذكاء الاصطناعي؛ برامج حاسوبية؛ منصات رقمية وأنظمة معالجة البيانات.
      </p>
      <p>
        • <strong>الفئة 35 :</strong> خدمات الاستشارة في الأعمال والإدارة والاستراتيجية والاتصال بمساعدة الذكاء الاصطناعي.
      </p>
      <p>
        • <strong>الفئة 41 :</strong> التدريب والتعليم والتعلم الرقمي والمرافقة الشخصية المتعلقة بتقنيات الذكاء الاصطناعي.
      </p>
      <p>
        • <strong>الفئة 42 :</strong> البحث والتصميم والتطوير لحلول وتقنيات الذكاء الاصطناعي.
      </p>
      <p>
        • <strong>الفئة 45 :</strong> الخدمات القانونية والامتثال والأخلاقيات والتنظيم المتعلقة بالذكاء الاصطناعي.
      </p>

      <p className="text-sm">
        <em>
          مرجع قانوني : تصنيف نيس — الاتفاقية المؤرخة في 15 يونيو 1957 وتعديلات ستوكهولم (1967) وجنيف (1977).
        </em>
      </p>

      <Signature rtl />

      <p className="mt-8 text-sm">
        © 2025 — ®OneBoarding AI | جميع الحقوق محفوظة.
      </p>
    </article>
  ),
} as const;
