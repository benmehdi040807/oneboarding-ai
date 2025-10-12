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
    title: "Conditions Générales — OneBoarding AI",
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
          "Limitation : pas de responsabilité pour dommages indirects (perte de profit, données, etc.), dans les limites de la loi et dans l’esprit d’agir en bon père de famille, c’est-à-dire avec diligence et responsabilité raisonnable.",
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
    ],
    version: {
      h: "Version & mises à jour",
      v: "Version 1.0 — Octobre 2025",
      note: "Un changelog discret indiquera les évolutions futures.",
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
          "Limitation: no liability for indirect damages (loss of profit, data, etc.), to the extent allowed by law and guided by reasonable diligence and responsibility.",
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
          "Processors: routing of AI requests with no advertising sale/sharing of personal data.",
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
          "حدود المسؤولية: لا مسؤولية عن الأضرار غير المباشرة ضمن حدود القانون وبما ينسجم مع واجب العناية والمسؤولية المعقولة.",
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
          "معالِجون تقنيون: تمرير الطلبات دون بيع/مشاركة إعلانية للبيانات الشخصية.",
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
          "مَن يشغّل OneBoarding AI؟ — من تصميم وتطوير <strong class=\"nowrap-ar\">بنمهدي محمد رضى</strong>. الرؤية: ذكاء واضح ومحترم للخصوصية ومتاح للجميع.",
        ],
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
