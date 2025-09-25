"use client";
export const runtime = "nodejs";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import OcrUploader from "@/components/OcrUploader";

/* =================== i18n (texte complet HTML par langue) =================== */
type Lang = "fr" | "en" | "ar";

type LegalStrings = {
  title: string;
  footer: string;
  btn: { later: string; accept: string; close: string; open: string };
  html: string; // contenu principal en HTML (Manifeste + Qui sommes-nous + Timeline + CGU + Privacy + Version)
};

const legalCopy: Record<Lang, LegalStrings> = {
  fr: {
    title: "Informations légales",
    footer:
      "En acceptant, vous reconnaissez avoir pris connaissance de ces informations. Les règles d’ordre public du pays de l’utilisateur demeurent applicables de plein droit.",
    btn: {
      later: "Plus tard",
      accept: "J’accepte",
      close: "Fermer",
      open: "Manifeste / CGU / Privacy",
    },
    html: `
<section>
  <h3 class="section-title">🌍 Manifeste de Confiance – OneBoarding AI</h3>
  <p>OneBoarding AI est une plateforme d’intelligence artificielle interactive conçue pour offrir à chaque utilisateur une expérience pédagogique et enrichissante.</p>
  <ul>
    <li>🛡️ <strong>Clarté et sécurité</strong> : l’utilisateur reste toujours maître de son usage et responsable de ses choix.</li>
    <li>🌐 <strong>Universalité</strong> : les principes qui gouvernent cette plateforme dépassent les frontières et respectent les règles d’ordre public de chaque pays.</li>
    <li>⚖️ <strong>Équilibre et responsabilité partagée</strong> : l’éditeur met en œuvre tous les moyens raisonnables pour assurer un service fiable, mais l’utilisateur conserve l’entière responsabilité de l’usage qu’il fait des informations fournies.</li>
    <li>🤝 <strong>Confiance et transparence</strong> : l’interaction entre l’intelligence artificielle et l’humain repose sur le respect mutuel, la confidentialité et une utilisation de bonne foi.</li>
  </ul>
  <p class="note">👉 Ce manifeste n’est pas un simple détail juridique : il est l’esprit fondateur qui inspire nos Conditions Générales d’Utilisation et notre Politique de Confidentialité.</p>
</section>

<hr />

<section>
  <h3 class="section-title">Qui sommes-nous</h3>
  <p>OneBoarding AI est une interface intelligente conçue pour faciliter l’interaction avec l’IA de façon simple, rapide et universelle.<br/>Créé et développé par <strong>Benmehdi Mohamed Rida</strong>.</p>
  <p><strong>Notre mission :</strong> rendre l’intelligence artificielle accessible à tous, dans un cadre clair, élégant et respectueux de la confidentialité.</p>
</section>

<hr />

<section>
  <h3 class="section-title">Timeline</h3>
  <ul>
    <li><strong>2025</strong> → Lancement de OneBoarding AI, avec une <strong>mission</strong> : simplifier l’IA.</li>
    <li><strong>2026+</strong> → Déploiement progressif de fonctionnalités avancées.</li>
  </ul>
  <p class="signature">✍️ Une vision unique au service de l’innovation.</p>
</section>

<hr />

<section>
  <h3 class="section-title">Conditions Générales d’Utilisation (CGU)</h3>

  <h4>1. Objet</h4>
  <p>OneBoarding AI fournit un service d’assistance basé sur l’intelligence artificielle permettant aux utilisateurs de formuler des requêtes et d’obtenir des réponses générées automatiquement (« Service »). Les présentes Conditions Générales d’Utilisation régissent l’accès et l’utilisation du Service par tout utilisateur (« Utilisateur »).</p>

  <h4>2. Responsabilité de l’Utilisateur</h4>
  <p>L’Utilisateur est seul responsable de l’utilisation qu’il fait des informations, recommandations, conseils, analyses, ou contenus (« Contenus ») fournis par le Service. Il reconnaît et accepte que :</p>
  <ul>
    <li>a) Les Contenus sont générés automatiquement et constituent une aide à la décision. Ils ne sauraient être considérés comme des conseils professionnels personnalisés. L’Utilisateur doit vérifier et, le cas échéant, consulter un professionnel compétent avant toute décision engageante.</li>
    <li>b) OneBoarding AI et son exploitant ne sauraient être tenus responsables des conséquences directes ou indirectes liées à l’utilisation, l’interprétation, la diffusion ou la mise en œuvre des Contenus (y compris perte de revenus, données, préjudice commercial, ou autre dommage).</li>
    <li>c) L’Utilisateur s’engage à un usage légal et conforme. Il indemnisera OneBoarding AI de toute action, réclamation, dommage ou frais découlant d’un usage non conforme.</li>
  </ul>

  <h4>3. Indemnisation</h4>
  <p>L’Utilisateur s’engage à indemniser, défendre et dégager de toute responsabilité OneBoarding AI, ses dirigeants, employés et ayants droit, en cas de réclamations, dommages, pertes ou coûts (y compris honoraires d’avocat raisonnables) liés à : (i) une utilisation non conforme du Service, (ii) la violation des présentes CGU, ou (iii) la violation de droits de tiers.</p>

  <h4>4. Limitation de responsabilité</h4>
  <p>Dans toute la mesure permise par la loi, la responsabilité cumulée de OneBoarding AI envers l’Utilisateur est limitée et ne peut être engagée qu’au titre des règles d’ordre public, dans l’esprit d’agir en bon père de famille. En aucun cas OneBoarding AI ne pourra être tenue responsable des dommages indirects, spéciaux, punitifs ou accessoires (perte de profit, d’exploitation, ou de données).</p>

  <h4>5. Exceptions</h4>
  <p>Ces limitations ne s’appliquent pas lorsqu’elles contreviennent aux droits légaux impératifs reconnus aux consommateurs par la réglementation en vigueur.</p>

  <h4>6. Obligations de l’Utilisateur</h4>
  <ul>
    <li>ne pas soumettre de contenus illicites, diffamatoires ou violant des droits de tiers ;</li>
    <li>prendre les mesures raisonnables pour sauvegarder ses données ;</li>
    <li>signaler sans délai tout usage frauduleux ou faille de sécurité constatée.</li>
  </ul>

  <h4>7. Conservation et preuve</h4>
  <p>OneBoarding AI se réserve le droit de conserver des journaux (logs) relatifs aux interactions (prompts, réponses, horodatage) à des fins de sécurité, d’amélioration du Service, et le cas échéant de preuve en cas de litige. Ces données sont conservées conformément à la Politique de Confidentialité.</p>
</section>

<hr />

<section>
  <h3 class="section-title">Politique de Confidentialité</h3>
  <ul>
    <li><strong>Stockage local</strong> : l’historique et les consentements sont conservés sur votre appareil.</li>
    <li><strong>Sous-traitants techniques</strong> : les requêtes IA transitent par des prestataires techniques agissant comme sous-traitants ; vos données personnelles ne sont ni vendues ni partagées à des fins publicitaires. <em>Toute monétisation éventuelle concernera l’accès au service (abonnements, crédits, offres) et non la cession de vos données personnelles.</em></li>
    <li><strong>Statistiques anonymisées</strong> : nous pouvons utiliser des mesures agrégées et anonymisées (statistiques d’usage) pour améliorer le service, sans identifier les utilisateurs.</li>
    <li><strong>Effacement</strong> : vous pouvez supprimer vos données locales à tout moment via le bouton prévu à cet effet.</li>
  </ul>
</section>

<hr />

<section>
  <h3 class="section-title">Version & Mise à jour</h3>
  <p><strong>Version 1.0 — Septembre 2025</strong><br/>Un changelog discret indiquera les futures évolutions.</p>
</section>
`,
  },
  en: {
    title: "Legal Information",
    footer:
      "By accepting, you acknowledge that you have read these terms. The mandatory public-order rules of the user’s country remain applicable by operation of law.",
    btn: {
      later: "Later",
      accept: "I accept",
      close: "Close",
      open: "Manifeste / CGU / Privacy",
    },
    html: `
<section>
  <h3 class="section-title">🌍 Trust Manifesto – OneBoarding AI</h3>
  <p>OneBoarding AI is an interactive AI platform designed to provide every user with a pedagogical and enriching experience.</p>
  <ul>
    <li>🛡️ <strong>Clarity & safety</strong>: users remain in full control of their usage and are responsible for their choices.</li>
    <li>🌐 <strong>Universality</strong>: the principles governing this platform transcend borders and respect the public-order rules of each country.</li>
    <li>⚖️ <strong>Balanced, shared responsibility</strong>: the publisher uses reasonable efforts to ensure reliability, while users remain fully responsible for how they use the provided information.</li>
    <li>🤝 <strong>Trust & transparency</strong>: the interaction between AI and humans is based on mutual respect, confidentiality, and good faith.</li>
  </ul>
  <p class="note">👉 This manifesto is not a mere legal footnote: it is the founding spirit behind our Terms of Use and Privacy Policy.</p>
</section>

<hr />

<section>
  <h3 class="section-title">About Us</h3>
  <p>OneBoarding AI is a smart interface that makes interacting with AI simple, fast, and universal.<br/>Created and developed by <strong>Benmehdi Mohamed Rida</strong>.</p>
  <p><strong>Our mission:</strong> make AI accessible to everyone in a clear, elegant, and privacy-respecting framework.</p>
</section>

<hr />

<section>
  <h3 class="section-title">Timeline</h3>
  <ul>
    <li><strong>2025</strong> → Launch of OneBoarding AI, with a <strong>mission</strong>: simplifying AI.</li>
    <li><strong>2026+</strong> → Progressive rollout of advanced features.</li>
  </ul>
  <p class="signature">✍️ A unique vision in the service of innovation.</p>
</section>

<hr />

<section>
  <h3 class="section-title">Terms of Use</h3>

  <h4>1. Purpose</h4>
  <p>OneBoarding AI provides an AI-based assistance service allowing users to submit queries and receive automatically generated responses (“Service”). These Terms of Use govern access to and use of the Service by any “User”.</p>

  <h4>2. User Responsibility</h4>
  <p>The User is solely responsible for how they use the information, recommendations, advice, analyses, or content (“Content”) provided by the Service. The User acknowledges and agrees that:</p>
  <ul>
    <li>a) Content is automatically generated and serves as decision support. It is not personalized professional advice. The User must verify and, where appropriate, consult a qualified professional before taking any binding decision.</li>
    <li>b) OneBoarding AI and its operator cannot be held liable for direct or indirect consequences arising from the use, interpretation, dissemination, or implementation of the Content (including lost revenue, data loss, business harm, or other damages).</li>
    <li>c) The User agrees to lawful and compliant use. The User shall indemnify OneBoarding AI against any action, claim, damage, or cost arising from non-compliant use.</li>
  </ul>

  <h4>3. Indemnification</h4>
  <p>The User agrees to indemnify, defend, and hold harmless OneBoarding AI, its officers, employees, and assigns from claims, damages, losses, or costs (including reasonable attorneys’ fees) related to: (i) non-compliant use, (ii) violation of these Terms, or (iii) infringement of third-party rights.</p>

  <h4>4. Limitation of Liability</h4>
  <p>To the fullest extent permitted by law, OneBoarding AI’s aggregate liability to the User is limited and may only be engaged under mandatory public-order rules, in the spirit of prudent, reasonable behavior. In no event shall OneBoarding AI be liable for indirect, special, punitive, or incidental damages (including lost profits, lost business, or lost data).</p>

  <h4>5. Exceptions</h4>
  <p>These limitations do not apply where they would contravene mandatory consumer rights under applicable law.</p>

  <h4>6. User Obligations</h4>
  <ul>
    <li>not to submit illegal, defamatory, or rights-infringing content;</li>
    <li>to take reasonable measures to back up their data;</li>
    <li>to promptly report any fraudulent use or security breach.</li>
  </ul>

  <h4>7. Retention & Evidence</h4>
  <p>OneBoarding AI may retain logs (prompts, responses, timestamps) for security, service improvement, and, where applicable, evidentiary purposes in case of disputes. Such data is retained in accordance with the Privacy Policy.</p>
</section>

<hr />

<section>
  <h3 class="section-title">Privacy Policy</h3>
  <ul>
    <li><strong>Local storage</strong>: history and consents are stored on your device.</li>
    <li><strong>Processors</strong>: AI requests pass through technical providers acting as data processors; your personal data is neither sold nor shared for advertising. <em>Any future monetization will concern access to the service (subscriptions, credits, offers), not the transfer of your personal data.</em></li>
    <li><strong>Anonymous statistics</strong>: we may use aggregated, anonymized metrics (usage statistics) to improve the service without identifying users.</li>
    <li><strong>Erasure</strong>: you can delete your local data at any time via the dedicated button.</li>
  </ul>
</section>

<hr />

<section>
  <h3 class="section-title">Version & Updates</h3>
  <p><strong>Version 1.0 — September 2025</strong><br/>A lightweight changelog will indicate future changes.</p>
</section>
`,
  },
  ar: {
    title: "معلومات قانونية",
    footer:
      "بقبولك، فإنك تقر بأنك اطّلعت على هذه المعلومات. وتظل قواعد النظام العام في بلد المستخدم سارية بقوة القانون.",
    btn: {
      later: "لاحقًا",
      accept: "أوافق",
      close: "إغلاق",
      open: "Manifeste / CGU / Privacy",
    },
    html: `
<section>
  <h3 class="section-title">🌍 بيان الثقة – OneBoarding AI</h3>
  <p>منصّة OneBoarding AI هي منصّة ذكاء اصطناعي تفاعلية تهدف إلى تقديم تجربة تعليمية مُثرية لكل مستخدم.</p>
  <ul>
    <li>🛡️ <strong>الوضوح والأمان</strong>: يظلّ المستخدم دومًا المتحكّم في استعماله ومسؤولًا عن خياراته.</li>
    <li>🌐 <strong>العالمية</strong>: المبادئ التي تحكم هذه المنصّة تتجاوز الحدود وتحترم قواعد النظام العام في كل بلد.</li>
    <li>⚖️ <strong>توازن ومسؤولية مشتركة</strong>: يلتزم الناشر ببذل الجهود المعقولة لضمان موثوقية الخدمة، بينما يحتفظ المستخدم بالمسؤولية الكاملة عن كيفية استعمال المعلومات المقدّمة.</li>
    <li>🤝 <strong>الثقة والشفافية</strong>: تقوم العلاقة بين الذكاء الاصطناعي والإنسان على الاحترام المتبادل والسرية وحسن النية.</li>
  </ul>
  <p class="note">👉 هذا البيان ليس تفصيلاً قانونيًا بسيطًا؛ إنما هو الروح المؤسسة التي تُلهم شروط الاستخدام وسياسة الخصوصية لدينا.</p>
</section>

<hr />

<section>
  <h3 class="section-title">من نحن</h3>
  <p>OneBoarding AI واجهة ذكية تُبسّط التفاعل مع الذكاء الاصطناعي بشكل سهل وسريع وعالمي.<br/>أُنشئت وطُوّرت <strong class="nowrap-ar">من طرف بنمهدي محمد رضى</strong>.</p>
  <p><strong>مهمّتنا:</strong> جعل الذكاء الاصطناعي متاحًا للجميع ضمن إطار واضح وأنيق ويحترم الخصوصية.</p>
</section>

<hr />

<section>
  <h3 class="section-title">الخط الزمني</h3>
  <ul>
    <li><strong>2025</strong> → إطلاق OneBoarding AI برسالة: تبسيط الذكاء الاصطناعي.</li>
    <li><strong>2026+</strong> → طرح تدريجي لخصائص متقدّمة.</li>
  </ul>
  <p class="signature">✍️ رؤية متفرّدة في خدمة الابتكار.</p>
</section>

<hr />

<section>
  <h3 class="section-title">شروط الاستخدام</h3>

  <h4>1. الغرض</h4>
  <p>توفّر OneBoarding AI خدمة مساعدة مبنية على الذكاء الاصطناعي تمكّن المستخدمين من طرح الاستفسارات والحصول على ردود مُولّدة تلقائيًا (“الخدمة”). وتحكم هذه الشروط وصول أي “مستخدم” إلى الخدمة واستعماله لها.</p>

  <h4>2. مسؤولية المستخدم</h4>
  <p>يتحمّل المستخدم وحده مسؤولية الكيفية التي يستعمل بها المعلومات أو التوصيات أو التحليلات أو المحتوى (“المحتوى”) الذي توفّره الخدمة. ويُقرّ ويوافق على أن:</p>
  <ul>
    <li>a) المحتوى مُولّد تلقائيًا ويُعدّ دعمًا لاتخاذ القرار، وليس مشورة مهنية شخصية. وعلى المستخدم التحقّق والاستعانة بمختص عند اللزوم قبل أي قرار مُلزِم.</li>
    <li>b) لا تتحمّل OneBoarding AI أو مُشغّلها المسؤولية عن النتائج المباشرة أو غير المباشرة لاستخدام أو تفسير أو نشر أو تطبيق المحتوى (بما في ذلك خسارة الإيرادات أو البيانات أو الأضرار التجارية أو غيرها).</li>
    <li>c) يلتزم المستخدم باستعمال قانوني ومتوافق، ويقوم بتعويض OneBoarding AI عن أي إجراء أو مطالبة أو ضرر أو تكاليف تنشأ عن استعمال غير متوافق.</li>
  </ul>

  <h4>3. التعويض</h4>
  <p>يتعهّد المستخدم بتعويض والدفاع وإبراء ذمة OneBoarding AI ومسؤوليها وموظفيها والمتنازل لهم من أي مطالبات أو أضرار أو خسائر أو تكاليف (بما في ذلك أتعاب المحاماة المعقولة) المرتبطة بـ: (i) استعمال غير متوافق، (ii) خرق هذه الشروط، أو (iii) انتهاك حقوق الغير.</p>

  <h4>4. تحديد المسؤولية</h4>
  <p>إلى أقصى حد يسمح به القانون، تكون مسؤولية OneBoarding AI تجاه المستخدم محدودة ولا تُفَعَّل إلا بموجب قواعد النظام العام، وبروح التصرّف الرشيد. ولا تتحمّل OneBoarding AI بأي حال مسؤولية الأضرار غير المباشرة أو الخاصة أو التأديبية أو العرضية (بما في ذلك خسارة الأرباح أو الأعمال أو البيانات).</p>

  <h4>5. الاستثناءات</h4>
  <p>لا تنطبق هذه القيود حيثما تتعارض مع الحقوق القانونية الإلزامية للمستهلكين بموجب القانون النافذ.</p>

  <h4>6. التزامات المستخدم</h4>
  <ul>
    <li>عدم تقديم محتوى غير مشروع أو تشهيري أو منتهك لحقوق الغير؛</li>
    <li>اتخاذ تدابير معقولة لنسخ بياناته احتياطيًا؛</li>
    <li>الإبلاغ دون تأخير عن أي استعمال احتيالي أو ثغرة أمنية.</li>
  </ul>

  <h4>7. الحفظ والإثبات</h4>
  <p>يجوز لـ OneBoarding AI الاحتفاظ بسجلات (طلبات، ردود، طوابع زمنية) لأغراض الأمن وتحسين الخدمة، وعند الاقتضاء كأدلة في حال النزاع، وذلك وفق سياسة الخصوصية.</p>
</section>

<hr />

<section>
  <h3 class="section-title">سياسة الخصوصية</h3>
  <ul>
    <li><strong>تخزين محلي</strong>: يُحفَظ السجلّ والموافقات على جهازك.</li>
    <li><strong>معالجو البيانات</strong>: تمرّ طلبات الذكاء الاصطناعي عبر مزوّدي خدمات تقنيين بصفة معالِجين للبيانات؛ لا تُباع بياناتك الشخصية ولا تُشارك لأغراض إعلانية. <em>وأي تحقيق أرباح مستقبلي سيتعلق بالوصول إلى الخدمة (اشتراكات، أرصدة، عروض) وليس بالتنازل عن بياناتك الشخصية.</em></li>
    <li><strong>إحصاءات مُجَمَّعة ومجهولة</strong>: قد نستخدم قياسات مُجمّعة ومجهولة الهوية لتحسين الخدمة دون تعرّف على المستخدمين.</li>
    <li><strong>الحذف</strong>: يمكنك حذف بياناتك المحلية في أي وقت عبر الزر المخصّص.</li>
  </ul>
</section>

<hr />

<section>
  <h3 class="section-title">الإصدار والتحديث</h3>
  <p><strong>الإصدار 1.0 — سبتمبر 2025</strong><br/>سيسجّل سجلّ تغييرات موجز أي تحديثات مستقبلية.</p>
</section>
`,
  },
};

/* =================== Modal Légal (manifeste + CGU + privacy) =================== */
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
  const LANG_KEY = "oneboarding.legalLang";
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem(LANG_KEY) as Lang) || "fr";
    } catch {
      return "fr";
    }
  });

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

  const setLangPersist = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  };

  if (!open) return null;
  const t = legalCopy[lang];

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-white shadow-xl"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{t.title}</h2>

          {/* Lang mini-buttons */}
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
            {t.btn.close}
          </button>
        </div>

        {/* Contenu compact (HTML injecté) */}
        <div
          ref={boxRef}
          className="px-5 py-4 pb-24 max-h-[70vh] overflow-y-auto text-[13.5px] leading-[1.35rem] space-y-5 legal-html"
          dangerouslySetInnerHTML={{ __html: t.html }}
        />

        <div className="px-5 pb-2 text-xs opacity-75">{t.footer}</div>

        {/* Barre sticky de boutons, toujours visible et bien droite */}
        <div
          className="px-5 py-3 border-t border-white/10 flex items-center justify-end gap-3 sticky bottom-0 bg-[var(--panel)]"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15"
          >
            {t.btn.later}
          </button>
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className={`px-4 py-2 rounded-xl text-white transition ${
              canAccept ? "bg-[var(--accent)] hover:brightness-110" : "bg-white/10 cursor-not-allowed"
            }`}
            title={canAccept ? undefined : "Faites défiler jusqu’en bas pour activer"}
          >
            {t.btn.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== Bandeau RGPD / Légal =================== */
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
      const btn = dialogRef.current?.querySelector<HTMLButtonElement>("button[data-autofocus='true']");
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
            className="px-4 py-2 rounded-2xl bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================== Types & utils =================== */
type Item = { role: "user" | "assistant" | "error"; text: string; time: string };

const cleanText = (s: string) => s.replace(/\s+/g, " ").replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1").trim();

function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text);
  } catch {}
}

/* =================== Page =================== */
export default function Page(): React.JSX.Element {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // OCR
  const [showOcr, setShowOcr] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const ocrContainerRef = useRef<HTMLDivElement | null>(null);

  // 🎙️ Micro
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  const baseInputRef = useRef<string>("");

  // 🧹 Modal Effacer
  const [showClearModal, setShowClearModal] = useState(false);

  // Décalage du bouton "Effacer l’historique" quand le bandeau légal est visible
  const CONSENT_KEY = "oneboarding.legalAccepted";
  const [liftForBanner, setLiftForBanner] = useState(false);
  useEffect(() => {
    try {
      setLiftForBanner(localStorage.getItem(CONSENT_KEY) !== "1");
    } catch {
      setLiftForBanner(true);
    }
    const onBannerHidden = () => setLiftForBanner(false);
    window.addEventListener("oneboarding:legalBannerHidden", onBannerHidden as EventListener);
    return () => window.removeEventListener("oneboarding:legalBannerHidden", onBannerHidden as EventListener);
  }, []);

  // Textarea auto-expansion + scroll
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 3,
      lineHeight = 24,
      maxHeight = max * lineHeight + 16;
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + "px";
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  useEffect(() => {
    const SR: any =
      (typeof window !== "undefined" && (window as any).SpeechRecognition) ||
      (typeof window !== "undefined" && (window as any).webkitSpeechRecognition);
    if (!SR) return;

    setSpeechSupported(true);
    const r = new SR();
    r.lang = "fr-FR";
    r.continuous = true;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onstart = () => {
      baseInputRef.current = input;
      setListening(true);
    };
    r.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) final += " " + e.results[i][0].transcript;
      setInput(cleanText([baseInputRef.current, final].join(" ")));
    };
    const stopUI = () => setListening(false);
    r.onend = stopUI;
    r.onspeechend = stopUI;
    r.onaudioend = stopUI;
    r.onnomatch = stopUI;
    r.onerror = stopUI;

    recogRef.current = r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMic() {
    const r = recogRef.current;
    if (!r) return;
    if (!listening) {
      try {
        r.start();
      } catch {}
      return;
    }
    try {
      r.stop();
    } catch {}
    setTimeout(() => {
      if (listening) {
        try {
          r.abort?.();
        } catch {}
        setListening(false);
      }
    }, 600);
  }

  // historique persist
  useEffect(() => {
    try {
      const s = localStorage.getItem("oneboarding.history");
      if (s) setHistory(JSON.parse(s));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("oneboarding.history", JSON.stringify(history));
    } catch {}
  }, [history]);

  // Auto-scroll vers le haut à la fin de génération
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) window.scrollTo({ top: 0, behavior: "smooth" });
    prevLoadingRef.current = loading;
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    const hasOcr = Boolean(ocrText.trim());
    if (!q && !hasOcr) return;
    if (loading) return;

    const now = new Date().toISOString();
    const userShown = q || (hasOcr ? "(Question vide — envoi du texte OCR uniquement)" : "");
    if (userShown) setHistory((h) => [{ role: "user", text: userShown, time: now }, ...h]);

    setInput("");
    setLoading(true);

    const composedPrompt = hasOcr
      ? `Voici le texte extrait d’un document (OCR) :\n\n"""${ocrText}"""\n\nConsigne de l’utilisateur : ${
          q || "(aucune)"
        }\n\nConsigne pour l’IA : Résume/explique et réponds clairement, en conservant la langue du texte OCR si possible.`
      : q;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: composedPrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const raw = String(data?.error || `HTTP ${res.status}`);
        let msg = `Erreur: ${raw}`;
        if (raw.includes("GROQ_API_KEY"))
          msg = "Service temporairement indisponible. (Configuration serveur requise)";
        setHistory((h) => [{ role: "error", text: msg, time: new Date().toISOString() }, ...h]);
      } else {
        setHistory((h) => [
          {
            role: "assistant",
            text: String(data.text || "Réponse vide."),
            time: new Date().toISOString(),
          },
          ...h,
        ]);
      }
    } catch (err: any) {
      setHistory((h) => [
        { role: "error", text: `Erreur: ${err?.message || "réseau"}`, time: new Date().toISOString() },
        ...h,
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Déclenche file input d’OcrUploader
  function triggerHiddenFileInput() {
    const container = ocrContainerRef.current;
    if (!container) return;
    const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    input?.click();
  }

  // Effacement de l’historique (après confirmation)
  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem("oneboarding.history");
    } catch {}
    setShowClearModal(false);
  }

  return (
    <div className="fixed inset-0 overflow-y-auto text-[var(--fg)] flex flex-col items-center p-6 selection:bg-[var(--selection-bg)] selection:text-[var(--selection-fg)]">
      <StyleGlobals />
      <div className="halo" aria-hidden />

      {/* ===== Logo (pictogramme) — redescendu légèrement ===== */}
      <div className="mb-1 -mt-1 flex justify-center">
        <div className="relative h-32 w-32 md:h-44 md:w-44 overflow-hidden">
          <Image
            src="/brand/oneboardingai-logo.png"
            alt="OneBoarding AI — logomark"
            fill
            priority
            className="object-contain -translate-y-3 md:-translate-y-4 drop-shadow-[0_0_40px_rgba(56,189,248,0.30)]"
          />
        </div>
      </div>

      {/* ===== Barre : textarea auto + OK ===== */}
      <form onSubmit={handleSubmit} className="w-full max-w-md mb-2 z-[1]">
        <div className="flex items-stretch shadow-[0_6px_26px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden border border-[var(--border)]">
          <textarea
            ref={taRef}
            placeholder="Votre question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 min-w-0 px-4 py-3 text-white bg-[var(--panel)] outline-none resize-none leading-6"
            rows={1}
            style={{ maxHeight: 96 }}
          />
          <div className="w-px bg-[var(--border)]" aria-hidden />
          <button
            type="submit"
            disabled={loading}
            className="px-5 md:px-6 font-medium bg-[var(--panel-strong)] text-white hover:bg-[var(--panel-stronger)] transition disabled:opacity-60"
          >
            {loading ? "…" : "OK"}
          </button>
        </div>

        {/* rangée d’actions sous la barre */}
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => setShowOcr((v) => !v)}
            className="h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] grid place-items-center transition"
            title="Joindre un document (OCR)"
            aria-label="Joindre un document"
          >
            <svg
              className="h-6 w-6 text-[var(--fg)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l8.49-8.49a4 4 0 015.66 5.66L10 16.83a2 2 0 11-2.83-2.83l7.78-7.78" />
            </svg>
          </button>

          <button
            type="button"
            disabled={!speechSupported}
            onClick={toggleMic}
            className={`h-12 w-12 rounded-xl border grid place-items-center transition
              ${
                listening
                  ? "border-[var(--accent)] bg-[color:var(--accent-tint)] mic-pulse"
                  : "border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)]"
              }
              disabled:opacity-50`}
            aria-label={speechSupported ? (listening ? "Arrêter le micro" : "Parler") : "Micro non supporté"}
            title={speechSupported ? "Saisie vocale" : "Micro non supporté"}
          >
            <svg
              className="h-6 w-6 text-[var(--fg)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1.5a3 3 0 00-3 3v7a3 3 0 006 0v-7a3 3 0 00-3-3z" />
              <path d="M19 10.5a7 7 0 01-14 0" />
              <path d="M12 21v-3" />
            </svg>
          </button>
        </div>
      </form>

      {/* Tiroir OCR */}
      {showOcr && (
        <div ref={ocrContainerRef} className="w-full max-w-md mb-6 animate-fadeUp ocr-skin z-[1]">
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={triggerHiddenFileInput}
              className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] text-[var(--fg)] font-medium"
            >
              Charger 1 fichier
            </button>
          </div>
          <OcrUploader onText={(t) => setOcrText(t)} onPreview={() => {}} />
        </div>
      )}

      {/* Historique */}
      <div className="w-full max-w-md space-y-3 pb-40 z-[1]">
        {loading && (
          <div className="msg-appear rounded-xl border border-[var(--border)] bg-[var(--assistant-bg)] p-3 relative">
            <p className="text-[var(--fg)]">
              <span className="typing-dots" aria-live="polite">
                •••
              </span>
            </p>
            <p className="text-xs opacity-70 mt-4">IA • {new Date().toLocaleString()}</p>
          </div>
        )}

        {history.map((item, idx) => (
          <div
            key={idx}
            className={`msg-appear rounded-xl border p-3 relative
              ${
                item.role === "user"
                  ? "border-[var(--border)] bg-[var(--user-bg)]"
                  : item.role === "assistant"
                  ? "border-[var(--assistant-border)] bg-[var(--assistant-bg)]"
                  : "border-[var(--error-border)] bg-[var(--error-bg)]"
              }`}
          >
            <p className="whitespace-pre-wrap">{item.text}</p>

            {item.role === "assistant" && (
              <button
                onClick={() => copyToClipboard(item.text)}
                className="absolute right-3 bottom-3 text-xs px-3 py-1 rounded-lg bg-[var(--chip-bg)] hover:bg-[var(--chip-hover)] border border-[var(--border)]"
              >
                Copier
              </button>
            )}

            <p className="text-xs opacity-70 mt-6">
              {item.role === "user" ? "Vous" : item.role === "assistant" ? "IA" : "Erreur"} •{" "}
              {new Date(item.time).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Bouton danger effacer historique (remonté si bandeau légal visible) */}
      {history.length > 0 && (
        <div
          className={`fixed inset-x-0 z-[55] flex justify-center pointer-events-none ${
            liftForBanner ? "bottom-28" : "bottom-6"
          }`}
        >
          <button
            onClick={() => setShowClearModal(true)}
            className="pointer-events-auto px-5 py-3 rounded-2xl bg-[var(--danger)] hover:bg-[var(--danger-strong)] text-white font-semibold shadow-lg"
          >
            Effacer l’historique
          </button>
        </div>
      )}

      {/* Modal Effacer */}
      <ConfirmDialog
        open={showClearModal}
        title="Effacer l’historique ?"
        description="Souhaitez-vous vraiment supprimer l’historique de la conversation ? Cette action est irréversible. Pensez à sauvegarder ce qui vous est utile avant d’effacer."
        confirmLabel="Effacer"
        cancelLabel="Annuler"
        onConfirm={clearHistory}
        onCancel={() => setShowClearModal(false)}
      />

      {/* Bandeau RGPD / Légal */}
      <RgpdBanner />
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

        /* Sélection lisible partout */
        --selection-bg: rgba(34, 211, 238, 0.35);
        --selection-fg: #08111b;
      }

      .halo {
        position: fixed;
        left: 50%;
        top: 96px;
        transform: translateX(-50%) translateZ(0);
        width: 34rem;
        height: 34rem;
        z-index: 0;
        pointer-events: none;
        background: radial-gradient(closest-side, rgba(56, 189, 248, 0.28), rgba(56, 189, 248, 0));
      }
      body > * {
        position: relative;
        z-index: 1;
      }

      /* Empêche la césure du nom arabe */
      .nowrap-ar {
        white-space: nowrap;
      }

      /* Style de contenu HTML dans le modal légal */
      .legal-html .section-title {
        font-weight: 600;
        margin-bottom: 0.4rem;
      }
      .legal-html p {
        opacity: 0.92;
        margin: 0.35rem 0;
      }
      .legal-html ul {
        margin: 0.3rem 0 0.3rem 1.2rem;
        opacity: 0.92;
      }
      [dir="rtl"] .legal-html ul {
        margin: 0.3rem 1.2rem 0.3rem 0;
      }
      .legal-html hr {
        border: none;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        margin: 0.6rem 0;
      }
      .legal-html .note {
        font-size: 0.92em;
        opacity: 0.85;
      }
      .legal-html .signature {
        margin-top: 0.4rem;
        opacity: 0.95;
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
