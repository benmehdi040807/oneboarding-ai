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
    title: "Suppression des données utilisateur — OneBoarding AI",
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
          "E-mail : support@oneboardingai.com",
        ],
      },

      { kind: "hr" },

      // ===== Assistance & Sécurité =====
      {
        kind: "p",
        html:
          '<strong>Assistance & Sécurité — Vol, perte ou indisponibilité de l’appareil autorisé</strong>',
      },
      {
        kind: "ul",
        items: [
          "Contact officiel : support@oneboardingai.com",
          "Objet : cas de vol, perte ou indisponibilité d’un appareil autorisé (device unique ou appareil principal).",
          "Demande écrite + pièce d’identité valide (passeport/CNI) du titulaire.",
          "Justificatif probant que le numéro de téléphone (ID_UNIQ_OB) appartenait bien au demandeur au moment de la souscription (ex. attestation/opérateur, contrat, facture ou équivalent).",
          "Examen et vérification : OneBoarding AI peut demander des compléments avant décision.",
          "Délai : traitement dans un délai raisonnable, avec réponse écrite de confirmation avant toute action côté système.",
          "Effet en cas d’acceptation : révocation du (ou des) appareil(s) autorisé(s) et désactivation de l’espace ; cette opération entraîne la résiliation automatique de l’abonnement actif et l’arrêt des prélèvements.",
          "À tout moment ultérieur, le membre pourra se réabonner avec le même numéro (ID_UNIQ_OB) et retrouver son espace identifié par ce même identifiant souverain.",
        ],
      },

      // ===== Désactivation volontaire =====
      {
        kind: "p",
        html:
          '<strong>Désactivation volontaire de l’espace</strong><br/>Vous pouvez désactiver votre espace à tout moment via <em>Menu → Mon espace → Désactiver mon espace</em>. Cette action entraîne immédiatement la résiliation de la formule souscrite et l’arrêt des prélèvements le cas échéant. Vous restez libre de revenir ultérieurement et de souscrire un nouveau plan avec le même numéro (ID_UNIQ_OB).',
      },

      { kind: "hr" },

      // ===== Liens complémentaires =====
      {
        kind: "p",
        html:
          'Pour toute information complémentaire, vous pouvez consulter :<br/>' +
          '<a href="https://oneboardingai.com/legal" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/legal</a><br/>' +
          '<a href="https://oneboardingai.com/terms" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/terms</a><br/>' +
          '<a href="https://oneboardingai.com/protocol" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/protocol</a><br/>' +
          '<a href="https://oneboardingai.com/trademark" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/trademark</a>',
      },
      { kind: "hr" },
    ],
    footer: {
      updated: "Dernière mise à jour : Octobre 2025 — Version 1.0.",
      rights: "© OneBoarding AI. Tous droits réservés.",
    },
  },

  en: {
    title: "User Data Deletion — OneBoarding AI",
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
          "E-mail: support@oneboardingai.com",
        ],
      },

      { kind: "hr" },

      // ===== Assistance & Security =====
      {
        kind: "p",
        html:
          '<strong>Assistance & Security — Stolen, lost, or unavailable authorized device</strong>',
      },
      {
        kind: "ul",
        items: [
          "Official contact: support@oneboardingai.com",
          "Scope: theft, loss, or unavailability of the authorized device (single or primary device).",
          "Written request + valid government ID (passport/ID card) of the subscriber.",
          "Conclusive proof that the phone number (ID_UNIQ_OB) belonged to the requester at the time of subscription (e.g., carrier certificate/contract/bill or equivalent).",
          "Verification: OneBoarding AI may request additional evidence before making a decision.",
          "Timeline: processed within a reasonable time; a written confirmation is sent before any system action.",
          "Effect if approved: revocation of the authorized device(s) and space deactivation; this operation results in the automatic termination of the active subscription and cessation of charges.",
          "At any later time, the member may subscribe again with the same number (ID_UNIQ_OB) and regain access to the same space identified by that sovereign identifier.",
        ],
      },

      // ===== Voluntary deactivation =====
      {
        kind: "p",
        html:
          '<strong>Voluntary space deactivation</strong><br/>You can deactivate your space at any time via <em>Menu → My account → Deactivate my space</em>. This immediately terminates the active plan and stops any charges. You remain free to return later and subscribe again with the same number (ID_UNIQ_OB).',
      },

      { kind: "hr" },

      // ===== Links =====
      {
        kind: "p",
        html:
          'For additional information, please consult:<br/>' +
          '<a href="https://oneboardingai.com/legal" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/legal</a><br/>' +
          '<a href="https://oneboardingai.com/terms?lang=en" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/terms</a><br/>' +
          '<a href="https://oneboardingai.com/protocol" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/protocol</a><br/>' +
          '<a href="https://oneboardingai.com/trademark" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/trademark</a>',
      },
      { kind: "hr" },
    ],
    footer: {
      updated: "Last updated: October 2025 — Version 1.0.",
      rights: "© OneBoarding AI. All rights reserved.",
    },
  },

  ar: {
    title: "حذف بيانات المستخدم — OneBoarding AI",
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
          "إذا كنت قد شاركت معلومات ضمن تواصل تقني أو إداري، يمكنك طلب حذفها بالتواصل مع الشخص المخوّل:",
      },
      {
        kind: "ul",
        items: [
          "الاسم: بنمهدي محمد رضى",
          "البريد الإلكتروني: support@oneboardingai.com",
        ],
      },

      { kind: "hr" },

      // ===== المساعدة والأمان =====
      {
        kind: "p",
        html:
          '<strong>المساعدة والأمان — فقدان أو سرقة الجهاز المُخوّل أو تعذّر الوصول إليه</strong>',
      },
      {
        kind: "ul",
        items: [
          "جهة الاتصال الرسمية: support@oneboardingai.com",
          "الحالات: السرقة، الفقدان، أو تعذّر استخدام الجهاز المُخوّل (الجهاز الوحيد أو الأساسي).",
          "طلب كتابي مرفق ببطاقة هوية سارية (جواز سفر/بطاقة وطنية) لصاحب الاشتراك.",
          "إثبات قاطع بأن رقم الهاتف (ID_UNIQ_OB) كان مملوكًا لصاحب الطلب وقت الاشتراك (مثل شهادة/عقد/فاتورة من شركة الاتصالات).",
          "التحقّق: قد يُطلب تقديم مستندات إضافية قبل اتخاذ القرار.",
          "المدة: معالجة خلال مهلة معقولة مع إرسال تأكيد كتابي قبل أي إجراء على النظام.",
          "الأثر عند القبول: إلغاء تخويل الجهاز/الأجهزة وتعطيل المساحة؛ ويترتّب على ذلك إنهاء الاشتراك النشط وإيقاف جميع السحوبات المالية فورًا.",
          "يمكن للمشترك لاحقًا إعادة الاشتراك بالرقم ذاته (ID_UNIQ_OB) واستعادة الوصول إلى مساحته المعرّفة بهذا المعرّف السيادي.",
        ],
      },

      // ===== التعطيل الطوعي =====
      {
        kind: "p",
        html:
          '<strong>التعطيل الطوعي للمساحة</strong><br/>يمكنك تعطيل مساحتك في أي وقت عبر <em>القائمة → حسابي → إيقاف مساحتي</em>. يؤدي ذلك مباشرة إلى إنهاء الخطة النشطة وإيقاف السحوبات. ويمكنك دائمًا العودة والاشتراك مجددًا بالرقم نفسه (ID_UNIQ_OB).',
      },

      { kind: "hr" },

      // ===== روابط مفيدة =====
      {
        kind: "p",
        html:
          'للمزيد من المعلومات، يُمكنكم الاطّلاع على:<br/>' +
          '<a href="https://oneboardingai.com/legal" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/legal</a><br/>' +
          '<a href="https://oneboardingai.com/terms?lang=ar" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/terms</a><br/>' +
          '<a href="https://oneboardingai.com/protocol" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/protocol</a><br/>' +
          '<a href="https://oneboardingai.com/trademark" class="underline text-blue-700 hover:text-blue-900">oneboardingai.com/trademark</a>',
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
