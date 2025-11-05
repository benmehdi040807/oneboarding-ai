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
  founder: {
    "@type": "Person",
    name: "Benmehdi Mohamed Rida",
    jobTitle: "Attorney; Founder of OneBoarding AI",
    url: "https://www.officebenmehdi.com",
    sameAs: [
      "https://www.officebenmehdi.com",
      "https://linkedin.com/in/benmehdi-rida",
      "https://facebook.com/rida.benmehdi",
      "https://oneboardingai.com",
    ],
    worksFor: {
      "@type": "Organization",
      name: "Office Benmehdi",
      url: "https://www.officebenmehdi.com",
    },
  },
  brand: {
    "@type": "Brand",
    name: "OneBoarding AI®",
    logo: "https://oneboardingai.com/brand/oneboardingai-logo.png",
    isFamilyFriendly: true,
    founder: {
      "@type": "Person",
      name: "Benmehdi Mohamed Rida",
      url: "https://www.officebenmehdi.com",
    },
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
          Objet de la marque déposée <strong>OneBoarding AI®</strong>
          <br />
          Selon la Classification internationale de Nice :
        </em>
      </p>

      <br />

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

      <br />

      <p className="text-sm">
        <em>
          Référence légale : Classification de Nice, 8ᵉ édition, fondée sur
          l’Arrangement de Nice du 15 juin 1957 et ses révisions de Stockholm
          (1967) et Genève (1977).
        </em>
      </p>

      {/* ——— Bloc Origine & Créateur (biographie intégrée) ——— */}
      <hr />
      <h3>🏛️ Origine & Créateur</h3>
      <p>
        <strong>OneBoarding AI</strong> est imaginé, conçu et fondé par{" "}
        <strong>Benmehdi Mohamed Rida</strong> — Avocat au Barreau de
        Casablanca, Docteur en droit, MBA (EILM – Dublin), Fondateur de
        l’Office Benmehdi (<a href="https://www.officebenmehdi.com" target="_blank" rel="noreferrer">officebenmehdi.com</a>).
      </p>

      <h4 className="mt-3">📚 Parcours académique & distinctions</h4>
      <ul className="list-disc pl-5">
        <li>
          <strong>2025 — MBA</strong> (EILM, Dublin – CPD) + Program Certificate
          et certifications (Management, Marketing, Economics, Strategy, Finance, HR).
        </li>
        <li>
          <strong>2021 — Doctorat en droit privé</strong> (UCAM, FSJES Marrakech) — Mention Très Honorable.
          Thèse : « La résiliation du bail commercial en droit marocain et français ».
        </li>
        <li>
          <strong>2013 — Master</strong> Droit Immobilier &amp; Notarial (Mention Très bien – Major) ;{" "}
          <strong>2010 — Licence</strong> Droit privé (Mention Très bien – Major).
        </li>
        <li>Prix d’éloquence — ELSA, Palais de Justice de Bruxelles (10 fév. 2005).</li>
      </ul>

      <h4 className="mt-3">⚖️ Parcours professionnel</h4>
      <ul className="list-disc pl-5">
        <li>
          <strong>Avocat</strong> (depuis 2022) — Barreau de Casablanca ; Fondateur de l’Office Benmehdi.
        </li>
        <li>Ancien Substitut du Procureur du Roi (Marrakech ; El Kelaâ des Sraghna).</li>
        <li>Enseignant vacataire (UCAM) ; responsabilités éditoriales et associatives.</li>
      </ul>

      <h4 className="mt-3">📖 Publications & distinctions</h4>
      <ul className="list-disc pl-5">
        <li><em>Logique et Argumentation</em> (2025) — réflexion doctrinale.</li>
        <li>Thèse (2021) — Bail commercial (droit marocain & français).</li>
        <li>Articles (2018, 2014) — MARC ; procédures collectives & bail commercial.</li>
        <li>Taekwondo (Kukkiwon) : ceinture noire 4<sup>e</sup> Dan.</li>
      </ul>

      <h4 className="mt-3">🌐 Présence en ligne</h4>
      <ul className="list-disc pl-5">
        <li>
          Site :{" "}
          <a href="https://www.officebenmehdi.com" target="_blank" rel="noreferrer">
            officebenmehdi.com
          </a>
        </li>
        <li>
          LinkedIn :{" "}
          <a href="https://linkedin.com/in/benmehdi-rida" target="_blank" rel="noreferrer">
            linkedin.com/in/benmehdi-rida
          </a>
        </li>
        <li>
          Facebook :{" "}
          <a href="https://facebook.com/rida.benmehdi" target="_blank" rel="noreferrer">
            facebook.com/rida.benmehdi
          </a>
        </li>
      </ul>

      <h4 className="mt-3">🧭 Œuvre & Vision</h4>
      <p>
        <strong>OneBoarding AI</strong> incarne la rencontre entre droit, logique et technologie :
        Droit d’Accès Intelligent (3 interactions gratuites/jour), Consent Pairing Protocol (unicité
        du lien utilisateur-IA), BULP-DC™ (protocole légal unifié du consentement numérique).
        Perspective 2025–2030 : universalité, traçabilité, confiance.
      </p>
      {/* ——— Fin bloc Créateur ——— */}

      <Signature />

      {/* Bloc de pied conforme */}
      <p className="mt-8 text-sm">
        2025 © — OneBoarding AI® | Tous droits réservés.
      </p>

      <p className="text-xs text-neutral-500 mt-4">
        (Version : Octobre 2025 · Mainteneur : Maître Benmehdi Mohamed Rida —
        office.benmehdi@gmail.com · Domaine : Intelligence artificielle, droit,
        technologie, innovation. · Site : https://oneboardingai.com ·
        Pages légales :{" "}
        <a
          href="https://oneboardingai.com/legal"
          target="_blank"
          rel="noopener noreferrer"
        >
          /legal
        </a>{" "}
        —{" "}
        <a
          href="https://oneboardingai.com/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          /terms
        </a>{" "}
        —{" "}
        <a
          href="https://oneboardingai.com/delete"
          target="_blank"
          rel="noopener noreferrer"
        >
          /delete
        </a>{" "}
        —{" "}
        <a
          href="https://oneboardingai.com/protocol"
          target="_blank"
          rel="noopener noreferrer"
        >
          /protocol
        </a>{" "}
        —{" "}
        <a
          href="https://oneboardingai.com/trademark"
          target="_blank"
          rel="noopener noreferrer"
        >
          /trademark
        </a>
        )
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
        <strong>13 October 2025</strong>, filed at{" "}
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
          Purpose of the registered trademark <strong>OneBoarding AI®</strong>
          <br />
          under the International Nice Classification :
        </em>
      </p>

      <br />

      <p>
        • <strong>Class 9 :</strong> AI software and applications; computer
        programs; digital platforms and data-processing systems.
      </p>
      <p>
        • <strong>Class 35 :</strong> Business, management, strategy and
        communication consulting services assisted by AI.
      </p>
      <p>
        • <strong>Class 41 :</strong> Training, education, e-learning and
        personalized coaching related to AI technologies.
      </p>
      <p>
        • <strong>Class 42 :</strong> Research, design and development of AI
        solutions and technologies.
      </p>
      <p>
        • <strong>Class 45 :</strong> Legal services, compliance, ethics and
        regulation related to AI.
      </p>

      <br />

      <p className="text-sm">
        <em>
          Legal reference: Nice Classification, 8th edition, based on the Nice
          Agreement of 15 June 1957 and its revisions (Stockholm 1967; Geneva
          1977).
        </em>
      </p>

      {/* ——— Creator block (bio) ——— */}
      <hr />
      <h3>🏛️ Origin & Creator</h3>
      <p>
        <strong>OneBoarding AI</strong> was conceived, designed and founded by{" "}
        <strong>Benmehdi Mohamed Rida</strong> — Attorney (Casablanca Bar), Doctor of Law,
        MBA (EILM – Dublin), Founder of Office Benmehdi (
        <a href="https://www.officebenmehdi.com" target="_blank" rel="noreferrer">
          officebenmehdi.com
        </a>
        ).
      </p>

      <h4 className="mt-3">📚 Academic background & distinctions</h4>
      <ul className="list-disc pl-5">
        <li>
          <strong>2025 — MBA</strong> (EILM, Dublin – CPD) + Program Certificate and
          certifications (Management, Marketing, Economics, Strategy, Finance, HR).
        </li>
        <li>
          <strong>2021 — PhD in Private Law</strong> (UCAM, Marrakech) — Highest honors.
          Thesis: “Termination of the Commercial Lease in Moroccan and French Law”.
        </li>
        <li>
          <strong>2013 — Master</strong> in Real Estate & Notarial Law (Valedictorian);
          <strong> 2010 — Bachelor</strong> in Private Law (Valedictorian).
        </li>
        <li>Eloquence Prize — ELSA, Brussels Palace of Justice (Feb 10, 2005).</li>
      </ul>

      <h4 className="mt-3">⚖️ Professional journey</h4>
      <ul className="list-disc pl-5">
        <li>
          <strong>Attorney</strong> (since 2022) — Casablanca Bar; Founder of Office Benmehdi.
        </li>
        <li>Former Deputy Public Prosecutor (Marrakech; El Kelaâ des Sraghna).</li>
        <li>Adjunct Law Lecturer (UCAM); editorial & association roles.</li>
      </ul>

      <h4 className="mt-3">📖 Publications & honors</h4>
      <ul className="list-disc pl-5">
        <li><em>Logic & Argumentation</em> (2025) — doctrinal essay.</li>
        <li>PhD thesis (2021) — Commercial lease (Moroccan & French law).</li>
        <li>Articles (2018, 2014) — ADR/MARC; insolvency procedures & commercial lease.</li>
        <li>Taekwondo (Kukkiwon): black belt 4<sup>th</sup> Dan.</li>
      </ul>

      <h4 className="mt-3">🌐 Online presence</h4>
      <ul className="list-disc pl-5">
        <li>
          Website:{" "}
          <a href="https://www.officebenmehdi.com" target="_blank" rel="noreferrer">
            officebenmehdi.com
          </a>
        </li>
        <li>
          LinkedIn:{" "}
          <a href="https://linkedin.com/in/benmehdi-rida" target="_blank" rel="noreferrer">
            linkedin.com/in/benmehdi-rida
          </a>
        </li>
        <li>
          Facebook:{" "}
          <a href="https://facebook.com/rida.benmehdi" target="_blank" rel="noreferrer">
            facebook.com/rida.benmehdi
          </a>
        </li>
      </ul>

      <h4 className="mt-3">🧭 Work & Vision</h4>
      <p>
        <strong>OneBoarding AI</strong> embodies the union of law, logic and technology:
        Intelligent Access Right (3 free interactions/day), Consent Pairing Protocol (unique
        user–AI link), and BULP-DC™. 2025–2030 outlook: universality, traceability, trust.
      </p>
      {/* ——— End creator block ——— */}

      <Signature />

      <p className="mt-8 text-sm">
        © 2025 — OneBoarding AI® | All rights reserved.
      </p>

      <p className="text-xs text-neutral-500 mt-4">
        (Version: October 2025 · Maintainer: Maître Benmehdi Mohamed Rida —
        office.benmehdi@gmail.com · Domain: Artificial intelligence, law,
        technology, innovation. · Site: https://oneboardingai.com · Legal pages:{" "}
        <a href="https://oneboardingai.com/legal" target="_blank">
          /legal
        </a>{" "}
        —{" "}
        <a href="https://oneboardingai.com/terms" target="_blank">
          /terms
        </a>{" "}
        —{" "}
        <a href="https://oneboardingai.com/delete" target="_blank">
          /delete
        </a>{" "}
        —{" "}
        <a href="https://oneboardingai.com/protocol" target="_blank">
          /protocol
        </a>{" "}
        —{" "}
        <a href="https://oneboardingai.com/trademark" target="_blank">
          /trademark
        </a>
        )
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
        <em>
          موضوع العلامة التجارية المسجلة <strong>®OneBoarding AI</strong>
          <br />
          وفق تصنيف نيس الدولي :
        </em>
      </p>

      <br />

      <p>
        • <strong>الفئة 9 :</strong> برمجيات وتطبيقات الذكاء الاصطناعي؛ برامج
        حاسوبية؛ منصات رقمية وأنظمة معالجة البيانات.
      </p>
      <p>
        • <strong>الفئة 35 :</strong> خدمات الاستشارة في الأعمال والإدارة
        والاستراتيجية والاتصال بمساعدة الذكاء الاصطناعي.
      </p>
      <p>
        • <strong>الفئة 41 :</strong> التدريب والتعليم والتعلم الرقمي
        والمرافقة الشخصية المتعلقة بتقنيات الذكاء الاصطناعي.
      </p>
      <p>
        • <strong>الفئة 42 :</strong> البحث والتصميم والتطوير لحلول وتقنيات
        الذكاء الاصطناعي.
      </p>
      <p>
        • <strong>الفئة 45 :</strong> الخدمات القانونية والامتثال والأخلاقيات
        والتنظيم المتعلقة بالذكاء الاصطناعي.
      </p>

      <br />

      <p className="text-sm">
        <em>
          مرجع قانوني : تصنيف نيس — الاتفاقية المؤرخة في 15 يونيو 1957
          وتعديلات ستوكهولم (1967) وجنيف (1977).
        </em>
      </p>

      {/* ——— منشأ العلامة والمُبدِع (سيرة مختصرة) ——— */}
      <hr />
      <h3>🏛️ النشأة والمُبدِع</h3>
      <p>
        أُبدِعت <strong>OneBoarding AI</strong> وصُمِّمت وأُسِّست على يد{" "}
        <strong>بنمهدي محمد رضى</strong> — محامٍ بهيئة الدار البيضاء، دكتور
        في القانون، ماجستير إدارة أعمال (EILM – دبلن)، ومؤسس مكتب بنمهدي (
        <a href="https://www.officebenmehdi.com" target="_blank" rel="noreferrer">
          officebenmehdi.com
        </a>
        ).
      </p>

      <h4 className="mt-3">📚 المسار الأكاديمي والتميّز</h4>
      <ul className="list-disc pr-5">
        <li>
          <strong>2025 — MBA</strong> (EILM، دبلن — CPD) + شهادات برنامجية (إدارة، تسويق،
          اقتصاد، إستراتيجية، مالية، موارد بشرية).
        </li>
        <li>
          <strong>2021 — دكتوراه في القانون الخاص</strong> (UCAM، مراكش) — بامتياز.
          عنوان الأطروحة: فسخ الكراء التجاري في القانون المغربي والفرنسي.
        </li>
        <li>
          <strong>2013 — ماستر</strong> (العقار والتوثيق — الأول على الفوج)؛{" "}
          <strong>2010 — إجازة</strong> في القانون الخاص (الأول على الفوج).
        </li>
        <li>جائزة البلاغة — ELSA، قصر العدل ببروكسيل (10 فبراير 2005).</li>
      </ul>

      <h4 className="mt-3">⚖️ المسار المهني</h4>
      <ul className="list-disc pr-5">
        <li>
          <strong>محامٍ</strong> منذ 2022 — هيئة الدار البيضاء؛ مؤسس مكتب بنمهدي.
        </li>
        <li>نائب وكيل الملك سابقًا (مراكش؛ قلعة السراغنة).</li>
        <li>مُدرّس قانون (UCAM)؛ أدوار تحريرية وجمعوية.</li>
      </ul>

      <h4 className="mt-3">📖 منشورات وتكريمات</h4>
      <ul className="list-disc pr-5">
        <li><em>المنطق والحجاج</em> (2025) — نصّ فكري.</li>
        <li>أطروحة دكتوراه (2021) — الكراء التجاري (المغربي والفرنسي).</li>
        <li>مقالات (2018، 2014) — الوسائل البديلة؛ الإجراءات الجماعية والكراء التجاري.</li>
        <li>تايكواندو (Kukkiwon): حزام أسود دان 4.</li>
      </ul>

      <h4 className="mt-3">🌐 الحضور الرقمي</h4>
      <ul className="list-disc pr-5">
        <li>
          الموقع:{" "}
          <a href="https://www.officebenmehdi.com" target="_blank" rel="noreferrer">
            officebenmehdi.com
          </a>
        </li>
        <li>
          لينكدإن:{" "}
          <a href="https://linkedin.com/in/benmehdi-rida" target="_blank" rel="noreferrer">
            linkedin.com/in/benmehdi-rida
          </a>
        </li>
        <li>
          فيسبوك:{" "}
          <a href="https://facebook.com/rida.benmehdi" target="_blank" rel="noreferrer">
            facebook.com/rida.benmehdi
          </a>
        </li>
      </ul>

      <h4 className="mt-3">🧭 الرؤية</h4>
      <p>
        تُجسّد <strong>OneBoarding AI</strong> التلاقي بين القانون والمنطق والتكنولوجيا:
        حقّ الوصول الذكي (3 تفاعلات مجانية/يوم)، بروتوكول الاقتران بالموافقة (رابط فريد
        بين المستخدم وذكائه الشخصي)، وBULP-DC™. رؤية 2025–2030: شمولية وتتبع وثقة.
      </p>
      {/* ——— نهاية كتلة السيرة ——— */}

      <Signature rtl />

      <p className="mt-8 text-sm">
        © 2025 — ®OneBoarding AI | جميع الحقوق محفوظة.
      </p>

      <p className="text-xs text-neutral-500 mt-4">
        (الإصدار: أكتوبر 2025 · الصيانة: الأستاذ بنمهدي محمد رضى —
        office.benmehdi@gmail.com · المجال: الذكاء الاصطناعي، القانون،
        التكنولوجيا، الابتكار. · الموقع: https://oneboardingai.com · الصفحات
        القانونية:{" "}
        <a href="https://oneboardingai.com/legal" target="_blank">
          /legal
        </a>{" "}
        —{" "}
        <a href="https://oneboardingai.com/terms" target="_blank">
          /terms
        </a>{" "}
        —{" "}
        <a href="https://oneboardingai.com/delete" target="_blank">
          /delete
        </a>{" "}
        —{" "}
        <a href="https://oneboardingai.com/protocol" target="_blank">
          /protocol
        </a>{" "}
        —{" "}
        <a href="https://oneboardingai.com/trademark" target="_blank">
          /trademark
        </a>
        )
      </p>
    </article>
  ),
} as const;
