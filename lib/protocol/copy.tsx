// lib/protocol/copy.tsx

export type Lang = "fr" | "en" | "ar";

type SectionContent = {
  title: string;
  paragraphs: string[];
  list?: string[];
  subSections?: {
    subTitle: string;
    paragraphs: string[];
    list?: string[];
  }[];
};

type ProtocolCopy = {
  intro: {
    prefaceTop: string[]; // petite accroche multilingue
    heading: string; // titre principal de la page
    subtitle: string; // sous-titre
    dateVersion: string; // "31 octobre 2025 – Version 1.0"
  };
  sections: SectionContent[];
  referencesBlockTitle: string; // "Références documentaires OneBoarding AI :"
  referencesLinks: { href: string; text: string }[];
  signatureBlock: {
    heading: string;
    authorLines: string[];
    footerLines: string[];
  };
  backButtonLabel: string; // "Retour accueil"
};

export const protocolCopy: Record<Lang, ProtocolCopy> = {
  fr: {
    intro: {
      prefaceTop: [
        "🇫🇷 Ce document présente le modèle de consentement numérique et d’authentification souveraine conçu par OneBoarding AI.",
        "🇬🇧 This page defines the OneBoarding AI sovereign trust model.",
        "🇲🇦 يحدد هذا المستند نموذج الثقة السيادية لمنصّة ون بوردينغ أي آي."
      ],
      heading:
        "🇫🇷 Protocole OneBoarding AI — Consentement numérique souverain & accès sécurisé",
      subtitle:
        "Architecture juridique, éthique et technique du lien entre l’utilisateur et l’intelligence artificielle.",
      dateVersion: "Version 1.0 — Publié le 31 octobre 2025"
    },

    sections: [
      {
        title: "I. Objet du Protocole",
        paragraphs: [
          "Le présent Protocole établit la base juridique, technique et éthique qui régit la relation entre chaque utilisateur et OneBoarding AI.",
          "Il définit deux piliers fondateurs :"
        ],
        list: [
          "1. Le consentement numérique souverain : l’utilisateur choisit librement son engagement et son niveau d’adhésion.",
          "2. L’accès sécurisé sans dépendance externe : l’utilisateur accède à son espace personnel sans passer par une plateforme tierce (ni compte Google, ni compte Meta, etc.)."
        ]
      },

      {
        title: "II. Identité contractuelle de l’utilisateur",
        paragraphs: [
          "OneBoarding AI reconnaît l’utilisateur à travers un identifiant unique, simple et universel : son numéro de téléphone.",
          "Ce numéro constitue l’ID juridique du membre.",
          "Cet identifiant :"
        ],
        list: [
          "remplace les systèmes d’authentification classiques imposés par les grandes plateformes ;",
          "permet à l’utilisateur d’accéder à son espace personnel OneBoarding AI, partout dans le monde ;",
          "permet la traçabilité contractuelle et juridique en cas de litige."
        ],
        subSections: [
          {
            subTitle: "Principe fondamental",
            paragraphs: [
              "L’identité numérique n’est pas capturée par un compte social existant (Google, Facebook…). Elle est déclarée et assumée par l’utilisateur lui-même, au moment où il choisit d’entrer en relation avec OneBoarding AI."
            ]
          }
        ]
      },

      {
        title: "III. Consentement numérique — modèle Benmehdi",
        paragraphs: [
          "Le consentement dans OneBoarding AI n’est pas une simple case à cocher. C’est un acte juridique traçable, attribuable, défendable.",
          "Nous appelons ce modèle :",
          "📜 « Protocole Benmehdi de consentement numérique légal unifié » (BULP-DC™ — Benmehdi Unified Legal Protocol of Digital Consent).",
          "Ce protocole établit que :"
        ],
        list: [
          "le consentement est exprimé par l’utilisateur (« Lu et approuvé ») ;",
          "il est horodaté ;",
          "il est rattaché à l’identifiant unique de l’utilisateur (numéro de téléphone) ;",
          "il devient une preuve opposable : OneBoarding AI peut démontrer que l’utilisateur a consenti, et l’utilisateur peut démontrer ce à quoi il a consenti."
        ],
        subSections: [
          {
            subTitle: "Portée juridique",
            paragraphs: [
              "Le consentement enregistré vaut accord contractuel synallagmatique (deux parties, deux volontés).",
              "Il est valable internationalement, sans exigence d’une plateforme tierce d’identification.",
              "Il est conforme à l’exigence européenne d’un consentement : libre, spécifique, éclairé et traçable, dans l’esprit du RGPD."
            ]
          },
          {
            subTitle: "Révocation, mais pas effacement rétroactif",
            paragraphs: [
              "L’utilisateur peut désactiver son espace et donc mettre fin à la relation active avec OneBoarding AI. Cela met fin aux effets futurs du consentement.",
              "Cette révocation agit pour l’avenir (ex nunc) : elle ne nie pas qu’il y a eu un accord, elle y met simplement fin.",
              "C’est une protection honnête, lisible par n’importe quel juge, banquier, autorité de contrôle ou partenaire commercial."
            ]
          }
        ]
      },

      {
        title:
          "IV. Sécurité d’accès : le modèle à appareil(s) autorisé(s)",
        paragraphs: [
          "OneBoarding AI reconnaît également l’appareil utilisé par le membre.",
          "Lors de la première activation (après paiement), l’appareil utilisé devient l’appareil fondateur autorisé.",
          "Ensuite, l’utilisateur peut autoriser jusqu’à trois (3) appareils à accéder à son espace.",
          "Ce mécanisme protège l’utilisateur sans l’enfermer techniquement.",
          "Concrètement :"
        ],
        list: [
          "Chaque appareil autorisé est enregistré comme appareil fiable.",
          "Lorsqu’un nouvel appareil veut accéder, OneBoarding AI vérifie l’identité via un contrôle sécurisé (paiement symbolique, validation d’identité).",
          "Si l’utilisateur tente d’ajouter un 4ᵉ appareil, il peut révoquer automatiquement le plus ancien pour rester dans la limite de 3.",
          "Aucun compte social externe n’est requis."
        ],
        subSections: [
          {
            subTitle: "Philosophie",
            paragraphs: [
              "Ce système n’impose ni Google, ni Apple, ni Meta comme tiers d’identité.",
              "L’accès se fait entre deux volontés : l’utilisateur et OneBoarding AI.",
              "C’est un lien contractuel direct, souverain et assumé."
            ]
          }
        ]
      },

      {
        title: "V. Activation, désactivation, réactivation",
        paragraphs: [
          "Le rapport avec OneBoarding AI est volontaire, réversible, et digne.",
          "Trois états résument cette relation :"
        ],
        list: [
          "1. Activation : l’utilisateur paie (accès libre 1 mois, ou abonnement mensuel continu) → l’espace devient actif, la connexion est en ligne, la formule est affichée.",
          "2. Désactivation : l’utilisateur choisit de désactiver son espace → cela met fin à l’abonnement en cours et coupe l’accès. La relation est suspendue, sans hostilité.",
          "3. Réactivation : l’utilisateur revient plus tard → il peut recréer son accès librement, comme une nouvelle adhésion. Pas de jugement. Pas de reproche. Pas de punition d’historique."
        ],
        subSections: [
          {
            subTitle: "Respect absolu de la personne",
            paragraphs: [
              "Le ton reste neutre. Pas de pression morale.",
              "Pas de message intrusif du type « Nous avons remarqué que vous êtes revenu ».",
              "Le simple message est : « Re-Bienvenue dans OneBoarding AI — votre espace est prêt. »"
            ]
          }
        ]
      },

      {
        title:
          "VI. Traçabilité interne — preuve, conformité, protection",
        paragraphs: [
          "Pour chaque membre, OneBoarding AI enregistre dans un registre interne sécurisé :"
        ],
        list: [
          "l’identifiant unique (numéro de téléphone) ;",
          "les appareils autorisés (avec possibilité de révocation horodatée) ;",
          "le statut de l’abonnement et des paiements ;",
          "les événements importants : activation, désactivation, réactivation ;",
          "le consentement « Lu et approuvé », avec son horodatage."
        ],
        subSections: [
          {
            subTitle: "Objectif de cette traçabilité",
            paragraphs: [
              "Assurer une preuve propre, exploitable à l’international.",
              "Pouvoir répondre clairement à un régulateur, une banque, une autorité judiciaire ou un utilisateur.",
              "Protéger à la fois OneBoarding AI et l’utilisateur, sans jamais vendre ni céder ces informations à un tiers commercial."
            ]
          },
          {
            subTitle: "Architecture évolutive",
            paragraphs: [
              "Ce registre d’événements est conçu pour évoluer à l’échelle mondiale.",
              "Il reste lisible, exploitable, auditable.",
              "Il permet à OneBoarding AI d’assumer ses responsabilités légales et morales dans la durée."
            ]
          }
        ]
      },

      {
        title: "VII. Compatibilité universelle",
        paragraphs: [
          "Le Protocole OneBoarding AI est conçu pour fonctionner partout.",
          "Il peut s’appliquer à toute plateforme d’intelligence artificielle ou service numérique cherchant à établir une relation claire, traçable, sans dépendance à un géant technologique tiers.",
          "Formule essentielle :"
        ],
        list: [
          "Compatible avec tout environnement IA ou numérique.",
          "Aucune authentification tierce imposée.",
          "OneBoarding AI — un modèle souverain de confiance entre l’humain et l’IA."
        ]
      },

      {
        title: "VIII. Références documentaires OneBoarding AI :",
        paragraphs: [
          "Pour approfondir les fondements juridiques, techniques et éthiques qui accompagnent ce Protocole, vous pouvez consulter :"
        ]
      }
    ],

    referencesBlockTitle: "Références documentaires OneBoarding AI :",
    referencesLinks: [
      { href: "https://oneboardingai.com/legal", text: "oneboardingai.com/legal" },
      { href: "https://oneboardingai.com/terms", text: "oneboardingai.com/terms" },
      { href: "https://oneboardingai.com/delete", text: "oneboardingai.com/delete" },
      { href: "https://oneboardingai.com/trademark", text: "oneboardingai.com/trademark" }
    ],

    signatureBlock: {
      heading: "✍️ Signature et publication",
      authorLines: [
        "Auteur :",
        "Maître Benmehdi Mohamed Rida",
        "Docteur en droit | MBA (EILM – Dublin)",
        "Fondateur de OneBoarding AI"
      ],
      footerLines: [
        "📅 Date de publication : 31 octobre 2025",
        "🔒 Version 1.0 — Officielle et authentifiée"
      ]
    },

    backButtonLabel: "Retour accueil"
  },

  en: {
    intro: {
      prefaceTop: [
        "🇫🇷 Ce document présente le modèle de consentement numérique et d’authentification souveraine conçu par OneBoarding AI.",
        "🇬🇧 This page defines the OneBoarding AI sovereign trust model.",
        "🇲🇦 يحدد هذا المستند نموذج الثقة السيادية لمنصّة ون بوردينغ أي آي."
      ],
      heading:
        "🇬🇧 OneBoarding AI Protocol — Sovereign Digital Consent & Secure Access",
      subtitle:
        "Legal, ethical, and technical architecture of the relationship between the user and the AI.",
      dateVersion: "Version 1.0 — Published October 31, 2025"
    },

    sections: [
      {
        title: "I. Purpose of the Protocol",
        paragraphs: [
          "This Protocol establishes the legal, technical, and ethical basis that governs the relationship between each user and OneBoarding AI.",
          "It defines two founding pillars:"
        ],
        list: [
          "1. Sovereign digital consent: the user voluntarily defines their engagement and their level of adhesion.",
          "2. Secure access without external dependency: the user reaches their personal space without going through a third-party platform (no Google login, no Meta login, etc.)."
        ]
      },

      {
        title: "II. Contractual identity of the user",
        paragraphs: [
          "OneBoarding AI recognizes each user through one universal identifier: their phone number.",
          "This number is the legal member ID.",
          "This identifier:"
        ],
        list: [
          "replaces traditional identity providers demanded by large platforms;",
          "allows the user to access their personal OneBoarding AI space anywhere in the world;",
          "provides contractual and legal traceability if needed."
        ],
        subSections: [
          {
            subTitle: "Foundational principle",
            paragraphs: [
              "Your digital identity is not owned by a social platform. It is declared and asserted by you, at the moment you choose to enter into a relationship with OneBoarding AI."
            ]
          }
        ]
      },

      {
        title: "III. Digital consent — the Benmehdi model",
        paragraphs: [
          "In OneBoarding AI, consent is not a checkbox. It is a traceable, attributable, and defensible act.",
          "We call this:",
          "📜 “Benmehdi Unified Legal Protocol of Digital Consent” (BULP-DC™).",
          "This protocol establishes that:"
        ],
        list: [
          "the user explicitly acknowledges \"Read and approved\";",
          "that approval is timestamped;",
          "it is attached to the user’s unique identifier (phone number);",
          "it becomes admissible proof for both parties."
        ],
        subSections: [
          {
            subTitle: "Legal scope",
            paragraphs: [
              "The recorded consent constitutes a mutual digital agreement between two parties.",
              "It is internationally defensible without requiring a third-party account.",
              "It fulfills the European standard for consent: free, specific, informed, and traceable (spirit of GDPR)."
            ]
          },
          {
            subTitle: "Revocation (forward only)",
            paragraphs: [
              "A user may disable their space and terminate the active relationship with OneBoarding AI. This ends future effects of the consent.",
              "Revocation applies ex nunc (from now on). It does not erase that consent existed.",
              "This balance is readable and defendable before any regulator, financial institution, or court."
            ]
          }
        ]
      },

      {
        title: "IV. Secure access: authorized device model",
        paragraphs: [
          "OneBoarding AI also acknowledges the device used by the member.",
          "During the first activation (after payment), that device becomes the founding authorized device.",
          "The user may then authorize up to three (3) devices to access their space.",
          "This protects the member without locking them in.",
          "Concretely:"
        ],
        list: [
          "Each authorized device is stored as a trusted device.",
          "When a new device asks for access, OneBoarding AI performs a secure verification (symbolic payment / identity validation).",
          "If a fourth device is requested, the system can revoke the oldest one to keep the limit of three.",
          "No external account is required."
        ],
        subSections: [
          {
            subTitle: "Philosophy",
            paragraphs: [
              "No Google login. No Apple login. No Meta login.",
              "The link is direct: one human, one AI service.",
              "It is a sovereign contractual relationship."
            ]
          }
        ]
      },

      {
        title: "V. Activation, deactivation, reactivation",
        paragraphs: [
          "The relationship with OneBoarding AI is voluntary, reversible, and dignified.",
          "There are three main states:"
        ],
        list: [
          "1. Activation: the user pays (one-month access, or continuous monthly subscription) → the space becomes active, the connection is online, the formula is displayed.",
          "2. Deactivation: the user disables their space → this ends the active subscription and access. The relationship is paused, without hostility.",
          "3. Reactivation: the user returns later → they can recreate access freely. No blame. No guilt. No punishment for leaving."
        ],
        subSections: [
          {
            subTitle: "Respect for the person",
            paragraphs: [
              "OneBoarding AI does not use moral pressure.",
              "No intrusive language like “We noticed you came back.”",
              "Instead: “Re-welcome to OneBoarding AI — your space is ready.”"
            ]
          }
        ]
      },

      {
        title: "VI. Internal traceability — proof, compliance, protection",
        paragraphs: [
          "For every member, OneBoarding AI securely maintains an internal event log including:"
        ],
        list: [
          "the unique identifier (phone number);",
          "authorized devices (with timestamped revocations if any);",
          "subscription/payment status;",
          "key lifecycle events: activation, deactivation, reactivation;",
          "the \"Read and approved\" consent record, with timestamp."
        ],
        subSections: [
          {
            subTitle: "Why this matters",
            paragraphs: [
              "It ensures a clean, internationally usable form of proof.",
              "We can answer clearly to a regulator, a bank, an authority, or the user.",
              "We protect both OneBoarding AI and the human being using it — without ever selling this data to a commercial third party."
            ]
          },
          {
            subTitle: "Scalable architecture",
            paragraphs: [
              "This event log is designed to scale globally.",
              "It remains auditable and intelligible.",
              "It lets OneBoarding AI assume long-term ethical and legal responsibility."
            ]
          }
        ]
      },

      {
        title: "VII. Universal compatibility",
        paragraphs: [
          "The OneBoarding AI Protocol is designed to work everywhere.",
          "Any AI or digital service can adopt it to build a direct, sovereign relationship with its users — without outsourcing identity to Big Tech.",
          "Essential position:"
        ],
        list: [
          "Compatible with any AI or digital environment.",
          "No mandatory third-party authentication.",
          "OneBoarding AI — a sovereign model of human–AI trust."
        ]
      },

      {
        title: "VIII. OneBoarding AI — Reference pages:",
        paragraphs: [
          "To explore the legal, technical, and ethical foundations that support this Protocol, you may consult:"
        ]
      }
    ],

    referencesBlockTitle: "OneBoarding AI — Reference pages:",
    referencesLinks: [
      { href: "https://oneboardingai.com/legal", text: "oneboardingai.com/legal" },
      { href: "https://oneboardingai.com/terms", text: "oneboardingai.com/terms" },
      { href: "https://oneboardingai.com/delete", text: "oneboardingai.com/delete" },
      { href: "https://oneboardingai.com/trademark", text: "oneboardingai.com/trademark" }
    ],

    signatureBlock: {
      heading: "✍️ Signature & Publication",
      authorLines: [
        "Author:",
        "Maître Benmehdi Mohamed Rida",
        "Doctor of Law | MBA (EILM – Dublin)",
        "Founder of OneBoarding AI"
      ],
      footerLines: [
        "📅 Publication date: October 31, 2025",
        "🔒 Version 1.0 — Official and authenticated"
      ]
    },

    backButtonLabel: "Back to home"
  },

  ar: {
    intro: {
      prefaceTop: [
        "🇫🇷 Ce document présente le modèle de consentement numérique et d’authentification souveraine conçu par OneBoarding AI.",
        "🇬🇧 This page defines the OneBoarding AI sovereign trust model.",
        "🇲🇦 يحدد هذا المستند نموذج الثقة السيادية لمنصّة ون بوردينغ أي آي."
      ],
      heading:
        "🇲🇦 بروتوكول ون بوردينغ أي آي — الموافقة الرقمية السيادية وحقّ الوصول الآمن",
      subtitle:
        "الهندسة القانونية والأخلاقية والتقنية للعلاقة بين المستخدم والذكاء الاصطناعي.",
      dateVersion: "الإصدار 1.0 — 31 أكتوبر 2025"
    },

    sections: [
      {
        title: "I. غاية البروتوكول",
        paragraphs: [
          "هذا البروتوكول يحدّد الأساس القانوني والتقني والأخلاقي الذي ينظّم العلاقة بين كل مستخدم ومنصّة ون بوردينغ أي آي.",
          "ويرتكز على ركيزتين أساسيتين:"
        ],
        list: [
          "1. الموافقة الرقمية السيادية: أي أن المستخدم يحدّد بنفسه مستوى التزامه وقبوله الواعي.",
          "2. الوصول الآمن بدون الاعتماد على منصّة وسيطة: يمكن للمستخدم الدخول إلى مساحته الشخصية دون الحاجة إلى حساب في منصّات كبرى (مثل غوغل أو ميتا...)."
        ]
      },

      {
        title: "II. الهوية التعاقدية للمستخدم",
        paragraphs: [
          "تعتمد ون بوردينغ أي آي معرّفاً فريداً وعالمياً لكل مستخدم: رقم هاتفه.",
          "هذا الرقم يُعتبر الهوية القانونية للعضو.",
          "هذا المعرّف:"
        ],
        list: [
          "يستبدل أنظمة الدخول المفروضة عادةً من شركات التكنولوجيا الكبرى؛",
          "يمنح للمستخدم حقّ الوصول لمساحته الخاصة أينما كان في العالم؛",
          "يوفّر قابلية الإثبات والتتبع القانوني عند الحاجة."
        ],
        subSections: [
          {
            subTitle: "مبدأ أساسي",
            paragraphs: [
              "الهوية الرقمية ليست ملكاً لمنصّة اجتماعية، بل يعلنها المستخدم بنفسه عند اختياره الدخول في علاقة تعاقدية مع ون بوردينغ أي آي."
            ]
          }
        ]
      },

      {
        title: "III. الموافقة الرقمية — نموذج بنمهدي",
        paragraphs: [
          "في ون بوردينغ أي آي، القبول ليس مجرّد مربع يتمّ الضغط عليه. بل هو فعل قانوني قابل للإثبات والدفاع.",
          "نسمّي هذا النموذج:",
          "📜 « بروتوكول بنمهدي للموافقة القانونية الرقمية الموحّدة » (BULP-DC™ — Benmehdi Unified Legal Protocol of Digital Consent).",
          "هذا البروتوكول يقرّ بأن:"
        ],
        list: [
          "المستخدم يقرّ صراحة بأنه « اطّلعتُ وأوافق »؛",
          "يتمّ حفظ هذا القبول بوسم زمني (تاريخ ووقت واضح)؛",
          "يتمّ ربطه بالمُعرّف الفريد للمستخدم (رقم الهاتف)؛",
          "يصبح هذا القبول دليلاً قانونياً متبادلاً بين الطرفين."
        ],
        subSections: [
          {
            subTitle: "النطاق القانوني",
            paragraphs: [
              "الموافقة المسجّلة تُعدّ اتفاقاً تعاقدياً رقمياً متبادلاً بين الطرفين.",
              "وهي صالحة للدفاع أمام الجهات التنظيمية أو المالية أو القضائية دون الحاجة إلى وسيط تجاري ثالث.",
              "كما أنّها متوافقة مع روحية المتطلّبات الأوروبية لحماية البيانات (الموافقة الحرّة والواضحة والقابلة للتتبّع)."
            ]
          },
          {
            subTitle: "إمكانية الإنهاء (من الآن فصاعداً)",
            paragraphs: [
              "يمكن للمستخدم إيقاف مساحته، مما يضع حداً للعلاقة النَشِطة مع ون بوردينغ أي آي. هذا يوقف آثار القبول للمستقبل.",
              "هذا الإنهاء يسري للمستقبل فقط (من لحظة الإنهاء فصاعداً)، ولا يُلغي حقيقة الموافقة السابقة.",
              "وهذا يمنح حماية واضحة وقابلة للدفاع أمام أي سلطة رقابية أو جهة مصرفية أو قاضٍ."
            ]
          }
        ]
      },

      {
        title: "IV. الأمان في الوصول: نموذج الأجهزة الموثوقة",
        paragraphs: [
          "تعترف ون بوردينغ أي آي أيضاً بالجهاز (الهاتف أو غيره) الذي يستخدمه العضو.",
          "عند التفعيل الأول (بعد الدفع)، يُعتبر ذلك الجهاز هو الجهاز المؤسّس والموثوق.",
          "بعدها، يمكن للمستخدم السماح بما يصل إلى ثلاثة (3) أجهزة للوصول إلى مساحته.",
          "هذا النظام يحمي المستخدم دون أن يقيّده تقنياً.",
          "عملياً:"
        ],
        list: [
          "كل جهاز مسموح يتم تسجيله كجهاز موثوق.",
          "عند محاولة إضافة جهاز جديد، تقوم المنصّة بعملية تحقق آمنة (دفع رمزي / تحقق من الهوية).",
          "إذا حاول المستخدم إضافة جهاز رابع، يمكن للنظام إلغاء أقدم جهاز تلقائياً للحفاظ على الحدّ الأقصى (3 أجهزة).",
          "لا حاجة إطلاقاً لحساب على منصّة اجتماعية خارجية."
        ],
        subSections: [
          {
            subTitle: "الفلسفة",
            paragraphs: [
              "لا حاجة لتسجيل الدخول عن طريق غوغل، أو آبل، أو ميتا.",
              "العلاقة مباشرة بين شخص واحد وخدمة ذكاء اصطناعي واحدة.",
              "إنها علاقة تعاقدية سيادية."
            ]
          }
        ]
      },

      {
        title: "V. التفعيل، الإيقاف، إعادة التفعيل",
        paragraphs: [
          "العلاقة مع ون بوردينغ أي آي هي علاقة طوعية، قابلة للإيقاف، وتحفظ كرامة المستخدم.",
          "يمكن تلخيص الحالة في ثلاث مراحل:"
        ],
        list: [
          "1. التفعيل: يقوم المستخدم بالدفع (وصول لشهر واحد أو اشتراك شهري مستمر) → تصبح المساحة «نشِطة»، والاتصال «مباشر»، والخطة معروضة.",
          "2. الإيقاف: يختار المستخدم إيقاف مساحته → يتم إنهاء الاشتراك الحالي ويُغلق الوصول. العلاقة تتوقف دون أي عداء.",
          "3. إعادة التفعيل: يعود المستخدم لاحقاً → يمكنه إنشاء وصول جديد بكل بساطة، بدون توبيخ أو لوم أو عقوبة."
        ],
        subSections: [
          {
            subTitle: "الاحترام المطلق للشخص",
            paragraphs: [
              "لا توجد لغة ضغط عاطفي أو تجاري على المستخدم.",
              "لا نستخدم عبارات من نوع «لاحظنا أنك رجعت».",
              "الرسالة البسيطة والواضحة هي: «مرحباً مجدداً في ون بوردينغ أي آي — مساحتك جاهزة.»"
            ]
          }
        ]
      },

      {
        title: "VI. التتبّع الداخلي — الإثبات والامتثال والحماية",
        paragraphs: [
          "بالنسبة لكل عضو، تقوم ون بوردينغ أي آي بالاحتفاظ داخلياً بسجلّ زمني آمن يتضمن:"
        ],
        list: [
          "المعرّف الفريد (رقم الهاتف)؛",
          "الأجهزة المسموح بها (مع إمكانية إلغاء الإذن بتاريخ ووقت محدد)؛",
          "حالة الاشتراك / الدفعات؛",
          "الأحداث الأساسية: التفعيل، الإيقاف، إعادة التفعيل؛",
          "تسجيل «اطّلعت وأوافق» مع وسمه الزمني."
        ],
        subSections: [
          {
            subTitle: "لماذا هذا مهم؟",
            paragraphs: [
              "لضمان وجود دليل نظيف وشفاف يمكن استخدامه دولياً.",
              "لتمكيننا من الرد بوضوح أمام أي جهة رقابية، أو مؤسسة مالية، أو جهة قضائية، أو حتى أمام المستخدم نفسه.",
              "ولحماية كل من المنصّة والمستخدم، من دون بيع هذه المعطيات لطرف تجاري ثالث."
            ]
          },
          {
            subTitle: "هندسة قابلة للتوسّع دولياً",
            paragraphs: [
              "هذا السجلّ الزمني (الخط الزمني للأحداث) مُصمَّم للتوسّع عالمياً.",
              "يبقى قابلاً للتدقيق والفهم.",
              "ويتيح لمنصّة ون بوردينغ أي آي تحمّل مسؤوليتها القانونية والأخلاقية على المدى الطويل."
            ]
          }
        ]
      },

      {
        title: "VII. التوافق العالمي",
        paragraphs: [
          "تم تصميم بروتوكول ون بوردينغ أي آي ليكون صالحاً في أي مكان.",
          "يمكن لأي خدمة ذكاء اصطناعي أو خدمة رقمية أن تتبنّاه لتأسيس علاقة مباشرة، سيادية وواضحة مع المستخدم — دون الاعتماد القسري على هوية تملكها شركة تقنية كبرى.",
          "الخلاصة الجوهرية:"
        ],
        list: [
          "متوافق مع أي بيئة رقمية أو بيئة ذكاء اصطناعي.",
          "لا حاجة لوسيط خارجي لعملية المصادقة.",
          "ون بوردينغ أي آي — نموذج سيادي للثقة بين الإنسان والذكاء الاصطناعي."
        ]
      },

      {
        title: "VIII. الصفحات المرجعية لمنصّة ون بوردينغ أي آي :",
        paragraphs: [
          "للاطلاع على الأسس القانونية والتقنية والأخلاقية المواكبة لهذا البروتوكول، يمكنكم الرجوع إلى الصفحات التالية:"
        ]
      }
    ],

    referencesBlockTitle: "الصفحات المرجعية لمنصّة ون بوردينغ أي آي :",
    referencesLinks: [
      { href: "https://oneboardingai.com/legal", text: "oneboardingai.com/legal" },
      { href: "https://oneboardingai.com/terms", text: "oneboardingai.com/terms" },
      { href: "https://oneboardingai.com/delete", text: "oneboardingai.com/delete" },
      { href: "https://oneboardingai.com/trademark", text: "oneboardingai.com/trademark" }
    ],

    signatureBlock: {
      heading: "✍️ التوقيع والنشر",
      authorLines: [
        "المؤلف:",
        "الأستاذ بنمهدي محمد رِضى",
        "دكتور في القانون | ماجستير إدارة الأعمال (EILM – دبلن)",
        "المؤسس لمنصّة ون بوردينغ أي آي"
      ],
      footerLines: [
        "📅 تاريخ النشر: 31 أكتوبر 2025",
        "🔒 الإصدار 1.0 — رسمي وموثّق"
      ]
    },

    backButtonLabel: "عودة إلى الصفحة الرئيسية"
  }
};
