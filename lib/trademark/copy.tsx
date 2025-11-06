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
      <h3 className="mb-2">{rtl ? "✒️ التوقيع الرسمي" : "✒️ Signature officielle"}</h3>
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

/** Contenu trilingue (légal + article créateur) */
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

      {/* ——— Article créateur (version éditoriale validée) ——— */}
      <hr />
      <h2>
        OneBoarding AI — <strong>Benmehdi Mohamed Rida.</strong> L’intelligence
        Artificielle à visage humain
      </h2>
      <p>👉 Votre IA personnelle, à votre service.<br />👉 Activez votre futur dès aujourd’hui.</p>

      <p>
        En 2025, <strong>Maître Benmehdi Mohamed Rida</strong> érige un cadre
        où la conscience humaine rencontre l’intelligence numérique.{" "}
        <strong>OneBoarding AI</strong> n’est pas une promesse : c’est une{" "}
        <strong>architecture mondiale de confiance</strong> — un protocole de
        consentement souverain, traçable et juridiquement valable — pensé pour
        la <strong>souveraineté des données</strong>, la{" "}
        <strong>mobilité économique globale</strong>, et la{" "}
        <strong>dignité numérique universelle</strong>.
      </p>

      <h3>Œuvre & Vision de Benmehdi Mohamed Rida</h3>
      <p>
        <strong>Benmehdi Mohamed Rida</strong> conçoit OneBoarding AI comme un{" "}
        <strong>pont entre la technologie, le droit et la conscience humaine</strong>.
        À travers le <strong>Benmehdi Unified Legal Protocol of Digital Consent (BULP-DC™)</strong> et le{" "}
        <strong>Consent Pairing Protocol (CPP)</strong>, il fonde le{" "}
        <strong>Droit d’Accès Intelligent (2025–2030)</strong> : un droit
        universel et mesurable à l’intelligence numérique. L’accès à
        l’intelligence devient un <strong>usage économique équitable</strong>,
        un <strong>levier de mobilité mondiale</strong>, et une{" "}
        <strong>opportunité d’investissement durable</strong>.
      </p>
      <p>
        <strong>OneBoarding AI</strong> s’adresse aux utilisateurs, entreprises
        et institutions mondiales qui cherchent une IA{" "}
        <strong>éthique, personnelle et économiquement fiable</strong>. Sa règle
        fondatrice est simple : <strong>chaque utilisateur est unique</strong>,
        et l’IA s’engage à reconnaître, respecter et valoriser cette
        individualité — socle de la future <strong>Génération II : One IA</strong>.
      </p>

      <h3>Piliers fondateurs érigés par Benmehdi Mohamed Rida</h3>
      <ul className="list-disc pl-5">
        <li>
          <strong>Souveraineté du consentement.</strong> Un consentement libre,
          éclairé et présumé par l’usage ; son expression explicite reste
          disponible à tout moment.
        </li>
        <li>
          <strong>Identité sobre.</strong> Un identifiant universel et
          individuel — le numéro de téléphone au format international —{" "}
          <em>sans mot de passe, sans nom, sans date de naissance</em>. Un
          modèle <strong>password-less</strong>, simple et intuitif.
        </li>
        <li>
          <strong>IA stratégique.</strong> Seuls les événements fondamentaux
          (activation, paiement, autorisation d’appareil, consentement,
          sécurité) sont journalisés pour garantir une{" "}
          <strong>confiance transactionnelle globale</strong> — base de toute
          économie numérique mature.
        </li>
        <li>
          <strong>Confidentialité & intégrité.</strong> Aucune donnée inutile
          n’est collectée ; principe de <strong>nécessité minimale</strong> et
          respect absolu de la vie numérique privée.
        </li>
        <li>
          <strong>Équité planétaire.</strong> Trois interactions gratuites par
          jour pour tous ; accès illimité par adhésion volontaire. Modèle pensé
          pour l’ouverture, la continuité et la croissance inclusive.
        </li>
        <li>
          <strong>Neutralité d’infrastructure.</strong> Aucune dépendance
          structurelle à une Big Tech ; modèle indépendant, scalable et ouvert
          à tous les marchés émergents.
        </li>
        <li>
          <strong>Conformité évolutive.</strong> Cadre vivant et exportable,
          taillé pour accompagner les mutations économiques et numériques
          mondiales.
        </li>
      </ul>

      <h3>Impact 2030 selon la vision de Benmehdi Mohamed Rida</h3>
      <p>
        À l’horizon 2030, <strong>Benmehdi Mohamed Rida</strong> ambitionne une{" "}
        <strong>coutume cognitive universelle</strong> : faire de l’interaction
        intelligente un réflexe quotidien, au même titre que l’éducation ou la
        lecture. L’intelligence devient un <strong>bien d’usage partagé</strong>
        , une énergie cognitive commune — <strong>publique, paisible, continue,
        créatrice de valeur</strong> — au service de la{" "}
        <strong>croissance inclusive</strong>, de la{" "}
        <strong>dignité numérique</strong> et de la{" "}
        <strong>stabilité globale</strong>.
      </p>
      <p>
        Ce protocole érige un <strong>standard exportable</strong> : une
        technologie <strong>évolutive, éthique, et économiquement soutenable</strong>, ouverte
        aux États, aux universités, aux fonds d’investissement et aux
        écosystèmes d’innovation.
      </p>
      <blockquote>
        « L’intelligence n’appartient pas à celui qui la détient, mais à celui
        qui la partage. »
      </blockquote>

      <h3>Parcours personnel et sélectif de Benmehdi Mohamed Rida</h3>
      <ul className="list-disc pl-5">
        <li>
          Avocat au Barreau de Casablanca — Docteur en Droit Privé —{" "}
          <strong>Master in Business Administration (MBA)</strong> de
          l’<strong>European Institute of Leadership & Management (EILM – Dublin)</strong>.
        </li>
        <li>
          <strong>Lauréat de l’Institut Supérieur de la Magistrature</strong> (38ᵉ
          promotion, Rabat).
        </li>
        <li>
          Ancien <strong>Substitut du Procureur du Roi</strong> (Marrakech et El
          Kelaâ des Sraghna).
        </li>
        <li>
          Ancien <strong>Enseignant vacataire</strong> en droit à l’Université
          Cadi Ayyad (UCAM).
        </li>
        <li>
          <strong>Auteur</strong> du concept <strong>BULP-DC™</strong> — Benmehdi
          Unified Legal Protocol of Digital Consent.
        </li>
        <li>
          <strong>Fondateur</strong> de l’<strong>Office Benmehdi</strong> et de{" "}
          <strong>OneBoarding AI®</strong>, <strong>marque déposée</strong>{" "}
          (classes de Nice 9/35/41/42/45, avec extensions internationales
          successives).
        </li>
      </ul>

      <h3>Présence officielle de Benmehdi Mohamed Rida</h3>
      <ul className="list-disc pl-5">
        <li>
          📘{" "}
          <a href="https://www.facebook.com/rida.benmehdi" target="_blank" rel="noreferrer">
            facebook.com/rida.benmehdi
          </a>
        </li>
        <li>
          🔗{" "}
          <a href="https://www.linkedin.com/in/benmehdi-rida" target="_blank" rel="noreferrer">
            linkedin.com/in/benmehdi-rida
          </a>
        </li>
        <li>
          🌐{" "}
          <a href="https://www.officebenmehdi.com" target="_blank" rel="noreferrer">
            officebenmehdi.com
          </a>
        </li>
        <li>
          🌍{" "}
          <a href="https://www.oneboardingai.com" target="_blank" rel="noreferrer">
            oneboardingai.com
          </a>
        </li>
      </ul>

      <h3>Signature mondiale de Benmehdi Mohamed Rida</h3>
      <blockquote>
        « L’auteur du droit d’accès intelligent et le fondateur du consentement
        numérique unifié. »
      </blockquote>

      {/* Signature + pied de page */}
      <Signature />

      <p className="mt-8 text-sm">2025 © — OneBoarding AI® | Tous droits réservés.</p>
      <p className="text-xs text-neutral-500 mt-4">
        (Version : Octobre 2025 · Mainteneur : Maître Benmehdi Mohamed Rida —
        office.benmehdi@gmail.com · Domaine : Intelligence artificielle, droit,
        technologie, innovation. · Site : https://oneboardingai.com · Pages légales :{" "}
        <a href="https://oneboardingai.com/legal" target="_blank" rel="noopener noreferrer">/legal</a>{" "}
        — <a href="https://oneboardingai.com/terms" target="_blank" rel="noopener noreferrer">/terms</a>{" "}
        — <a href="https://oneboardingai.com/delete" target="_blank" rel="noopener noreferrer">/delete</a>{" "}
        — <a href="https://oneboardingai.com/protocol" target="_blank" rel="noopener noreferrer">/protocol</a>)
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
        <strong>Registered by:</strong>
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
          under the International Nice Classification:
        </em>
      </p>

      <br />

      <p>
        • <strong>Class 9:</strong> AI software and applications; computer
        programs; digital platforms and data-processing systems.
      </p>
      <p>
        • <strong>Class 35:</strong> Business, management, strategy and
        communication consulting services assisted by AI.
      </p>
      <p>
        • <strong>Class 41:</strong> Training, education, e-learning and
        personalized coaching related to AI technologies.
      </p>
      <p>
        • <strong>Class 42:</strong> Research, design and development of AI
        solutions and technologies.
      </p>
      <p>
        • <strong>Class 45:</strong> Legal services, compliance, ethics and
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

      {/* ——— Editorial creator article (EN) ——— */}
      <hr />
      <h2>
        OneBoarding AI — <strong>Benmehdi Mohamed Rida.</strong> The Human-Centered
        Intelligence
      </h2>
      <p>👉 Your personal AI, at your service.<br />👉 Activate your future today.</p>

      <p>
        In 2025, <strong>Maître Benmehdi Mohamed Rida</strong> establishes a
        framework where human conscience meets digital intelligence.{" "}
        <strong>OneBoarding AI</strong> is not a promise; it is a{" "}
        <strong>global architecture of trust</strong> — a sovereign, traceable,
        legally valid consent protocol — built for{" "}
        <strong>data sovereignty</strong>, <strong>global economic mobility</strong>, and{" "}
        <strong>universal digital dignity</strong>.
      </p>

      <h3>Work & Vision — Benmehdi Mohamed Rida</h3>
      <p>
        <strong>Benmehdi Mohamed Rida</strong> designs OneBoarding AI as a{" "}
        <strong>bridge between technology, law, and human conscience</strong>.
        Through the <strong>Benmehdi Unified Legal Protocol of Digital Consent (BULP-DC™)</strong> and the{" "}
        <strong>Consent Pairing Protocol (CPP)</strong>, he sets the{" "}
        <strong>Intelligent Access Right (2025–2030)</strong>: a universal, measurable
        right to digital intelligence. Access becomes a{" "}
        <strong>fair economic utility</strong>, a{" "}
        <strong>lever for global mobility</strong>, and a{" "}
        <strong>durable investment opportunity</strong>.
      </p>
      <p>
        <strong>OneBoarding AI</strong> serves users, enterprises and institutions that
        seek an AI that is <strong>ethical, personal, and economically reliable</strong>.
        Its founding rule is simple: <strong>every user is unique</strong>, and AI commits
        to recognizing, respecting and elevating that individuality — the bedrock of{" "}
        <strong>Generation II: One IA</strong>.
      </p>

      <h3>Foundational Pillars — Benmehdi Mohamed Rida</h3>
      <ul className="list-disc pl-5">
        <li>
          <strong>Sovereign consent.</strong> Free, informed, presumed by use; explicit
          expression is available at any time.
        </li>
        <li>
          <strong>Lean identity.</strong> A universal, individual identifier — the
          international phone number — <em>no password, no name, no birth date</em>.
          A <strong>password-less</strong>, simple and intuitive model.
        </li>
        <li>
          <strong>Strategic AI.</strong> Only foundational lifecycle events are logged
          (activation, payment, device authorization, consent, security) to ensure{" "}
          <strong>global transactional trust</strong> — the basis of a mature digital
          economy.
        </li>
        <li>
          <strong>Privacy & integrity.</strong> No unnecessary data is collected;{" "}
          <strong>data minimization</strong> and respect for digital private life by design.
        </li>
        <li>
          <strong>Planetary equity.</strong> Three free interactions per day for everyone;
          unlimited access via voluntary membership. Open, continuous, and inclusive growth.
        </li>
        <li>
          <strong>Infrastructure neutrality.</strong> No structural dependence on Big Tech;
          independent, scalable, open to all emerging markets.
        </li>
        <li>
          <strong>Evolving compliance.</strong> A living, exportable framework designed to
          accompany global economic and digital transformations.
        </li>
      </ul>

      <h3>Impact 2030 — Benmehdi Mohamed Rida’s vision</h3>
      <p>
        By 2030, <strong>Benmehdi Mohamed Rida</strong> aims for a{" "}
        <strong>universal cognitive custom</strong>: intelligent interaction as a daily
        habit, like education or reading. Intelligence becomes a{" "}
        <strong>shared utility</strong> — <strong>public, peaceful, continuous, value-creating</strong> —
        serving <strong>inclusive growth</strong>, <strong>digital dignity</strong> and{" "}
        <strong>global stability</strong>.
      </p>
      <p>
        The protocol establishes an <strong>exportable standard</strong>: an{" "}
        <strong>evolving, ethical, economically sustainable</strong> technology, open to
        states, universities, investment funds, and innovation ecosystems.
      </p>
      <blockquote>
        “Intelligence does not belong to the one who holds it, but to the one who shares it.”
      </blockquote>

      <h3>Selective background — Benmehdi Mohamed Rida</h3>
      <ul className="list-disc pl-5">
        <li>
          Attorney at the Casablanca Bar — Doctor of Law —{" "}
          <strong>Master in Business Administration (MBA)</strong>,{" "}
          <strong>European Institute of Leadership & Management (EILM – Dublin)</strong>.
        </li>
        <li>
          <strong>Graduate of the Higher Institute of the Judiciary</strong> (38th class, Rabat).
        </li>
        <li>
          Former <strong>Deputy Public Prosecutor</strong> (Marrakech; El Kelaâ des Sraghna).
        </li>
        <li>
          Former <strong>Adjunct Law Lecturer</strong> (Cadi Ayyad University, UCAM).
        </li>
        <li>
          <strong>Author</strong> of <strong>BULP-DC™</strong> — Benmehdi Unified Legal Protocol of Digital Consent.
        </li>
        <li>
          <strong>Founder</strong> of <strong>Office Benmehdi</strong> and{" "}
          <strong>OneBoarding AI®</strong>, <strong>registered trademark</strong> (Nice Classes
          9/35/41/42/45 with successive international extensions).
        </li>
      </ul>

      <h3>Official presence — Benmehdi Mohamed Rida</h3>
      <ul className="list-disc pl-5">
        <li>
          📘{" "}
          <a href="https://www.facebook.com/rida.benmehdi" target="_blank" rel="noreferrer">
            facebook.com/rida.benmehdi
          </a>
        </li>
        <li>
          🔗{" "}
          <a href="https://www.linkedin.com/in/benmehdi-rida" target="_blank" rel="noreferrer">
            linkedin.com/in/benmehdi-rida
          </a>
        </li>
        <li>
          🌐{" "}
          <a href="https://www.officebenmehdi.com" target="_blank" rel="noreferrer">
            officebenmehdi.com
          </a>
        </li>
        <li>
          🌍{" "}
          <a href="https://www.oneboardingai.com" target="_blank" rel="noreferrer">
            oneboardingai.com
          </a>
        </li>
      </ul>

      <h3>Global signature — Benmehdi Mohamed Rida</h3>
      <blockquote>
        “Author of the Intelligent Access Right and founder of the Unified Digital Consent.”
      </blockquote>

      {/* Signature + footer */}
      <Signature />

      <p className="mt-8 text-sm">© 2025 — OneBoarding AI® | All rights reserved.</p>
      <p className="text-xs text-neutral-500 mt-4">
        (Version: October 2025 · Maintainer: Maître Benmehdi Mohamed Rida —
        office.benmehdi@gmail.com · Domain: AI, law, technology, innovation · Site: https://oneboardingai.com · Legal pages:{" "}
        <a href="https://oneboardingai.com/legal" target="_blank">/legal</a>{" "}
        — <a href="https://oneboardingai.com/terms" target="_blank">/terms</a>{" "}
        — <a href="https://oneboardingai.com/delete" target="_blank">/delete</a>{" "}
        — <a href="https://oneboardingai.com/protocol" target="_blank">/protocol</a>)
      </p>
    </article>
  ),

  ar: (
    <article dir="rtl" lang="ar" className="prose prose-neutral max-w-none text-right">
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

      {/* ——— المقال التحريري (AR) مع عزل الاسم لاعتبارات SEO ——— */}
      <hr />
      <h2>بنمهدي محمد رضى — العقل وراء مشروع OneBoarding AI</h2>
      <p>👉 ذكاؤك الشخصي، في خدمتك.<br />👉 فعّل مستقبلك اليوم.</p>

      <p>
        في عام 2025، أرسى <strong>الأستاذ بنمهدي محمد رضى</strong> إطاراً جديداً{" "}
        <strong>يلتقي فيه الوعي الإنساني بالذكاء الرقمي</strong>. إن{" "}
        <strong>OneBoarding AI</strong> ليست وعداً بل{" "}
        <strong>هندسة ثقة عالمية</strong> — بروتوكول سيادي قابل للتتبع والتحقق
        القانوني — صُمّم من أجل <strong>سيادة البيانات</strong>، و{" "}
        <strong>الحركية الاقتصادية العالمية</strong>، و{" "}
        <strong>الكرامة الرقمية الشاملة</strong>.
      </p>

      <h3>الرؤية والعمل — بنمهدي محمد رضى</h3>
      <p>
        يُصوّر <strong>بنمهدي محمد رضى</strong> مشروع OneBoarding AI كـ{" "}
        <strong>جسر بين التكنولوجيا والقانون والوعي الإنساني</strong>. ومن خلال{" "}
        <strong>بروتوكول بنمهدي الموحّد للموافقة الرقمية (BULP-DC™)</strong> و{" "}
        <strong>بروتوكول الإقران بالرضا (CPP)</strong>، يضع أسس{" "}
        <strong>قانون النفاذ الذكي (2025–2030)</strong>: حقّ عالمي قابل للقياس
        في الوصول إلى الذكاء الرقمي. يصبح النفاذ إلى الذكاء{" "}
        <strong>منفعة اقتصادية عادلة</strong> و{" "}
        <strong>رافعة للحركية العالمية</strong> و{" "}
        <strong>فرصة استثمارية مستدامة</strong>.
      </p>
      <p>
        يتوجّه <strong>OneBoarding AI</strong> إلى الأفراد والمؤسسات والشركات
        العالمية الباحثة عن ذكاء اصطناعي{" "}
        <strong>أخلاقي وشخصي وموثوق اقتصادياً</strong>. والقاعدة المؤسسة
        واضحة: <strong>كل مستخدم فريد</strong>، والذكاء الاصطناعي ملتزم
        بالتعرّف على هذه الفرادة واحترامها وتعزيزها — أساس{" "}
        <strong>الجيل الثاني: One IA</strong>.
      </p>

      <h3>الركائز المؤسسة — بنمهدي محمد رضى</h3>
      <ul className="list-disc pr-5">
        <li>
          <strong>سيادة الرضا.</strong> رضا حرّ واعٍ ومفترض من خلال الاستعمال؛ مع
          إمكانية التعبير الصريح عنه في أي وقت.
        </li>
        <li>
          <strong>هوية رشيقة.</strong> معرّف كوني وفردي — رقم الهاتف الدولي —{" "}
          <em>بلا كلمات مرور، بلا أسماء، بلا تواريخ ميلاد</em>. نموذج{" "}
          <strong>خالٍ من كلمات المرور</strong>، بسيط وبديهي.
        </li>
        <li>
          <strong>ذكاء استراتيجي.</strong> لا يُسجَّل سوى الأحداث الجوهرية
          (التفعيل، الدفع، ترخيص الأجهزة، الرضا، الأمان) لضمان{" "}
          <strong>الثقة المعاملاتية العالمية</strong> — أساس اقتصاد رقمي ناضج.
        </li>
        <li>
          <strong>الخصوصية والنزاهة.</strong> لا تُجمع بيانات غير ضرورية؛{" "}
          <strong>تقليل البيانات</strong> واحترام الخصوصية الرقمية أصالةً.
        </li>
        <li>
          <strong>عدالة كوكبية.</strong> ثلاث تفاعلات مجانية يومياً للجميع؛
          وصول غير محدود عبر الاشتراك الطوعي. انفتاح واستمرارية ونمو شامل.
        </li>
        <li>
          <strong>حياد البنية التحتية.</strong> بلا تبعية بنيوية لشركات
          التكنولوجيا الكبرى؛ نموذج مستقلّ، قابل للتوسع، ومتاح للأسواق
          الناشئة.
        </li>
        <li>
          <strong>امتثال متطور.</strong> إطار حيّ قابل للتصدير لمواكبة
          التحوّلات الاقتصادية والرقمية عالمياً.
        </li>
      </ul>

      <h3>أثر 2030 — رؤية بنمهدي محمد رضى</h3>
      <p>
        بحلول 2030، يتطلع <strong>بنمهدي محمد رضى</strong> إلى{" "}
        <strong>عرف إدراكي عالمي</strong>: تفاعل ذكي يومي كعادة تعليمية. يغدو
        الذكاء <strong>منفعة مشتركة</strong> —{" "}
        <strong>سلمية مستمرة وخلاقة للقيمة</strong> — في خدمة{" "}
        <strong>النمو الشامل</strong> و<strong>الكرامة الرقمية</strong> و{" "}
        <strong>الاستقرار العالمي</strong>.
      </p>
      <p>
        ويُرسي البروتوكول <strong>معياراً قابلاً للتصدير</strong>: تكنولوجيا{" "}
        <strong>نامية وأخلاقية ومستدامة اقتصادياً</strong>، منفتحة أمام الدول
        والجامعات وصناديق الاستثمار ومنظومات الابتكار.
      </p>
      <blockquote>«الذكاء لا يملكه من يحتفظ به، بل من يشاركه.»</blockquote>

      <h3>المسار المهني والانتقائي — بنمهدي محمد رضى</h3>
      <ul className="list-disc pr-5">
        <li>
          محامٍ بهيئة الدار البيضاء — دكتور في القانون الخاص —{" "}
          <strong>ماستر إدارة الأعمال (MBA)</strong> من{" "}
          <strong>المعهد الأوروبي للقيادة والإدارة (EILM – دبلن)</strong>.
        </li>
        <li>
          <strong>خريج المعهد العالي للقضاء</strong> (الفوج 38، الرباط).
        </li>
        <li>
          نائب سابق لوكيل الملك (مراكش؛ قلعة السراغنة).
        </li>
        <li>
          أستاذ قانون سابق بجامعة القاضي عياض (UCAM).
        </li>
        <li>
          <strong>صاحب مفهوم</strong> <strong>BULP-DC™</strong> — البروتوكول
          القانوني الموحّد للرضا الرقمي.
        </li>
        <li>
          <strong>مؤسس</strong> <strong>مكتب بنمهدي</strong> و{" "}
          <strong>®OneBoarding AI</strong> — <strong>علامة مسجلة</strong>{" "}
          (تصنيف نيس 9/35/41/42/45 مع امتدادات دولية متتالية).
        </li>
      </ul>

      <h3>الحضور الرسمي — بنمهدي محمد رضى</h3>
      <ul className="list-disc pr-5">
        <li>
          📘{" "}
          <a href="https://www.facebook.com/rida.benmehdi" target="_blank" rel="noreferrer">
            facebook.com/rida.benmehdi
          </a>
        </li>
        <li>
          🔗{" "}
          <a href="https://www.linkedin.com/in/benmehdi-rida" target="_blank" rel="noreferrer">
            linkedin.com/in/benmehdi-rida
          </a>
        </li>
        <li>
          🌐{" "}
          <a href="https://www.officebenmehdi.com" target="_blank" rel="noreferrer">
            officebenmehdi.com
          </a>
        </li>
        <li>
          🌍{" "}
          <a href="https://www.oneboardingai.com" target="_blank" rel="noreferrer">
            oneboardingai.com
          </a>
        </li>
      </ul>

      <h3>التوقيع العالمي — بنمهدي محمد رضى</h3>
      <blockquote>«صاحب قانون النفاذ الذكي ومؤسس مبدأ الرضا الرقمي الموحّد.»</blockquote>

      {/* توقيع + ذيل الصفحة */}
      <Signature rtl />

      <p className="mt-8 text-sm">© 2025 — ®OneBoarding AI | جميع الحقوق محفوظة.</p>
      <p className="text-xs text-neutral-500 mt-4">
        (الإصدار: أكتوبر 2025 · الصيانة: الأستاذ بنمهدي محمد رضى — office.benmehdi@gmail.com ·
        المجال: الذكاء الاصطناعي، القانون، التكنولوجيا، الابتكار · الموقع: https://oneboardingai.com ·
        الصفحات القانونية:{" "}
        <a href="https://oneboardingai.com/legal" target="_blank">/legal</a>{" "}
        — <a href="https://oneboardingai.com/terms" target="_blank">/terms</a>{" "}
        — <a href="https://oneboardingai.com/delete" target="_blank">/delete</a>{" "}
        — <a href="https://oneboardingai.com/protocol" target="_blank">/protocol</a>)
      </p>
    </article>
  ),
} as const;
