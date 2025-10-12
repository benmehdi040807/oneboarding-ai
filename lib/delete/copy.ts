// lib/delete/copy.ts
export type Lang = "fr" | "en" | "ar";

export type Section =
  | { kind: "p"; text?: string; html?: string }
  | { kind: "ul"; items: string[] }
  | { kind: "hr" };

export type Copy = {
  title: string;
  sections: Section[];
  footer: { updated: string; rights: string };
};

const COPY: Record<Lang, Copy> = {
  fr: {
    title: "Suppression des données — OneBoarding AI",
    sections: [
      {
        kind: "p",
        text:
          "OneBoarding AI ne collecte ni ne conserve de données personnelles. L’historique et les consentements sont stockés localement sur l’appareil de l’utilisateur, sous son seul contrôle.",
      },
      {
        kind: "p",
        html:
          'Pour supprimer vos données locales, cliquez sur le bouton <strong>« Effacer l’historique »</strong> disponible dans l’interface de l’application.',
      },
      {
        kind: "p",
        text:
          "Si vous avez partagé des informations dans le cadre d’un échange technique ou administratif, vous pouvez aussi demander leur suppression en contactant la personne autorisée :",
      },
      {
        kind: "ul",
        items: [
          "Nom : Benmehdi Mohamed Rida",
          "E-mail : office.benmehdi@gmail.com",
          "Adresse : Casablanca, Maroc",
        ],
      },
      {
        kind: "p",
        html:
          'Pour plus d’informations, consultez notre <a href="/legal" class="underline text-blue-700 hover:text-blue-900">Politique de confidentialité complète</a>.',
      },
      { kind: "hr" },
    ],
    footer: {
      updated: "Dernière mise à jour : Octobre 2025 — Version 1.0.",
      rights: "© OneBoarding AI. Tous droits réservés.",
    },
  },

  en: {
    title: "Data Deletion — OneBoarding AI",
    sections: [
      {
        kind: "p",
        text:
          "OneBoarding AI does not collect or retain personal data. Your history and consents are stored locally on your device under your sole control.",
      },
      {
        kind: "p",
        html:
          'To delete your local data, click the <strong>“Clear history”</strong> button available in the app interface.',
      },
      {
        kind: "p",
        text:
          "If you shared information during a technical or administrative exchange, you may also request deletion by contacting the authorized person:",
      },
      {
        kind: "ul",
        items: [
          "Name: Benmehdi Mohamed Rida",
          "E-mail: office.benmehdi@gmail.com",
          "Address: Casablanca, Morocco",
        ],
      },
      {
        kind: "p",
        html:
          'For more details, see our <a href="/legal?lang=en" class="underline text-blue-700 hover:text-blue-900">full Privacy Policy</a>.',
      },
      { kind: "hr" },
    ],
    footer: {
      updated: "Last updated: October 2025 — Version 1.0.",
      rights: "© OneBoarding AI. All rights reserved.",
    },
  },

  ar: {
    title: "حذف البيانات — OneBoarding AI",
    sections: [
      {
        kind: "p",
        text:
          "لا يجمع OneBoarding AI بيانات شخصية ولا يحتفظ بها. يتم حفظ السجلّ والموافقات محليًا على جهازك وتحت تحكّمك الكامل.",
      },
      {
        kind: "p",
        html:
          'لحذف بياناتك المحليّة، استخدم زر <strong>«حذف السجل»</strong> داخل واجهة التطبيق.',
      },
      {
        kind: "p",
        text:
          "إذا كنت قد شاركت معلومات في إطار تواصل تقني أو إداري، يمكنك طلب حذفها بالتواصل مع الشخص المصرّح له:",
      },
      {
        kind: "ul",
        items: [
          "الاسم: بنمهدي محمد رضى",
          "البريد الإلكتروني: office.benmehdi@gmail.com",
          "العنوان: الدار البيضاء، المغرب",
        ],
      },
      {
        kind: "p",
        html:
          'لمزيد من المعلومات، راجع <a href="/legal?lang=ar" class="underline text-blue-700 hover:text-blue-900">سياسة الخصوصية الكاملة</a>.',
      },
      { kind: "hr" },
    ],
    footer: {
      updated: "آخر تحديث: أكتوبر 2025 — الإصدار 1.0.",
      rights: "© OneBoarding AI. جميع الحقوق محفوظة.",
    },
  },
};

export function deleteCopyFor(lang: Lang): Copy {
  if (lang === "en" || lang === "ar") return COPY[lang];
  return COPY.fr;
}

export { COPY };
