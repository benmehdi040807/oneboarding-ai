"use client";
export const runtime = "nodejs";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import OcrUploader from "@/components/OcrUploader";

/* =================== i18n minimal pour le modal légal =================== */
type Lang = "fr" | "en" | "ar";

type LegalCopy = {
  title: string;
  buttons: { later: string; accept: string; close: string; openCta: string };
  manifest: { h: string; p: string; bullets: string[]; note: string };
  about: { h: string; lines: string[] };
  timeline: { h: string; items: string[]; signature: string };
  cgu: { h: string; items: string[] };
  privacy: { h: string; items: string[] };
  version: { h: string; lines: string[] };
  footer: string;
};

const legalCopy: Record<Lang, LegalCopy> = {
  fr: {
    title: "Manifeste / CGU / Privacy",
    buttons: {
      later: "Plus tard",
      accept: "J’accepte",
      close: "Fermer",
      openCta: "Manifeste / CGU / Privacy",
    },
    manifest: {
      h: "🌍 Manifeste de Confiance – OneBoarding AI",
      p: "OneBoarding AI est une plateforme d’intelligence artificielle interactive conçue pour offrir à chaque utilisateur une expérience pédagogique et enrichissante.",
      bullets: [
        "🛡️ Clarté et sécurité : l’utilisateur reste toujours maître de son usage et responsable de ses choix.",
        "🌐 Universalité : les principes qui gouvernent cette plateforme dépassent les frontières et respectent les règles d’ordre public de chaque pays.",
        "⚖️ Équilibre et responsabilité partagée : l’éditeur met en œuvre tous les moyens raisonnables pour assurer un service fiable, mais l’utilisateur conserve l’entière responsabilité de l’usage qu’il fait des informations fournies.",
        "🤝 Confiance et transparence : l’interaction entre l’intelligence artificielle et l’humain repose sur le respect mutuel, la confidentialité et une utilisation de bonne foi."
      ],
      note:
        "👉 Ce manifeste n’est pas un simple détail juridique : il est l’esprit fondateur qui inspire nos Conditions Générales d’Utilisation et notre Politique de Confidentialité."
    },
    about: {
      h: "Qui sommes-nous",
      lines: [
        "OneBoarding AI est une interface intelligente conçue pour faciliter l’interaction avec l’IA de façon simple, rapide et universelle.",
        "Créé et développé par Benmehdi Mohamed Rida.",
        "Notre mission : rendre l’intelligence artificielle accessible à tous, dans un cadre clair, élégant et respectueux de la confidentialité."
      ]
    },
    timeline: {
      h: "Timeline",
      items: [
        "2025 → Lancement de OneBoarding AI, avec une mission : simplifier l’IA.",
        "2026+ → Déploiement progressif de fonctionnalités avancées."
      ],
      signature:
        "✍️ Créé par Benmehdi Mohamed Rida — une vision unique au service de l’innovation."
    },
    cgu: {
      h: "Conditions Générales d’Utilisation (CGU)",
      items: [
        "1. Objet — OneBoarding AI fournit un service d’assistance basé sur l’intelligence artificielle permettant aux utilisateurs de formuler des requêtes et d’obtenir des réponses générées automatiquement (« Service »). Les présentes CGU régissent l’accès et l’utilisation du Service par tout utilisateur (« Utilisateur »).",
        "2. Responsabilité de l’Utilisateur — L’Utilisateur est seul responsable de l’usage qu’il fait des contenus (« Contenus »).",
        "   a) Les Contenus sont générés automatiquement et constituent une aide à la décision ; ils ne sauraient être considérés comme des conseils professionnels personnalisés. L’Utilisateur doit vérifier et, le cas échéant, consulter un professionnel compétent avant toute décision engageante.",
        "   b) OneBoarding AI et son exploitant ne sauraient être tenus responsables des conséquences directes ou indirectes liées à l’utilisation, l’interprétation, la diffusion ou la mise en œuvre des Contenus (y compris perte de revenus, de données, préjudice commercial, ou autre dommage).",
        "   c) L’Utilisateur s’engage à un usage légal et conforme ; il indemnisera OneBoarding AI en cas d’usage non conforme.",
        "3. Indemnisation — L’Utilisateur s’engage à indemniser, défendre et dégager de toute responsabilité OneBoarding AI, ses dirigeants, employés et ayants droit, pour toute réclamation liée (i) à un usage non conforme, (ii) à une violation des CGU, ou (iii) à une atteinte aux droits de tiers.",
        "4. Limitation de responsabilité — Dans toute la mesure permise par la loi, la responsabilité cumulée de OneBoarding AI envers l’Utilisateur est limitée et ne peut être engagée qu’au titre des règles d’ordre public, dans l’esprit d’agir en bon père de famille. Aucune responsabilité pour dommages indirects, spéciaux, punitifs ou accessoires (perte de profit, d’exploitation, ou de données).",
        "5. Exceptions — Les limitations ci-dessus ne s’appliquent pas lorsqu’elles contreviennent aux droits légaux impératifs reconnus aux consommateurs.",
        "6. Obligations de l’Utilisateur — (i) ne pas soumettre de contenus illicites/diffamatoires/contrefaisants ; (ii) sauvegarder ses données ; (iii) signaler toute faille ou usage frauduleux.",
        "7. Conservation et preuve — Des journaux (prompts, réponses, horodatage) peuvent être conservés à des fins de sécurité, d’amélioration du Service, et de preuve en cas de litige, conformément à la Politique de Confidentialité.",
        "Compétence — Juridiction du lieu de résidence de l’éditeur, sous réserve des règles d’ordre public applicables à l’utilisateur."
      ]
    },
    privacy: {
      h: "Politique de Confidentialité",
      items: [
        "• Stockage local : l’historique et les consentements sont conservés sur votre appareil.",
        "• Sous-traitants techniques : les requêtes IA transitent par des prestataires techniques agissant comme sous-traitants ; vos données personnelles ne sont ni vendues ni partagées à des fins publicitaires.",
        "• Monétisation : toute monétisation éventuelle concernera l’accès au service (abonnements, crédits, offres) et non la cession de vos données personnelles.",
        "• Statistiques anonymisées : nous pouvons utiliser des mesures agrégées et anonymisées (statistiques d’usage) pour améliorer le service, sans identifier les utilisateurs.",
        "• Effacement : vous pouvez supprimer vos données locales à tout moment via le bouton prévu à cet effet."
      ]
    },
    version: {
      h: "Version & Mise à jour",
      lines: [
        "Version 1.0 — Septembre 2025",
        "Un changelog discret indiquera les futures évolutions (ex. monétisation)."
      ]
    },
    footer:
      "En acceptant, vous reconnaissez avoir pris connaissance de ces informations. Les règles d’ordre public du pays de l’utilisateur demeurent applicables de plein droit."
  },

  en: {
    title: "Manifesto / Terms / Privacy",
    buttons: {
      later: "Later",
      accept: "I accept",
      close: "Close",
      openCta: "Manifesto / Terms / Privacy",
    },
    manifest: {
      h: "🌍 Trust Manifesto – OneBoarding AI",
      p: "OneBoarding AI is an interactive AI platform designed to offer every user a pedagogical and enriching experience.",
      bullets: [
        "🛡️ Clarity & safety: the user remains in full control of their usage and responsible for their choices.",
        "🌐 Universality: the principles governing this platform transcend borders and respect the public-order rules of each country.",
        "⚖️ Balance & shared responsibility: the publisher uses reasonable efforts to provide a reliable service, while the user retains full responsibility for how information is used.",
        "🤝 Trust & transparency: human–AI interaction relies on mutual respect, confidentiality and good-faith use."
      ],
      note:
        "👉 This manifesto is not a mere legal detail: it is the founding spirit that guides our Terms of Use and Privacy Policy."
    },
    about: {
      h: "About",
      lines: [
        "OneBoarding AI is a smart interface that makes interacting with AI simple, fast and universal.",
        "Created and developed by Benmehdi Mohamed Rida.",
        "Our mission: make AI accessible to everyone, within a clear, elegant and privacy-respectful framework."
      ]
    },
    timeline: {
      h: "Timeline",
      items: [
        "2025 → OneBoarding AI launch, with a mission: simplify AI.",
        "2026+ → Progressive roll-out of advanced features."
      ],
      signature:
        "✍️ Created by Benmehdi Mohamed Rida — a unique vision in the service of innovation."
    },
    cgu: {
      h: "Terms of Use (ToU)",
      items: [
        "1. Purpose — OneBoarding AI provides an AI-based assistance service enabling users to submit queries and receive automatically generated answers (“Service”). These ToU govern access to and use of the Service by any user (“User”).",
        "2. User Responsibility — The User is solely responsible for their use of the content (“Content”).",
        "   a) Content is automatically generated and serves as decision support; it is not personalised professional advice. The User must verify and, where appropriate, consult a qualified professional before any binding decision.",
        "   b) OneBoarding AI and its operator shall not be liable for direct or indirect consequences arising from use, interpretation, sharing or implementation of the Content (including loss of revenue, data, business, or other damage).",
        "   c) The User commits to lawful and compliant use and shall indemnify OneBoarding AI in case of non-compliant use.",
        "3. Indemnification — The User agrees to indemnify, defend and hold harmless OneBoarding AI, its officers, employees and successors from any claim arising from (i) non-compliant use, (ii) breach of the ToU, or (iii) infringement of third-party rights.",
        "4. Liability Cap — To the fullest extent permitted by law, OneBoarding AI’s aggregate liability to the User is limited and can only arise under mandatory public-order rules; no liability for indirect, special, punitive or incidental damages (including lost profits, business or data).",
        "5. Exceptions — The above limitations do not apply where they would contravene mandatory consumer rights.",
        "6. User Duties — (i) do not submit unlawful/defamatory/infringing content; (ii) take reasonable steps to back up data; (iii) promptly report any fraud or security incident.",
        "7. Logs & Evidence — Interaction logs (prompts, answers, timestamps) may be retained for security, service improvement and evidentiary purposes, in line with the Privacy Policy.",
        "Jurisdiction — Courts of the publisher’s place of residence, subject to public-order rules applicable to the user."
      ]
    },
    privacy: {
      h: "Privacy Policy",
      items: [
        "• Local storage: history and consents are kept on your device.",
        "• Technical processors: AI requests transit through technical providers acting as processors; your personal data is neither sold nor shared for advertising purposes.",
        "• Monetisation: any future monetisation will concern access to the service (subscriptions, credits, offers) and not the transfer of your personal data.",
        "• Anonymous statistics: we may use aggregated, anonymised usage metrics to improve the service without identifying users.",
        "• Erasure: you can delete your local data at any time via the dedicated button."
      ]
    },
    version: {
      h: "Version & Updates",
      lines: [
        "Version 1.0 — September 2025",
        "A discreet changelog will indicate future evolutions (e.g., monetisation)."
      ]
    },
    footer:
      "By accepting, you acknowledge that you have taken note of this information. The public-order rules of the user’s country remain applicable as of right."
  },

  ar: {
    title: "البيان / الشروط / الخصوصية",
    buttons: {
      later: "لاحقًا",
      accept: "أوافق",
      close: "إغلاق",
      openCta: "البيان / الشروط / الخصوصية",
    },
    manifest: {
      h: "🌍 بيان الثقة – OneBoarding AI",
      p: "OneBoarding AI منصّة ذكاء اصطناعي تفاعلية تهدف إلى تقديم تجربة تعليمية مُثرية لكل مستخدم.",
      bullets: [
        "🛡️ الوضوح والأمان: يظلّ المستخدم دائمًا المتحكّم في استعماله والمسؤول عن اختياراته.",
        "🌐 العالمية: المبادئ التي تحكم هذه المنصّة تتجاوز الحدود وتحترم قواعد النظام العام في كل بلد.",
        "⚖️ التوازن والمسؤولية المشتركة: يعتمد الناشر وسائل معقولة لتقديم خدمة موثوقة، بينما يبقى المستخدم مسؤولًا بالكامل عن كيفية استخدام المعلومات.",
        "🤝 الثقة والشفافية: تقوم العلاقة بين الذكاء الاصطناعي والإنسان على الاحترام المتبادل والسرّية وحسن النية."
      ],
      note:
        "👉 هذا البيان ليس تفصيلًا قانونيًا فحسب؛ بل هو الروح المؤسسة التي تُلهم شروط الاستخدام وسياسة الخصوصية."
    },
    about: {
      h: "من نحن",
      lines: [
        "OneBoarding AI واجهة ذكيّة لتيسير التفاعل مع الذكاء الاصطناعي بطريقة بسيطة وسريعة وعالمية.",
        "صُمّمت وطُوِّرت من طرف <strong class=\"nowrap-ar\">بنمهدي محمد رضى</strong>.",
        "مهمّتنا: جعل الذكاء الاصطناعي في متناول الجميع ضمن إطار واضح وأنيق ويحترم الخصوصية."
      ]
    },
    timeline: {
      h: "الخط الزمني",
      items: [
        "2025 → إطلاق OneBoarding AI مع مهمّة: تبسيط الذكاء الاصطناعي.",
        "2026+ → طرح تدريجي لخصائص متقدّمة."
      ],
      signature:
        "✍️ صُمّم من طرف <strong class=\"nowrap-ar\">بنمهدي محمد رضى</strong> — رؤية فريدة في خدمة الابتكار."
    },
    cgu: {
      h: "شروط الاستخدام",
      items: [
        "1. الغرض — يوفّر OneBoarding AI خدمة مساعدة قائمة على الذكاء الاصطناعي لطرح الاستفسارات والحصول على ردود مُولّدة آليًا («الخدمة»). تحكم هذه الشروط وصول كل مستخدم («المستخدم») إلى الخدمة واستعمالها.",
        "2. مسؤولية المستخدم — يتحمّل المستخدم وحده مسؤولية استعمال المحتوى («المحتوى»).",
        "   أ) يُعدّ المحتوى مساعدة على اتخاذ القرار ولا يُعدّ نصيحة مهنية شخصية. يجب على المستخدم التحقّق واستشارة مختص عند الحاجة قبل أي قرار مُلزِم.",
        "   ب) لا يتحمّل OneBoarding AI أو مشغّله أي مسؤولية عن النتائج المباشرة أو غير المباشرة لاستعمال أو تفسير أو مشاركة أو تنفيذ المحتوى (بما في ذلك خسارة الأرباح أو البيانات أو الضرر التجاري).",
        "   ج) يلتزم المستخدم باستعمالٍ قانوني ومتوافق ويعوض المنصّة عن أي استعمال غير متوافق.",
        "3. التعويض — يلتزم المستخدم بتعويض والدفاع وإبراء ذمة OneBoarding AI وموظّفيه وخلفائه من أي مطالبات ناجمة عن (i) استعمال غير متوافق، (ii) مخالفة الشروط، (iii) انتهاك حقوق الغير.",
        "4. حدود المسؤولية — في الحدود التي يسمح بها القانون، تُحدّد المسؤولية الإجمالية لـ OneBoarding AI ولا تقوم إلا بموجب قواعد النظام العام؛ ولا مسؤولية عن الأضرار غير المباشرة أو الخاصة أو التأديبية أو العرضية (بما في ذلك فقدان الأرباح أو الأعمال أو البيانات).",
        "5. الاستثناءات — لا تسري الحدود أعلاه إذا تعارضت مع الحقوق القانونية الواجبة للمستهلكين.",
        "6. التزامات المستخدم — (1) عدم تقديم محتوى غير مشروع/قدحي/منتهِك للحقوق؛ (2) اتخاذ تدابير معقولة لنسخ البيانات احتياطيًا؛ (3) الإبلاغ فورًا عن أي احتيال أو ثغرة.",
        "7. الاحتفاظ والإثبات — يجوز الاحتفاظ بسجلات التفاعل (المدخلات، الردود، الطوابع الزمنية) لأغراض الأمان وتحسين الخدمة والإثبات، وفق سياسة الخصوصية.",
        "الاختصاص — محاكم موطن الناشر، مع مراعاة قواعد النظام العام المطبقة على المستخدم."
      ]
    },
    privacy: {
      h: "سياسة الخصوصية",
      items: [
        "• تخزين محلي: يُحفَظ السجلّ والموافقات على جهازك.",
        "• معالِجون تقنيون: تمرّ الطلبات عبر مزوّدي خدمات تقنيين بصفتهم «معالِجين للبيانات»؛ لا تُباع بياناتك الشخصية ولا تُشارك لأغراض إعلانية.",
        "• تحقيق الدخل: أي ربح مستقبلي سيكون متعلقًا بالوصول إلى الخدمة (اشتراكات، أرصدة، عروض) وليس بالتنازل عن بياناتك الشخصية.",
        "• إحصاءات مُجهّلة: قد نستخدم مقاييس مُجمّعة ومجهولة الهوية لتحسين الخدمة دون التعرّف على المستخدمين.",
        "• الحذف: يمكنك حذف بياناتك المحلية في أي وقت عبر الزر المخصص."
      ]
    },
    version: {
      h: "الإصدار والتحديث",
      lines: [
        "الإصدار 1.0 — شتنبر/سبتمبر 2025",
        "سيعرض سجلّ تغييرات مُصغّر التحديثات المستقبلية (مثل تحقيق الدخل)."
      ]
    },
    footer:
      "بقبولك، فإنك تقرّ بأنك اطّلعت على هذه المعلومات. تظلّ قواعد النظام العام في بلد المستخدم قابلة للتطبيق بحكم القانون."
  }
};
/* =================== Modal Légal (Manifeste + CGU + Privacy + Version) =================== */
function LegalModal({
  open,
  onAccept,
  onClose,
}: {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [canAccept, setCanAccept] = useState(false);

  // Sélecteur de langue avec persistance locale
  const LANG_KEY = "oneboarding.legalLang";
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem(LANG_KEY) as Lang) || "fr";
    } catch {
      return "fr";
    }
  });
  const setLangPersist = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  };

  // Activation du bouton "J'accepte" seulement quand on a scrollé tout en bas
  useEffect(() => {
    if (!open) return;
    const el = boxRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
      setCanAccept(atBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  if (!open) return null;
  const t = legalCopy[lang];

  // Utilitaire pour rendre des lignes qui peuvent contenir un petit HTML (ex: <strong class="nowrap-ar">…</strong>)
  const Line = ({ text }: { text: string }) => (
    <p
      className="opacity-90"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-white shadow-xl"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{t.title}</h2>

          {/* Sélecteur de langue */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLangPersist("fr")}
              className={`px-2.5 py-1 rounded-lg text-sm ${
                lang === "fr" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
              }`}
              title="Français"
            >
              FR
            </button>
            <button
              onClick={() => setLangPersist("en")}
              className={`px-2.5 py-1 rounded-lg text-sm ${
                lang === "en" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setLangPersist("ar")}
              className={`px-2.5 py-1 rounded-lg text-sm ${
                lang === "ar" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
              }`}
              title="العربية"
            >
              AR
            </button>
          </div>

          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15">
            {t.buttons.close}
          </button>
        </div>

        {/* Contenu scrollable */}
        <div
          ref={boxRef}
          className="px-5 py-4 max-h-[70vh] overflow-y-auto text-[13.5px] leading-[1.35rem] space-y-6"
        >
          {/* Manifeste */}
          <section>
            <h3 className="font-semibold mb-1.5">{t.manifest.h}</h3>
            <Line text={t.manifest.p} />
            <ul className="list-disc pl-5 space-y-1.5 opacity-90 mt-2">
              {t.manifest.bullets.map((li, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: li }} />
              ))}
            </ul>
            <p className="mt-2 opacity-90">{t.manifest.note}</p>
          </section>

          {/* Qui sommes-nous / About */}
          <section>
            <h3 className="font-semibold mb-1.5">{t.about.h}</h3>
            <div className="space-y-1.5">
              {t.about.lines.map((line, i) => (
                <Line key={i} text={line} />
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h3 className="font-semibold mb-1.5">{t.timeline.h}</h3>
            <ul className="list-disc pl-5 space-y-1.5 opacity-90">
              {t.timeline.items.map((li, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: li }} />
              ))}
            </ul>
            <p
              className="mt-2 opacity-90"
              dangerouslySetInnerHTML={{ __html: t.timeline.signature }}
            />
          </section>

          {/* CGU */}
          <section>
            <h3 className="font-semibold mb-1.5">{t.cgu.h}</h3>
            <ul className="list-disc pl-5 space-y-1.5 opacity-90">
              {t.cgu.items.map((li, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: li }} />
              ))}
            </ul>
          </section>

          {/* Privacy */}
          <section>
            <h3 className="font-semibold mb-1.5">{t.privacy.h}</h3>
            <ul className="list-disc pl-5 space-y-1.5 opacity-90">
              {t.privacy.items.map((li, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: li }} />
              ))}
            </ul>
          </section>

          {/* Version */}
          <section>
            <h3 className="font-semibold mb-1.5">{t.version.h}</h3>
            <div className="space-y-1.5 opacity-90">
              {t.version.lines.map((line, i) => (
                <Line key={i} text={line} />
              ))}
            </div>
          </section>

          {/* Footer légal */}
          <p className="text-xs opacity-70">{t.footer}</p>
        </div>

        {/* Barre d’actions */}
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15"
          >
            {t.buttons.later}
          </button>
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className={`px-4 py-2 rounded-xl text-white transition ${
              canAccept ? "bg-[var(--accent)] hover:brightness-110" : "bg-white/10 cursor-not-allowed"
            }`}
            title={canAccept ? undefined : "Faites défiler jusqu’en bas pour activer"}
          >
            {t.buttons.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
/* =================== Bandeau RGPD (Manifeste / CGU / Privacy) =================== */
function RgpdBanner() {
  const CONSENT_KEY = "oneboarding.legalAccepted";
  const [show, setShow] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const hideAndNotify = () => {
    setOpenModal(false);
    setShow(false);
    try {
      window.dispatchEvent(new CustomEvent("oneboarding:legalBannerHidden"));
    } catch {}
  };

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {}
    hideAndNotify();
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto max-w-xl px-4">
          <div className="m-3 rounded-2xl border bg-[var(--chip-bg)] border-[var(--border)] backdrop-blur p-3 text-sm text-[var(--fg)]">
            <p className="mb-2">Vos données restent privées sur cet appareil.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setOpenModal(true)}
                className="px-3 py-2 rounded-xl bg-[var(--panel)] text-white font-medium"
              >
                Manifeste / CGU / Privacy
              </button>
              <button
                onClick={hideAndNotify}
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)]"
                title="Masquer et décider plus tard"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>

      <LegalModal open={openModal} onAccept={accept} onClose={() => setOpenModal(false)} />
    </>
  );
}

/* =================== Modal de confirmation (Effacer historique) =================== */
function ConfirmDialog({
  open,
  title = "Confirmer",
  description = "",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      const btn = dialogRef.current?.querySelector<HTMLButtonElement>(
        "button[data-autofocus='true']"
      );
      btn?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl text-white"
      >
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {description ? <p className="text-sm opacity-90 mb-4">{description}</p> : null}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            data-autofocus="true"
            className="px-4 py-2 rounded-xl bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== Styles globaux =================== */
function StyleGlobals() {
  return (
    <style jsx global>{`
      html,
      body,
      #__next {
        min-height: 100dvh;
        width: 100%;
        margin: 0;
        padding: 0;
        color: var(--fg);
        background: linear-gradient(180deg, #b3e5fc 0%, #e0f7fa 100%) fixed !important;
      }

      :root {
        --fg: #0b1b2b;
        --panel: rgba(12, 16, 28, 0.86);
        --panel-strong: rgba(12, 16, 28, 0.92);
        --panel-stronger: rgba(12, 16, 28, 0.98);
        --user-bg: rgba(255, 255, 255, 0.55);
        --assistant-bg: rgba(255, 255, 255, 0.38);
        --assistant-border: rgba(11, 27, 43, 0.18);
        --error-bg: rgba(220, 38, 38, 0.1);
        --error-border: rgba(220, 38, 38, 0.35);
        --chip-bg: rgba(255, 255, 255, 0.6);
        --chip-hover: rgba(255, 255, 255, 0.78);
        --border: rgba(11, 27, 43, 0.12);
        --accent: #22d3ee;
        --accent-tint: rgba(34, 211, 238, 0.18);
        --danger: #ef4444;
        --danger-strong: #dc2626;
      }

      /* ✅ Halo visuel */
      .halo {
        position: fixed;
        left: 50%;
        top: 96px;
        transform: translateX(-50%) translateZ(0);
        width: 34rem;
        height: 34rem;
        z-index: 0;
        pointer-events: none;
        background: radial-gradient(
          closest-side,
          rgba(56, 189, 248, 0.28),
          rgba(56, 189, 248, 0)
        );
      }
      body > * {
        position: relative;
        z-index: 1;
      }

      /* ✅ Empêche la césure du nom arabe */
      .nowrap-ar {
        white-space: nowrap;
      }

      /* ✅ Sélection lisible */
      ::selection {
        background: rgba(34, 211, 238, 0.35);
        color: #0b1b2b;
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .msg-appear {
        animation: fadeUp 0.28s ease-out both;
      }
      .animate-fadeUp {
        animation: fadeUp 0.28s ease-out both;
      }

      @keyframes dots {
        0% {
          opacity: 0.2;
        }
        20% {
          opacity: 1;
        }
        100% {
          opacity: 0.2;
        }
      }
      .typing-dots {
        letter-spacing: 0.25em;
        display: inline-block;
        animation: dots 1.2s ease-in-out infinite;
      }

      @keyframes micPulse {
        0% {
          box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.25);
          transform: scale(1);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(34, 211, 238, 0);
          transform: scale(1.02);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(34, 211, 238, 0);
          transform: scale(1);
        }
      }
      .mic-pulse {
        animation: micPulse 1.6s ease-out infinite;
      }

      .ocr-skin,
      .ocr-skin * {
        color: var(--fg) !important;
      }
      .ocr-skin input[type="file"] {
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        opacity: 0 !important;
        pointer-events: none !important;
        display: none !important;
      }
      .ocr-skin input[type="file"]::file-selector-button,
      .ocr-skin input[type="file"] + *,
      .ocr-skin input[type="file"] ~ span,
      .ocr-skin input[type="file"] ~ small {
        display: none !important;
      }
      .ocr-skin .truncate,
      .ocr-skin [class*="file-name"],
      .ocr-skin [class*="filename"],
      .ocr-skin [class*="fileName"],
      .ocr-skin [class*="name"] {
        display: none !important;
      }
    `}</style>
  );
}
