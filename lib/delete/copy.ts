// lib/delete/copy.ts

export type Lang = "fr" | "en" | "ar";

export const COPY: Record<Lang, any> = {
  fr: {
    title: "Suppression des données — OneBoarding AI",
    description:
      "Instructions officielles pour la suppression des données utilisateur, conformément à la Politique de confidentialité de OneBoarding AI.",
    sections: [
      {
        kind: "p",
        text: "OneBoarding AI ne collecte ni ne conserve de données personnelles. L’historique et les consentements sont stockés localement sur l’appareil de l’utilisateur, sous son seul contrôle.",
      },
      {
        kind: "p",
        text: "Pour supprimer vos données locales, cliquez sur le bouton « Effacer l’historique » disponible dans l’interface de l’application.",
      },
      {
        kind: "p",
        text: "Si vous avez partagé des informations dans le cadre d’un échange technique ou administratif, vous pouvez également demander leur suppression en contactant la personne autorisée :",
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
        html: 'Pour plus d’informations, veuillez consulter notre <a href="/legal" class="underline text-blue-700 hover:text-blue-900">Politique de confidentialité complète</a>.',
      },
      {
        kind: "p",
        text: "Dernière mise à jour : Octobre 2025 — Version 1.0. © OneBoarding AI. Tous droits réservés.",
      },
    ],
  },

  en: {
    title: "Data Deletion — OneBoarding AI",
    description:
      "Official instructions for user data deletion, in compliance with OneBoarding AI’s Privacy Policy.",
    sections: [
      {
        kind: "p",
        text: "OneBoarding AI does not collect or retain any personal data. History and consent preferences are stored locally on the user’s device, under their full control.",
      },
      {
        kind: "p",
        text: "To delete your local data, click the “Clear history” button available in the application interface.",
      },
      {
        kind: "p",
        text: "If you have shared any information as part of a technical or administrative exchange, you may also request its deletion by contacting the authorized person:",
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
        html: 'For more details, please refer to our <a href="/legal" class="underline text-blue-700 hover:text-blue-900">Full Privacy Policy</a>.',
      },
      {
        kind: "p",
        text: "Last updated: October 2025 — Version 1.0. © OneBoarding AI. All rights reserved.",
      },
    ],
  },

  ar: {
    title: "حذف البيانات — OneBoarding AI",
    description:
      "التعليمات الرسمية لحذف بيانات المستخدم، وفقًا لسياسة الخصوصية الخاصة بمنصة OneBoarding AI.",
    sections: [
      {
        kind: "p",
        text: "لا تقوم منصة OneBoarding AI بجمع أو تخزين أي بيانات شخصية. يتم حفظ السجل والموافقات محليًا على جهاز المستخدم وتحت سيطرته الكاملة.",
      },
      {
        kind: "p",
        text: "لحذف بياناتك المحلية، انقر على زر «مسح السجل» المتاح ضمن واجهة التطبيق.",
      },
      {
        kind: "p",
        text: "إذا كنت قد شاركت أي معلومات في إطار تواصل تقني أو إداري، يمكنك أيضًا طلب حذفها عبر الاتصال بالشخص المخوّل:",
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
        html: 'لمزيد من المعلومات، يرجى الاطلاع على <a href="/legal" class="underline text-blue-700 hover:text-blue-900">سياسة الخصوصية الكاملة</a>.',
      },
      {
        kind: "p",
        text: "آخر تحديث: أكتوبر 2025 — الإصدار 1.0. © OneBoarding AI. جميع الحقوق محفوظة.",
      },
    ],
  },
};
