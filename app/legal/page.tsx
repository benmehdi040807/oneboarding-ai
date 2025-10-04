export const runtime = "nodejs";

export const metadata = {
  title: "Informations légales — OneBoarding AI",
  description:
    "Manifeste / Conditions d’utilisation / Confidentialité — OneBoarding AI.",
};

type Lang = "fr" | "en" | "ar";

type Section =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string; html?: boolean }
  | { kind: "ul"; items: string[] }
  | { kind: "hr" };

type Copy = {
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
          "2) Responsabilité de l’utilisateur : les contenus générés ne sont pas des conseils professionnels personnalisés. Vérifications requises avant toute décision engageante.",
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
        text:
          "5) Exceptions : sans préjudice des droits impératifs des consommateurs.",
      },

      { kind: "hr" },
      { kind: "h2", text: "Politique de Confidentialité" },
      {
        kind: "ul",
        items: [
          "Stockage local : historique et consentements sur votre appareil.",
          "Sous-traitants techniques : acheminement des requêtes IA — aucune vente/partage publicitaire de données personnelles.",
          "Monétisation : porte sur l’accès au service (abonnements, crédits), jamais la cession de données.",
          "Statistiques : mesures agrégées et anonymisées pour améliorer le service.",
          "Effacement : suppression possible à tout moment des données locales.",
        ],
      },

      { kind: "hr" },
      { kind: "h2", text: "Qui sommes-nous" },
      {
        kind: "p",
        text:
          "OneBoarding AI, créé par Benmehdi Mohamed Rida, vise à rendre l’IA simple, rapide et universelle.",
      },
    ],
    version: {
      h: "Version & mise à jour",
      v: "Version 1.0 — Septembre 2025",
      note: "Un changelog discret indiquera les futures évolutions.",
    },
  },

  en: {
    title: "Legal Information",
    sections: [
      { kind: "h2", text: "🌍 Trust Manifesto – OneBoarding AI" },
      {
        kind: "p",
        text:
          "OneBoarding AI is an interactive AI platform providing an educational, enriching experience to each user.",
      },
      {
        kind: "ul",
        items: [
          "🛡️ Clarity & safety: users control usage and remain responsible for choices.",
          "🌐 Universality: respect for mandatory public-order rules in each country.",
          "⚖️ Balance: reasonable means by the publisher, responsible use by the user.",
          "🤝 Trust & transparency: confidentiality, mutual respect, and good faith.",
        ],
      },

      { kind: "hr" },
      { kind: "h2", text: "Terms of Use" },
      { kind: "p", text: "1) Purpose: AI-powered assistance, decision support." },
      {
        kind: "p",
        text:
          "2) User responsibility: generated content isn’t personalized professional advice. Verify before any binding decision.",
      },
      {
        kind: "p",
        text:
          "3) Indemnification: user holds OneBoarding AI harmless in case of non-compliant use or rights violations.",
      },
      {
        kind: "p",
        text:
          "4) Limitation of liability: within the law, no liability for indirect damages (profits, data, business…).",
      },
      {
        kind: "p",
        text:
          "5) Exceptions: without prejudice to mandatory consumer rights.",
      },

      { kind: "hr" },
      { kind: "h2", text: "Privacy Policy" },
      {
        kind: "ul",
        items: [
          "Local storage: history and consents on your device.",
          "Processors: AI requests routed via technical providers; no selling/sharing for ads.",
          "Monetisation: access to service (subscriptions/credits), never data transfer.",
          "Statistics: aggregated, anonymised metrics to improve the service.",
          "Erasure: delete local data anytime.",
        ],
      },

      { kind: "hr" },
      { kind: "h2", text: "About" },
      {
        kind: "p",
        text:
          "Built by Benmehdi Mohamed Rida to make AI simple, fast and universal.",
      },
    ],
    version: {
      h: "Version & Updates",
      v: "Version 1.0 — September 2025",
      note: "A discreet changelog will indicate future evolutions.",
    },
  },

  ar: {
    title: "معلومات قانونية",
    sections: [
      { kind: "h2", text: "🌍 بيان الثقة – OneBoarding AI" },
      {
        kind: "p",
        text:
          "منصّة OneBoarding AI منصّة ذكاء اصطناعي تفاعلية تهدف إلى تقديم تجربة تعليمية مُثرية لكل مستخدم.",
      },
      {
        kind: "ul",
        items: [
          "🛡️ الوضوح والأمان: يبقى المستخدم مسيطرًا ومسؤولًا عن اختياراته.",
          "🌐 العالمية: احترام قواعد النظام العام في كل بلد.",
          "⚖️ توازن: وسائل معقولة من الناشر، ومسؤولية الاستخدام على عاتق المستخدم.",
          "🤝 الثقة والشفافية: سرّية واحترام متبادل وحسن نية.",
        ],
      },

      { kind: "hr" },
      { kind: "h2", text: "شروط الاستخدام" },
      { kind: "p", text: "1) الهدف: مساعدة قائمة على الذكاء الاصطناعي، عون لاتخاذ القرار." },
      {
        kind: "p",
        text:
          "2) مسؤولية المستخدم: المحتوى المُولّد ليس استشارة مهنية مُخصّصة. يلزم التحقّق قبل أي قرار مُلزِم.",
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
      {
        kind: "p",
        text:
          "5) الاستثناءات: دون المساس بحقوق المستهلك الإلزامية.",
      },

      { kind: "hr" },
      { kind: "h2", text: "سياسة الخصوصية" },
      {
        kind: "ul",
        items: [
          "تخزين محلي: السجلّ والموافقات على جهازك.",
          "معالِجون تقنيون: تمرّ الطلبات عبر مزوّدي خدمة؛ بلا بيع/مشاركة لأغراض إعلانية.",
          "الربحية: تتعلق بالوصول إلى الخدمة (اشتراكات/أرصدة) وليس بالتنازل عن البيانات.",
          "إحصاءات مُجهّلة: قياسات مُجمّعة لتحسين الخدمة دون تحديد المستخدم.",
          "الحذف: يمكنك حذف البيانات المحلية في أي وقت.",
        ],
      },

      { kind: "hr" },
      { kind: "h2", text: "من نحن" },
      {
        kind: "p",
        html: true,
        text:
          'تسعى OneBoarding AI، المطوَّرة من طرف <span class="nowrap-ar">بنمهدي محمد رضى</span>، إلى تبسيط التفاعل مع الذكاء الاصطناعي بطريقة سريعة وعالمية.',
      },
    ],
    version: {
      h: "الإصدار والتحديث",
      v: "الإصدار 1.0 — سبتمبر 2025",
      note: "سيعرض سجل تغييرات مُصغّر التطورات المستقبلية.",
    },
  },
};

function pickLang(sp?: URLSearchParams): Lang {
  const raw = sp?.get("lang")?.toLowerCase();
  if (raw === "en" || raw === "ar") return raw;
  return "fr";
}

export default function LegalPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // lecture naïve des query params (sans client JS)
  const sp =
    typeof searchParams === "object"
      ? new URLSearchParams(
          Object.entries(searchParams)
            .filter(([_, v]) => typeof v === "string")
            .map(([k, v]) => [k, String(v)])
        )
      : undefined;

  const lang = pickLang(sp);
  const t = COPY[lang];

  return (
    <main className="px-4 py-8 mx-auto w-full max-w-2xl text-black">
      {/* Lang switcher: liens simples */}
      <nav className="mb-5 text-sm">
        <span className="opacity-70 mr-2">Langue:</span>
        <a
          href="?lang=fr"
          className={`px-2 py-1 rounded border mr-1 ${lang === "fr" ? "bg-black text-white border-black" : "border-black/20"}`}
        >
          FR
        </a>
        <a
          href="?lang=en"
          className={`px-2 py-1 rounded border mr-1 ${lang === "en" ? "bg-black text-white border-black" : "border-black/20"}`}
        >
          EN
        </a>
        <a
          href="?lang=ar"
          className={`px-2 py-1 rounded border ${lang === "ar" ? "bg-black text-white border-black" : "border-black/20"}`}
        >
          AR
        </a>
      </nav>

      <h1 className="text-xl font-bold mb-4">{t.title}</h1>

      <article dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-4 leading-6">
        {t.sections.map((s, i) => {
          if (s.kind === "hr") return <hr key={i} className="border-black/10 my-2" />;
          if (s.kind === "h2")
            return (
              <h2 key={i} className="text-lg font-semibold mt-4">
                {s.text}
              </h2>
            );
          if (s.kind === "p")
            return s.html ? (
              <p key={i} className="opacity-90" dangerouslySetInnerHTML={{ __html: s.text }} />
            ) : (
              <p key={i} className="opacity-90">
                {s.text}
              </p>
            );
          if (s.kind === "ul")
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5 opacity-90">
                {s.items.map((li, j) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            );
          return null;
        })}

        <hr className="border-black/10 my-3" />
        <h3 className="font-semibold">{t.version.h}</h3>
        <p className="font-semibold">{t.version.v}</p>
        <p className="opacity-90">{t.version.note}</p>

        <div className="mt-6 text-sm opacity-70">
          <p>
            En accédant au service, vous reconnaissez avoir pris connaissance de ces informations. Les règles
            d’ordre public applicables dans le pays de l’utilisateur demeurent de plein droit.
          </p>
        </div>
      </article>
    </main>
  );
        }
