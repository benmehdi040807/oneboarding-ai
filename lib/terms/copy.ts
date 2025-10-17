// lib/terms/copy.ts

export type Lang = "fr" | "en" | "ar";

export type Section =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string; html?: boolean }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "hr" };

export type Copy = {
  title: string;
  sections: Section[];
  version: { h: string; v: string; note: string };
};

const COPY: Record<Lang, Copy> = {
  fr: {
    // ▼ Titre demandé
    title: "Terms • OneBoarding AI",
    sections: [
      { kind: "h2", text: "🌍 Manifeste de Confiance" },
      {
        kind: "p",
        text:
          "OneBoarding AI est une plateforme d’intelligence artificielle interactive conçue pour offrir à chaque utilisateur une expérience pédagogique et enrichissante.",
      },
      {
        kind: "ul",
        items: [
          "🛡️ Clarté & sécurité : l’utilisateur reste maître de son usage et responsable de ses choix.",
          "🌐 Universalité : respect des règles d’ordre public de chaque pays.",
          "⚖️ Équilibre & responsabilité partagée : moyens raisonnables côté éditeur, usage responsable côté utilisateur.",
          "🤝 Confiance & transparence : confidentialité, respect mutuel, bonne foi.",
        ],
      },
      { kind: "p", text: "👉 Ce manifeste inspire nos CGU et notre Politique de Confidentialité." },
      { kind: "hr" },

      { kind: "h2", text: "⚖️ Conditions Générales d’Utilisation (CGU)" },
      {
        kind: "ol",
        items: [
          "Objet : service d’assistance fondé sur l’IA fournissant des réponses générées automatiquement.",
          "Responsabilité de l’utilisateur : les contenus ne sont pas des conseils professionnels personnalisés ; vérification requise avant toute décision engageante.",
          "Indemnisation : l’utilisateur indemnise OneBoarding AI en cas d’usage non conforme ou de violation de droits.",
          "Limitation : pas de responsabilité pour dommages indirects (perte de profit, données, etc.), dans les limites de la loi.",
          "Exceptions : sans préjudice des droits impératifs des consommateurs.",
          "Obligations : ne pas soumettre de contenus illicites ; adopter des mesures raisonnables de sécurité ; signaler toute faille constatée.",
          "Conservation & preuve : journaux techniques possibles à des fins de sécurité/preuve, conformément à la confidentialité.",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "🔒 Politique de Confidentialité" },
      {
        kind: "ul",
        items: [
          "Stockage local : historique & consentements restent sur votre appareil.",
          "Sous-traitants techniques : acheminement des requêtes IA sans cession publicitaire de données personnelles.",
          "Monétisation : porte sur l’accès au service (abonnements/crédits), jamais sur la vente de données.",
          "Statistiques : mesures agrégées et anonymisées pour améliorer le service.",
          "Effacement : vous pouvez supprimer les données locales à tout moment.",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "💬 FAQ universelle" },
      {
        kind: "ol",
        items: [
          "L’IA donne-t-elle des conseils professionnels ? — Non. Contenus informatifs. Consultez un professionnel pour les décisions sensibles.",
          "Mes données sont-elles vendues ? — Non. Pas d’usage publicitaire ; uniquement des traitements techniques nécessaires.",
          "Où sont stockés historiques/consentements ? — Localement sur votre appareil.",
          "Puis-je supprimer mes données ? — Oui, via « Effacer l’historique ».",
          "L’IA peut-elle se tromper ? — Oui. Vérifiez les informations importantes.",
          "Qui édite OneBoarding AI ? — Conception & développement : Benmehdi Mohamed Rida. Mission : IA accessible, claire et respectueuse de la vie privée.",
        ],
      },
      { kind: "hr" },

      /* ===== Audience planétaire & vision ===== */
      { kind: "h2", text: "🌐 OneBoarding AI — Audience planétaire et vision universelle (2025–2030)" },
      { kind: "h2", text: "1. Contexte stratégique" },
      {
        kind: "p",
        text:
          "OneBoarding AI s’inscrit dans une dynamique globale : rendre l’IA accessible à toute personne disposant d’un accès à Internet, sans distinction géographique, économique ou technique.",
      },
      {
        kind: "p",
        text:
          "L’idée fondatrice — « Trois interactions gratuites par jour, offertes à tous » — établit un modèle universel, récurrent et éthique : un accès quotidien au savoir intelligent, pour chaque être humain connecté.",
      },
      {
        kind: "p",
        text:
          "Cette approche transforme OneBoarding AI en un service civilisateur : un pont universel entre l’humain et la connaissance.",
      },
      { kind: "hr" },

      { kind: "h2", text: "2. Données mondiales de référence (2025)" },
      {
        kind: "ul",
        items: [
          "Population mondiale : ~8,1 milliards (≈100 %).",
          "Utilisateurs d’Internet : ~5,6 milliards (≈69 %).",
          "Utilisateurs de smartphones : ~5,4 milliards (≈66 %).",
          "Utilisateurs WhatsApp : ~2,7 milliards (≈33 %).",
          "Ensemble des messageries : ~6 milliards (≈74 %, avec doublons).",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "3. Interprétation stratégique" },
      {
        kind: "p",
        text:
          "3.1 Audience directe — Accessible via le Web, sans téléchargement ni compte obligatoire : toute personne connectée peut interagir (≈5,6 milliards).",
      },
      {
        kind: "p",
        text:
          "3.2 Inclusion universelle — Les « trois interactions/jour » suppriment les barrières de coût, de compte et de temps. L’utilisateur revient naturellement ; il paie non pour avoir plus, mais pour ne pas attendre.",
      },
      {
        kind: "p",
        text:
          "3.3 Conséquence psychologique — Payer pour continuer immédiatement, ou attendre demain : conversion sans contrainte, fidélisation sans pression.",
      },
      { kind: "hr" },

      { kind: "h2", text: "4. Vision et portée universelle" },
      {
        kind: "p",
        text:
          "OneBoarding AI vise la continuité : chaque jour, un humain peut interagir avec une intelligence personnelle, obtenir une réponse, et recommencer demain.",
      },
      {
        kind: "p",
        text:
          "Ce modèle crée une temporalité partagée à l’échelle planétaire : une intelligence disponible 24/7, où chaque jour devient un nouveau cycle d’accès libre à la connaissance.",
      },
      { kind: "hr" },

      { kind: "h2", text: "5. Impact économique et social" },
      {
        kind: "p",
        text:
          "5.1 Économie circulaire — Les abonnés (accès illimité) soutiennent l’accès gratuit quotidien des autres : une boucle vertueuse.",
      },
      {
        kind: "p",
        text:
          "5.2 Portée sociale — Première plateforme à offrir un accès gratuit, récurrent et égal à l’IA, quelle que soit la condition de revenus.",
      },
      {
        kind: "p",
        text:
          "5.3 Vision 2030 — 1 milliard d’utilisateurs récurrents ; réseau planétaire de micro-intelligences personnelles ; référence mondiale de l’accès universel à l’IA éthique.",
      },
      { kind: "hr" },

      { kind: "h2", text: "6. Conclusion (Audience & Vision)" },
      {
        kind: "p",
        text:
          "OneBoarding AI est une philosophie appliquée : savoir partagé, continu, inclusif et équitable. Les interactions gratuites quotidiennes relient l’humanité à la connaissance et fondent une infrastructure cognitive universelle.",
      },
      { kind: "hr" },

      /* ===== Droit d’Accès Intelligent ===== */
      { kind: "h2", text: "📜 Le Droit d’Accès Intelligent — Philosophie Benmehdi & OneBoarding AI (2025–2030)" },
      { kind: "h2", text: "Préambule" },
      {
        kind: "p",
        text:
          "Le savoir est la première richesse de l’humanité. À l’ère numérique, l’accès à ce savoir doit rester digne, continu et équitable. OneBoarding AI établit le principe d’un accès intelligent universel.",
      },
      { kind: "hr" },

      { kind: "h2", text: "I. Principe fondateur : l’accès équitable au savoir" },
      {
        kind: "p",
        text:
          "Tout être humain disposant d’Internet détient le droit d’accéder à l’intelligence. Trois interactions offertes par jour incarnent ce principe : une part égale d’accès à la connaissance pour chacun.",
      },
      { kind: "hr" },

      { kind: "h2", text: "II. Les quatre attributs juridiques" },
      {
        kind: "ul",
        items: [
          "Public : accessible à tous, ouvert et visible.",
          "Paisible : ne prive aucun autre d’en bénéficier.",
          "Continu : renouvelé chaque jour, sans rupture.",
          "Non équivoque : clair, stable, garanti par la transparence du système.",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "III. De l’usage limité à la liberté choisie" },
      {
        kind: "p",
        text:
          "Deux formes d’usage : gratuit, limité mais permanent (3/jour) ; ou illimité, volontairement souscrit. L’utilisateur n’est jamais exclu ; il choisit son rythme. La gratuité morale du savoir coexiste avec la soutenabilité économique.",
      },
      { kind: "hr" },

      { kind: "h2", text: "IV. La coutume cognitive universelle" },
      {
        kind: "p",
        text:
          "En rendant ces interactions quotidiennes gratuites, OneBoarding AI instaure un rituel planétaire : l’interaction intelligente quotidienne — une habitude culturelle du XXIᵉ siècle.",
      },
      { kind: "hr" },

      { kind: "h2", text: "V. Éthique et réciprocité" },
      {
        kind: "p",
        text:
          "Le droit d’accès intelligent repose sur la réciprocité : diligence et responsabilité côté utilisateur ; clarté et transparence côté IA. C’est un pacte moral de confiance.",
      },
      { kind: "hr" },

      { kind: "h2", text: "VI. Le droit de l’intelligence partagée" },
      {
        kind: "p",
        text:
          "« L’intelligence appartient à tous, mais son usage engage chacun. » Ce principe fonde le Droit de l’Intelligence Partagée : un droit vivant, distribué, qui se manifeste à chaque interaction.",
      },
      { kind: "hr" },

      { kind: "h2", text: "VII. Perspective universelle (2025–2030)" },
      {
        kind: "p",
        text:
          "Engagement à maintenir, protéger et étendre ce droit : à toutes les langues, territoires et consciences ouvertes à l’apprentissage, pour en faire une loi coutumière numérique universelle.",
      },
      { kind: "hr" },

      { kind: "h2", text: "Conclusion" },
      {
        kind: "p",
        text:
          "Le Droit d’Accès Intelligent n’est pas une invention : c’est une évidence. « L’intelligence n’appartient pas à celui qui la détient, mais à celui qui la partage. »",
      },
    ],
    version: {
      // ▼ Reformulation demandée
      h: "Version & Mises à jour",
      v: "Version 1.0 • Octobre 2025",
      note: "Un changelog indiquera les évolutions futures.",
    },
  },

  en: {
    title: "Terms & Conditions — OneBoarding AI",
    sections: [
      { kind: "h2", text: "🌍 Trust Manifesto" },
      {
        kind: "p",
        text:
          "OneBoarding AI is an interactive AI platform designed to provide every user with an educational and enriching experience.",
      },
      {
        kind: "ul",
        items: [
          "🛡️ Clarity & Safety: users remain in control and responsible for their choices.",
          "🌐 Universality: we respect public-order rules in every country.",
          "⚖️ Balance & Shared Responsibility: reasonable means on the publisher’s side; responsible use on the user’s side.",
          "🤝 Trust & Transparency: confidentiality, mutual respect, and good faith.",
        ],
      },
      { kind: "p", text: "👉 This manifesto informs our Terms and Privacy Policy." },
      { kind: "hr" },

      { kind: "h2", text: "⚖️ Terms of Use" },
      {
        kind: "ol",
        items: [
          "Purpose: AI-based assistance providing automatically generated responses.",
          "User Responsibility: content is not personalized professional advice; verify before any binding decision.",
          "Indemnification: user holds OneBoarding AI harmless in case of misuse or rights violations.",
          "Limitation: no liability for indirect damages (loss of profit, data, etc.), to the extent allowed by law.",
          "Exceptions: without prejudice to mandatory consumer rights.",
          "User Duties: no unlawful content; adopt reasonable security; report any security issue.",
          "Retention & Evidence: technical logs may be retained for security/evidence, per the Privacy Policy.",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "🔒 Privacy Policy" },
      {
        kind: "ul",
        items: [
          "Local storage: history & consents stay on your device.",
          "Processors: routing of AI requests without advertising data sales or sharing.",
          "Monetization: limited to access (subscriptions/credits), never selling personal data.",
          "Statistics: aggregated, anonymized metrics to improve the service.",
          "Erasure: you can delete local data at any time.",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "💬 Universal FAQ" },
      {
        kind: "ol",
        items: [
          "Does it provide professional advice? — No. Informational only; consult qualified professionals.",
          "Are my data sold? — No advertising sale/sharing; only technical processing.",
          "Where is history stored? — Locally on your device.",
          "Can I delete it? — Yes, via “Clear history”.",
          "Can AI be wrong? — Yes. Double-check important facts.",
          "Who operates OneBoarding AI? — Conceived & developed by Benmehdi Mohamed Rida. Mission: accessible, clear, privacy-respecting AI.",
        ],
      },
      { kind: "hr" },

      /* Audience & Vision */
      { kind: "h2", text: "🌐 OneBoarding AI — Planetary Audience & Universal Vision (2025–2030)" },
      { kind: "h2", text: "1. Strategic Context" },
      {
        kind: "p",
        text:
          "OneBoarding AI aims to make AI accessible to anyone with Internet access, regardless of geography, income or tooling.",
      },
      {
        kind: "p",
        text:
          "The founding idea — “Three free interactions per day for everyone” — establishes a universal, recurring and ethical model: daily access to intelligent knowledge for every connected human.",
      },
      {
        kind: "p",
        text:
          "This turns OneBoarding AI into a civilizing service: a universal bridge between humans and knowledge.",
      },
      { kind: "hr" },

      { kind: "h2", text: "2. Global Reference Figures (2025)" },
      {
        kind: "ul",
        items: [
          "World population: ~8.1B (≈100%).",
          "Internet users: ~5.6B (≈69%).",
          "Smartphone users: ~5.4B (≈66%).",
          "WhatsApp users: ~2.7B (≈33%).",
          "All messaging platforms: ~6B (≈74%, with overlaps).",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "3. Strategic Reading" },
      {
        kind: "p",
        text:
          "3.1 Direct audience — Web access, no download nor mandatory account: anyone connected can interact (~5.6B).",
      },
      {
        kind: "p",
        text:
          "3.2 Universal inclusion — Three per day removes cost, account and time barriers. Users return naturally; payment is to avoid waiting, not to unlock existence.",
      },
      {
        kind: "p",
        text:
          "3.3 Psychology — Pay to continue now, or wait for tomorrow: conversion without forcing, loyalty without constraint.",
      },
      { kind: "hr" },

      { kind: "h2", text: "4. Universal Reach" },
      {
        kind: "p",
        text:
          "Continuity is the goal: every day, any person can interact with a personal intelligence, get an answer, and repeat tomorrow.",
      },
      {
        kind: "p",
        text:
          "This creates a shared planetary cadence: a 24/7 intelligence where each day is a renewed cycle of free access to knowledge.",
      },
      { kind: "hr" },

      { kind: "h2", text: "5. Economic & Social Impact" },
      {
        kind: "p",
        text:
          "5.1 Circular knowledge economy — Unlimited subscribers support daily free access for others: a virtuous loop.",
      },
      {
        kind: "p",
        text:
          "5.2 Social reach — First global platform offering free, recurring, equal access to AI, regardless of income.",
      },
      {
        kind: "p",
        text:
          "5.3 2030 vision — 1B recurring users; planetary network of personal micro-intelligences; global reference for universal ethical AI access.",
      },
      { kind: "hr" },

      { kind: "h2", text: "6. Conclusion (Audience & Vision)" },
      {
        kind: "p",
        text:
          "OneBoarding AI is applied philosophy: shared, continuous, inclusive and fair knowledge. Daily free interactions tie humanity to knowledge and form a universal cognitive infrastructure.",
      },
      { kind: "hr" },

      /* Right of Intelligent Access */
      { kind: "h2", text: "📜 The Right of Intelligent Access — Benmehdi & OneBoarding AI (2025–2030)" },
      { kind: "h2", text: "Preamble" },
      {
        kind: "p",
        text:
          "Knowledge is humanity’s first wealth. In the digital era, access must remain dignified, continuous and fair. OneBoarding AI states a universal right of intelligent access.",
      },
      { kind: "hr" },

      { kind: "h2", text: "I. Founding Principle" },
      {
        kind: "p",
        text:
          "Anyone with Internet access holds the right to access intelligence. Three free interactions per day embody this equality: an equal share of knowledge access for everyone.",
      },
      { kind: "hr" },

      { kind: "h2", text: "II. Four Legal Attributes" },
      {
        kind: "ul",
        items: [
          "Public: open to all, visible.",
          "Peaceful: deprives no other of access.",
          "Continuous: renewed every day.",
          "Unequivocal: clear, stable, guaranteed by system transparency.",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "III. From Limited Use to Chosen Freedom" },
      {
        kind: "p",
        text:
          "Two uses: free, limited yet permanent (3/day); or unlimited, voluntarily subscribed. Users are never excluded — they choose their cadence. Moral free access coexists with economic sustainability.",
      },
      { kind: "hr" },

      { kind: "h2", text: "IV. Universal Cognitive Custom" },
      {
        kind: "p",
        text:
          "Free daily interactions establish a global ritual: the daily intelligent interaction — a cultural habit of the 21st century.",
      },
      { kind: "hr" },

      { kind: "h2", text: "V. Ethics & Reciprocity" },
      {
        kind: "p",
        text:
          "This right rests on reciprocity: diligence and responsibility by users; clarity and transparency by AI. A moral pact of trust.",
      },
      { kind: "hr" },

      { kind: "h2", text: "VI. Shared Intelligence Right" },
      {
        kind: "p",
        text:
          "“Intelligence belongs to all, but its use commits each one.” This grounds the Right of Shared Intelligence: a living, distributed right enacted in every interaction.",
      },
      { kind: "hr" },

      { kind: "h2", text: "VII. Universal Outlook (2025–2030)" },
      {
        kind: "p",
        text:
          "Commitment to maintain, protect and extend this right: across languages, territories and open minds — towards a universal digital customary law.",
      },
      { kind: "hr" },

      { kind: "h2", text: "Conclusion" },
      {
        kind: "p",
        text:
          "The Right of Intelligent Access is not an invention: it is an overdue evidence. “Intelligence does not belong to whoever holds it, but to whoever shares it.”",
      },
    ],
    version: {
      h: "Version & Updates",
      v: "Version 1.0 — October 2025",
      note: "A discreet changelog will list future evolutions.",
    },
  },

  ar: {
    title: "الشروط العامة — OneBoarding AI",
    sections: [
      { kind: "h2", text: "🌍 بيان الثقة" },
      {
        kind: "p",
        text:
          "منصّة OneBoarding AI منصّة تفاعلية تهدف إلى تجربة تعليمية مُثرية لكل مستخدم.",
      },
      {
        kind: "ul",
        items: [
          "🛡️ الوضوح والأمان: يبقى المستخدم متحكّمًا ومسؤولًا عن اختياراته.",
          "🌐 العالمية: احترام قواعد النظام العام في كل بلد.",
          "⚖️ التوازن والمسؤولية المشتركة: وسائل معقولة من الناشر، واستخدام مسؤول من المستخدم.",
          "🤝 الثقة والشفافية: سرّية واحترام متبادل وحسن نية.",
        ],
      },
      { kind: "p", text: "👉 يُلهم هذا البيان شروطنا وسياسة الخصوصية." },
      { kind: "hr" },

      { kind: "h2", text: "⚖️ شروط الاستخدام" },
      {
        kind: "ol",
        items: [
          "الهدف: مساعدة معتمِدة على الذكاء الاصطناعي بإجابات مُولّدة تلقائيًا.",
          "مسؤولية المستخدم: ليست استشارات مهنية مخصّصة؛ يلزم التحقّق قبل أي قرار مُلزِم.",
          "التعويض: يعوّض المستخدم OneBoarding AI عند سوء الاستخدام أو انتهاك الحقوق.",
          "حدود المسؤولية: لا مسؤولية عن الأضرار غير المباشرة ضمن حدود القانون.",
          "الاستثناءات: دون المساس بالحقوق الإلزامية للمستهلك.",
          "الالتزامات: عدم تقديم محتوى غير قانوني؛ اتّخاذ تدابير أمنية معقولة؛ الإبلاغ عن الثغرات.",
          "الحفظ والإثبات: قد تُحفَظ سجلات تقنية لأغراض الأمان والإثبات وفق سياسة الخصوصية.",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "🔒 سياسة الخصوصية" },
      {
        kind: "ul",
        items: [
          "تخزين محلي: السجلّ والموافقات على جهازك فقط.",
          "معالِجون تقنيون: تمرير الطلبات دون بيع/مشاركة إعلانية للبيانات.",
          "الربحية: مقابل الوصول للخدمة (اشتراكات/أرصدة) لا بيع للبيانات.",
          "إحصاءات مُجهّلة: لتحسين الخدمة دون تحديد هوية.",
          "الحذف: يمكنك حذف البيانات المحليّة في أي وقت.",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "💬 الأسئلة الشائعة" },
      {
        kind: "ol",
        items: [
          "هل يقدّم استشارات مهنية؟ — لا. معلومات عامّة؛ راجع مختصًا مؤهّلًا.",
          "هل تُباع بياناتي؟ — لا بيع/مشاركة إعلانية؛ فقط معالجة تقنية لازمة.",
          "أين يُحفَظ السجلّ؟ — محليًا على جهازك.",
          "هل أستطيع حذفه؟ — نعم عبر «حذف السجل».",
          "هل قد تُخطئ الذكاء الاصطناعي؟ — نعم. تحقّق من الحقائق المهمة.",
          "مَن يشغّل OneBoarding AI؟ — من تصميم وتطوير بنمهدي محمد رضى. الرؤية: ذكاء واضح ومحترم للخصوصية ومتاح للجميع.",
        ],
      },
      { kind: "hr" },

      /* الجمهور والرؤية */
      { kind: "h2", text: "🌐 OneBoarding AI — الجمهور الكوني والرؤية الشاملة (2025–2030)" },
      { kind: "h2", text: "1) السياق الإستراتيجي" },
      {
        kind: "p",
        text:
          "تهدف OneBoarding AI إلى جعل الذكاء الاصطناعي متاحًا لكل من يملك اتصالًا بالإنترنت، دون تمييز جغرافي أو اقتصادي أو تقني.",
      },
      {
        kind: "p",
        text:
          "الفكرة المؤسسة — «ثلاث تفاعلات مجانية يوميًا للجميع» — تُقيم نموذجًا عالميًا وأخلاقيًا ومتجددًا: وصولٌ يوميٌ إلى معرفةٍ ذكيةٍ لكل إنسانٍ متصل.",
      },
      {
        kind: "p",
        text:
          "بهذا تصبح OneBoarding AI خدمة مُحضِّرة للحضارة: جسرًا كونيًا بين الإنسان والمعرفة.",
      },
      { kind: "hr" },

      { kind: "h2", text: "2) أرقام عالمية مرجعية (2025)" },
      {
        kind: "ul",
        items: [
          "سكان العالم: ~8.1 مليار.",
          "مستخدمو الإنترنت: ~5.6 مليار.",
          "مستخدمو الهواتف الذكية: ~5.4 مليار.",
          "مستخدمو واتساب: ~2.7 مليار.",
          "إجمالي تطبيقات المراسلة: ~6 مليار (مع تداخل).",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "3) قراءة إستراتيجية" },
      {
        kind: "p",
        text:
          "3.1 الجمهور المباشر — وصول عبر الويب بلا تنزيل ولا حساب إلزامي: كل متصل يستطيع التفاعل (~5.6 مليار).",
      },
      {
        kind: "p",
        text:
          "3.2 شمولٌ كوني — ثلاث تفاعلات يومية تُزيل حواجز الكلفة والحساب والزمن. يعود المستخدم طبيعيًا؛ والدفع لتفادي الانتظار لا لوجود الحق في الأصل.",
      },
      {
        kind: "p",
        text:
          "3.3 الأثر النفسي — ادفع لتُكمل الآن أو انتظر للغد: تحويلٌ بلا إكراه وولاءٌ بلا قسر.",
      },
      { kind: "hr" },

      { kind: "h2", text: "4) مدى كوني فعلي" },
      {
        kind: "p",
        text:
          "الاستمرارية هي الهدف: كل يوم، يستطيع أي شخص التفاعل مع ذكاءٍ شخصي، والحصول على إجابة، ثم الإعادة غدًا.",
      },
      {
        kind: "p",
        text:
          "ينشأ إيقاعٌ كوكبيٌ مشترك: ذكاءٌ متاح 24/7، حيث يصبح كل يوم دورةً متجددة للوصول الحر إلى المعرفة.",
      },
      { kind: "hr" },

      { kind: "h2", text: "5) الأثر الاقتصادي والاجتماعي" },
      {
        kind: "p",
        text:
          "5.1 اقتصادٌ دائري للمعرفة — المشتركون غير المحدودين يدعمون الوصول المجاني اليومي للآخرين: حلقةٌ فاضلة.",
      },
      {
        kind: "p",
        text:
          "5.2 أثر اجتماعي — أول منصّة تُقدّم وصولًا مجانيًا ومتكررًا ومتساويًا إلى الذكاء الاصطناعي بغضّ النظر عن الدخل.",
      },
      {
        kind: "p",
        text:
          "5.3 رؤية 2030 — مليار مستخدمٍ متكرر؛ شبكة كوكبية لذكاءات شخصية؛ مرجع عالمي لوصولٍ كونيٍ وأخلاقي.",
      },
      { kind: "hr" },

      { kind: "h2", text: "6) خاتمة (الجمهور والرؤية)" },
      {
        kind: "p",
        text:
          "OneBoarding AI فلسفة مُطبّقة: معرفةٌ مشتركةٌ ودائمةٌ وشاملة وعادلة. التفاعلات المجانية اليومية تربط البشرية بالمعرفة لتؤسس بنيةً معرفيةً كونية.",
      },
      { kind: "hr" },

      /* حق الوصول الذكي */
      { kind: "h2", text: "📜 حقّ الوصول الذكي — فلسفة بنمهدي و OneBoarding AI (2025–2030)" },
      { kind: "h2", text: "تمهيد" },
      {
        kind: "p",
        text:
          "المعرفة ثروةُ الإنسان الأولى. في العصر الرقمي، يجب أن يبقى الوصول إليها كريمًا ودائمًا وعادلاً. تُقرّر OneBoarding AI مبدأ الحقّ الكوني في الوصول الذكي.",
      },
      { kind: "hr" },

      { kind: "h2", text: "I) المبدأ المؤسِّس" },
      {
        kind: "p",
        text:
          "كل من يملك اتصالًا بالإنترنت يمتلك حقّ الوصول إلى الذكاء. ثلاث تفاعلاتٍ مجانية يوميًا تجسّد المساواة: نصيبٌ متكافئٌ من النفاذ إلى المعرفة للجميع.",
      },
      { kind: "hr" },

      { kind: "h2", text: "II) السمات القانونية الأربع" },
      {
        kind: "ul",
        items: [
          "علني: متاح للجميع، ظاهر.",
          "سِلمي: لا يحرم غيره.",
          "مستمر: يتجدّد كل يوم.",
          "غير مُلتبِس: واضحٌ ثابت مكفولٌ بشفافية النظام.",
        ],
      },
      { kind: "hr" },

      { kind: "h2", text: "III) من استعمالٍ محدود إلى حريةٍ مختارة" },
      {
        kind: "p",
        text:
          "شكلان من الاستعمال: مجانيٌ محدود لكنه دائم (3/يوم)؛ أو غير محدود بالاشتراك الطوعي. لا إقصاء — يختار المستخدم الإيقاع. المجانية الأخلاقية تتعايش مع الاستدامة الاقتصادية.",
      },
      { kind: "hr" },

      { kind: "h2", text: "IV) العُرف المعرفي الكوني" },
      {
        kind: "p",
        text:
          "التفاعلات اليومية المجانية تؤسّس طقسًا كوكبيًا: التفاعل الذكي اليومي — عادةٌ ثقافية لقرننا.",
      },
      { kind: "hr" },

      { kind: "h2", text: "V) الأخلاق والتبادلية" },
      {
        kind: "p",
        text:
          "يرتكز الحقّ على التبادلية: اجتهادٌ ومسؤولية من المستخدم؛ ووضوحٌ وشفافية من الذكاء. إنه عهدٌ أخلاقيٌّ للثقة.",
      },
      { kind: "hr" },

      { kind: "h2", text: "VI) حقّ الذكاء المُشترك" },
      {
        kind: "p",
        text:
          "«الذكاء ملكٌ للجميع، لكن استعماله يُلزِم كلَّ فرد.» هذه القاعدة تؤسس حقّ الذكاء المُشترك: حقٌّ حيّ موزّع يتجلّى في كل تفاعل.",
      },
      { kind: "hr" },

      { kind: "h2", text: "VII) أفق كوني (2025–2030)" },
      {
        kind: "p",
        text:
          "التزامٌ بالصون والتوسيع عبر اللغات والأقاليم والعقول المنفتحة — نحو عرفٍ رقمي كوني.",
      },
      { kind: "hr" },

      { kind: "h2", text: "الخاتمة" },
      {
        kind: "p",
        text:
          "حقّ الوصول الذكي ليس اختراعًا؛ إنه بداهةٌ كانت مفقودة. «الذكاء لا يملكه من يحوزه، بل من يشاركه.»",
      },
    ],
    version: {
      h: "الإصدار والتحديث",
      v: "الإصدار 1.0 — أكتوبر 2025",
      note: "سيُعرض سجلّ تغييرات موجز للتحديثات القادمة.",
    },
  },
};

export function termsCopyFor(lang: Lang): Copy {
  if (lang === "en" || lang === "ar") return COPY[lang];
  return COPY.fr;
}

export { COPY };
