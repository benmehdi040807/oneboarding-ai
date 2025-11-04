// lib/legal/copy.ts

export type Lang = "fr" | "en" | "ar";

export type Section =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string; html?: boolean }
  | { kind: "ul"; items: string[] }
  | { kind: "hr" };

export type Copy = {
  title: string;
  sections: Section[];
  version: { h: string; v: string; note: string };
};

const COPY: Record<Lang, Copy> = {
  fr: {
    title: "Informations légales",
    sections: [
      { kind: "h2", text: "🌍 Manifeste de Confiance – OneBoarding AI" },
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
          "⚖️ Équilibre : moyens raisonnables côté éditeur, responsabilité d’usage côté utilisateur.",
          "🤝 Confiance & transparence : confidentialité, respect mutuel et bonne foi.",
        ],
      },
      { kind: "hr" },
      { kind: "h2", text: "Conditions Générales d’Utilisation (CGU)" },
      { kind: "p", text: "1) Objet : assistance alimentée par IA, aide à la décision." },
      {
        kind: "p",
        text:
          "2) Responsabilité de l’utilisateur : les contenus générés ne constituent pas des conseils professionnels personnalisés. Vérifications requises avant toute décision engageante.",
      },
      {
        kind: "p",
        text:
          "3) Indemnisation : l’utilisateur indemnise OneBoarding AI en cas d’usage non conforme ou violation de droits.",
      },
      {
        kind: "p",
        text:
          "4) Limitation de responsabilité : dans les limites légales, pas de responsabilité pour dommages indirects (perte de profit, données, etc.).",
      },
      {
        kind: "p",
        text: "5) Exceptions : sans préjudice des droits impératifs des consommateurs.",
      },
      { kind: "hr" },
      { kind: "h2", text: "Politique de Confidentialité" },
      {
        kind: "ul",
        items: [
          "Stockage local : historique et consentements enregistrés uniquement sur votre appareil.",
          "Sous-traitants techniques : acheminement des requêtes IA sans conservation ni corrélation d’identité personnelle.",
          "Statistiques : mesures agrégées et anonymisées destinées à améliorer le service.",
          "Effacement : suppression possible à tout moment des données locales.",
        ],
      },
      { kind: "hr" },
      { kind: "h2", text: "Qui sommes-nous" },
      {
        kind: "p",
        text:
          "OneBoarding AI est conçu, développé et dirigé par Benmehdi Mohamed Rida, avec pour vocation de rendre l’IA simple, rapide et universelle.",
      },
    ],
    version: {
      h: "Version & Mises à jour",
      v: "Version 1.0.0 — Octobre 2025",
      note: "Un changelog indiquera les évolutions futures.",
    },
  },

  en: {
    title: "Legal Information",
    sections: [
      { kind: "h2", text: "🌍 Trust Manifesto – OneBoarding AI" },
      {
        kind: "p",
        text:
          "OneBoarding AI is an interactive AI platform designed to offer every user an educational and enriching experience.",
      },
      {
        kind: "ul",
        items: [
          "🛡️ Clarity & safety: users remain in control and responsible for their choices.",
          "🌐 Universality: respect for public-order rules in each country.",
          "⚖️ Balance: reasonable means on the publisher’s side, responsible use on the user’s side.",
          "🤝 Trust & transparency: confidentiality, mutual respect, and good faith.",
        ],
      },
      { kind: "hr" },
      { kind: "h2", text: "Terms of Use" },
      { kind: "p", text: "1) Purpose: AI-powered assistance, decision support." },
      {
        kind: "p",
        text:
          "2) User responsibility: generated content does not constitute personalized professional advice. Verification required before any binding decision.",
      },
      {
        kind: "p",
        text:
          "3) Indemnification: users hold OneBoarding AI harmless in case of misuse or rights violations.",
      },
      {
        kind: "p",
        text:
          "4) Limitation of liability: within legal limits, no liability for indirect damages (loss of profit, data, etc.).",
      },
      {
        kind: "p",
        text: "5) Exceptions: without prejudice to mandatory consumer rights.",
      },
      { kind: "hr" },
      { kind: "h2", text: "Privacy Policy" },
      {
        kind: "ul",
        items: [
          "Local storage: history and consents remain on the user’s device only.",
          "Technical processors: routing of AI requests without personal identity linkage or storage.",
          "Statistics: aggregated and anonymized metrics to improve the service.",
          "Erasure: users can delete local data at any time.",
        ],
      },
      { kind: "hr" },
      { kind: "h2", text: "About" },
      {
        kind: "p",
        text:
          "OneBoarding AI was conceived, developed, and authored by Benmehdi Mohamed Rida, aiming to make AI simple, fast, and universal.",
      },
    ],
    version: {
      h: "Version & Updates",
      v: "Version 1.0.0 — October 2025",
      note: "A changelog will indicate future evolutions.",
    },
  },

  ar: {
    title: "معلومات قانونية",
    sections: [
      { kind: "h2", text: "🌍 بيان الثقة – OneBoarding AI" },
      {
        kind: "p",
        text:
          "منصّة OneBoarding AI منصّة ذكاءٍ اصطناعيٍّ تفاعلية تهدف إلى تقديم تجربة تعليمية مُثرية لكل مستخدم.",
      },
      {
        kind: "ul",
        items: [
          "🛡️ الوضوح والأمان: يبقى المستخدم متحكّمًا ومسؤولًا عن اختياراته.",
          "🌐 العالمية: احترام قواعد النظام العام في كل بلد.",
          "⚖️ التوازن: وسائل معقولة من الناشر، ومسؤولية الاستخدام على عاتق المستخدم.",
          "🤝 الثقة والشفافية: سرّية واحترام متبادل وحسن نية.",
        ],
      },
      { kind: "hr" },
      { kind: "h2", text: "شروط الاستخدام" },
      { kind: "p", text: "1) الهدف: مساعدة قائمة على الذكاء الاصطناعي ودعم اتخاذ القرار." },
      {
        kind: "p",
        text:
          "2) مسؤولية المستخدم: المحتوى المُولَّد لا يُعتبر استشارة مهنية مُخصَّصة. يلزم التحقّق قبل أي قرار مُلزِم.",
      },
      {
        kind: "p",
        text:
          "3) التعويض: يُعفى OneBoarding AI من المسؤولية عند الاستعمال غير المتوافق أو انتهاك الحقوق.",
      },
      {
        kind: "p",
        text:
          "4) تحديد المسؤولية: في حدود القانون، لا مسؤولية عن الأضرار غير المباشرة (الأرباح، البيانات، الأعمال…).",
      },
      { kind: "p", text: "5) الاستثناءات: دون المساس بحقوق المستهلك الإلزامية." },
      { kind: "hr" },
      { kind: "h2", text: "سياسة الخصوصية" },
      {
        kind: "ul",
        items: [
          "تخزين محلي: السجلّ والموافقات محفوظة فقط على جهاز المستخدم.",
          "معالِجون تقنيون: تمرير الطلبات دون حفظٍ أو ربطٍ بالهوية الشخصية.",
          "إحصاءات مُجهَّلة: قياسات مُجمَّعة لتحسين الخدمة.",
          "الحذف: يمكنك حذف البيانات المحليّة في أي وقت.",
        ],
      },
      { kind: "hr" },
      { kind: "h2", text: "من نحن" },
      {
        kind: "p",
        html: true,
        text:
          'تم ابتكار وتطوير OneBoarding AI من طرف <strong class="nowrap-ar">بنمهدي محمد رضى</strong>، بهدف جعل الذكاء الاصطناعي بسيطًا وسريعًا وعالميًا.',
      },
    ],
    version: {
      h: "الإصدار والتحديث",
      v: "الإصدار 1.0.0 — أكتوبر 2025",
      note: "سيُعرض سجلّ تغييرات للتحديثات القادمة.",
    },
  },
};

/** Helper: retourne la copie pour une langue donnée */
export function legalCopyFor(lang: Lang): Copy {
  if (lang === "en" || lang === "ar") return COPY[lang];
  return COPY.fr;
}

/** Exports nommés utiles côté UI */
export { COPY };
