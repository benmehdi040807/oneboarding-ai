"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getDict, type Locale } from "@/lib/i18n";

/* =========================
   Stockage & constantes
   ========================= */
const STORAGE_KEYS = {
  profile: "oneboarding.profile",
  plan: "oneboarding.plan",
  onboarded: "oneboarding.onboarded",
  locale: "oneboarding.locale",
};

const TEMPLATES = [
  {
    id: "plainte",
    icon: "📄",
    label: "Plainte pénale",
    fields: [
      { id: "defendeur", label: "Nom de la personne mise en cause", placeholder: "Ex: Karim Y" },
      { id: "faits", label: "Résumé des faits (3–4 phrases)", textarea: true, placeholder: "Décrivez brièvement les faits..." },
      { id: "dateLieu", label: "Date et lieu des faits", placeholder: "02/07/2025 – Casablanca" },
    ],
  },
  {
    id: "mail",
    icon: "✉️",
    label: "Mail professionnel",
    fields: [
      { id: "destinataire", label: "Destinataire", placeholder: "Mme/M. ..." },
      { id: "objet", label: "Objet du mail", placeholder: "Suivi de dossier / Demande de RDV..." },
      { id: "message", label: "Message (idée principale)", textarea: true, placeholder: "Expliquez en 2–3 phrases..." },
    ],
  },
  {
    id: "post",
    icon: "📢",
    label: "Post LinkedIn",
    fields: [
      { id: "sujet", label: "Sujet / angle", placeholder: "Ex: Conseil juridique — Procédures collectives" },
      { id: "idee", label: "Idée clé", textarea: true, placeholder: "Votre insight en quelques lignes..." },
    ],
  },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

/* =========================
   PRESETS (exemples)
   ========================= */
const PRESETS: Record<
  TemplateId,
  Array<{ id: string; label: string; values: Record<string, string> }>
> = {
  plainte: [
    {
      id: "p1",
      label: "Vol de téléphone",
      values: {
        defendeur: "Inconnu (individu cagoulé)",
        faits:
          "Le 14/09/2025 vers 20h15, en sortant du tram à Derb Ghallef, un individu m’a arraché mon téléphone des mains avant de prendre la fuite. Une personne a crié mais l’auteur a disparu entre les voitures. J’ai tenté d’activer ‘Localiser’ sans succès.",
        dateLieu: "14/09/2025 – Casablanca, Derb Ghallef",
      },
    },
    {
      id: "p2",
      label: "Arnaque en ligne",
      values: {
        defendeur: "Profil ‘DealExpress’ (Marketplace)",
        faits:
          "Le 02/08/2025, j’ai payé 2.400 MAD pour un ordinateur portable proposé sur une Marketplace. Le vendeur n’a jamais expédié le produit et a cessé de répondre. Les justificatifs de paiement sont joints.",
        dateLieu: "02/08/2025 – Transaction en ligne",
      },
    },
  ],
  mail: [
    {
      id: "m1",
      label: "Relance de facture",
      values: {
        destinataire: "Mme Benali – Comptabilité",
        objet: "Relance facture #2025-117",
        message:
          "Je me permets de revenir vers vous concernant la facture #2025-117 arrivée à échéance le 31/08. Pourriez-vous me confirmer la date de règlement ou m’indiquer si des pièces complémentaires sont nécessaires ?",
      },
    },
    {
      id: "m2",
      label: "Demande de RDV",
      values: {
        destinataire: "M. Karim – Direction",
        objet: "Proposition de rendez-vous – cadrage projet",
        message:
          "Suite à nos échanges, je propose un rendez-vous de 30 minutes afin de cadrer le périmètre et l’échéancier. Je suis disponible mardi/jeudi après-midi ; dites-moi ce qui vous convient.",
      },
    },
  ],
  post: [
    {
      id: "s1",
      label: "Conseil juridique",
      values: {
        sujet: "Procédures collectives : erreurs fréquentes",
        idee:
          "Beaucoup d’entreprises attendent trop avant d’anticiper la trésorerie et d’activer les mesures préventives. 3 conseils pratico-pratiques pour gagner du temps et garder la main.",
      },
    },
    {
      id: "s2",
      label: "Retour d’expérience",
      values: {
        sujet: "Digitaliser la relation client d’un cabinet",
        idee:
          "Ce qui a vraiment changé : formulaires guidés, signature électronique, et tri automatique des pièces. Gain de 30% sur le temps administratif.",
      },
    },
  ],
};

/* =========================
   Plans & utilitaires
   ========================= */
const PLANS = [
  { id: "free", label: "Freemium", price: "Gratuit", desc: "Découverte (limité)", color: "bg-gray-800" },
  { id: "pro", label: "Pro", price: "33€/mois", desc: "Biographie complète", color: "bg-emerald-700" },
  { id: "team", label: "Entreprise", price: "200–330€/mois", desc: "Mémoire partagée", color: "bg-indigo-700" },
];

const Spinner = () => (
  <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" aria-label="Chargement" />
);

function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setVal(JSON.parse(raw));
    } catch {}
  }, [key]);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}

async function apiGenerate(payload: any): Promise<string | null> {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch {
    return null;
  }
}

/* =========================
   Composant principal
   ========================= */
export default function AppMvp() {
  const [locale, setLocale] = useLocalStorage<Locale>(
    STORAGE_KEYS.locale,
    (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale) || "fr"
  );
  const t = getDict(locale);

  const [plan, setPlan] = useLocalStorage<string>(STORAGE_KEYS.plan, "free");
  const [onboarded, setOnboarded] = useLocalStorage<boolean>(STORAGE_KEYS.onboarded, false);
  const [profile, setProfile] = useLocalStorage<any>(STORAGE_KEYS.profile, {
    name: "Utilisateur",
    title: "",
    org: "",
    locale,
  });

  const [step, setStep] = useState(1);
  const [templateId, setTemplateId] = useState<TemplateId | "">("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setProfile((p: any) => ({ ...p, locale })), [locale]);

  const template = useMemo(
    () => (templateId ? TEMPLATES.find((t) => t.id === templateId)! : null),
    [templateId]
  );

  // Génération automatique en entrée étape 3
  useEffect(() => {
    const run = async () => {
      if (step === 3 && templateId) {
        setLoading(true);
        const out = await apiGenerate({ plan, templateId, values: formValues, profile });
        setResult(out || "");
        setLoading(false);
      }
    };
    run();
  }, [step, templateId]);

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(result);
      alert("Copié !");
    } catch {}
  }

  function usePreset(tpl: TemplateId, presetId: string, goGenerate = false) {
    const preset = PRESETS[tpl].find((p) => p.id === presetId);
    if (!preset) return;
    setTemplateId(tpl);
    setFormValues(preset.values);
    setStep(goGenerate ? 3 : 2);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="w-full sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-xl">🛫</div>
            <div className="leading-tight">
              <div className="text-white font-semibold flex items-center gap-2">
                <span>OneBoarding AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-white/80">DEMO</span>
              </div>
              <div className="text-xs text-white/60">3 étapes — simple, pro, équipe</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="text-xs bg-white/10 border border-white/15 rounded px-2 py-1"
              aria-label="Langue"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlan(p.id)}
                className={`text-xs md:text-sm px-2.5 py-1.5 rounded-full border border-white/15 ${
                  plan === p.id ? "bg-white text-black" : "text-white/80 hover:text-white"
                }`}
                title={`${p.label} — ${p.price}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Étape 1 — Choix rapide + Exemples rapides */}
      {step === 1 && (
        <div className="max-w-5xl mx-auto px-4 py-8 fade-in">
          <div className="rounded-2xl bg-white/5 border border-white/10 shadow-sm p-5">
            <h2 className="text-xl font-semibold mb-3">{t.whatToGenerate}</h2>

            {/* Cartes de modèles */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setTemplateId(tpl.id);
                    setFormValues({});
                    setStep(2);
                  }}
                  className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 text-left transition"
                >
                  <div className="text-2xl">{tpl.icon}</div>
                  <div className="mt-2 font-medium">{tpl.label}</div>
                </button>
              ))}
            </div>

            {/* Exemples rapides */}
            <div className="rounded-xl bg-black/40 border border-white/10 p-4">
              <div className="text-sm font-medium mb-3">⚡ Exemples rapides</div>
              <div className="flex flex-col gap-3">
                {(Object.keys(PRESETS) as TemplateId[]).map((tpl) => (
                  <div key={tpl} className="flex flex-wrap items-center gap-2">
                    <span className="text-white/70 w-40">
                      {TEMPLATES.find((t) => t.id === tpl)?.label}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {PRESETS[tpl].map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => usePreset(tpl, ex.id /* goGenerate */ false)}
                          className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm hover:bg-white/15"
                          title="Remplit automatiquement les champs"
                        >
                          {ex.label}
                        </button>
                      ))}
                      <button
                        onClick={() => usePreset(tpl, PRESETS[tpl][0].id, true)}
                        className="px-3 py-1.5 rounded-full bg-white text-black text-sm"
                        title="Remplit et génère directement"
                      >
                        Essayer →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-white/50 mt-3">
                Astuce : “Essayer →” remplit un exemple et passe directement au résultat.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Étape 2 — Formulaire + bandeau d’exemples */}
      {step === 2 && template && (
        <div className="max-w-5xl mx-auto px-4 py-8 fade-in">
          <div className="rounded-2xl bg-white/5 border border-white/10 shadow-sm p-5">
            <h2 className="text-xl font-semibold mb-4">{template.label}</h2>

            {/* Bandeau d’exemples pour ce template */}
            <div className="rounded-xl bg-black/40 border border-white/10 p-3 mb-4">
              <div className="text-xs uppercase tracking-wider text-white/60 mb-2">Exemples</div>
              <div className="flex gap-2 flex-wrap">
                {PRESETS[template.id as TemplateId].map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setFormValues(ex.values)}
                    className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm hover:bg-white/15"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Champs */}
            <div className="grid gap-4">
              {template.fields.map((f) => (
                <label key={f.id} className="block">
                  <span className="text-sm text-white/80">{f.label}</span>
                  {f.textarea ? (
                    <textarea
                      className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 text-white p-3"
                      placeholder={f.placeholder}
                      value={formValues[f.id] || ""}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                    />
                  ) : (
                    <input
                      className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 text-white p-3"
                      placeholder={f.placeholder}
                      value={formValues[f.id] || ""}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setStep(1);
                  setResult("");
                }}
                className="px-4 py-2 rounded-xl border border-white/15"
              >
                ← Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={loading}
                className={`px-4 py-2 rounded-xl font-medium ${
                  loading ? "bg-white/60 text-black/70 cursor-not-allowed" : "bg-white text-black"
                }`}
              >
                {loading ? "…" : "Générer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Étape 3 — Résultat */}
      {step === 3 && (
        <div className="max-w-5xl mx-auto px-4 py-8 fade-in">
          <div className="rounded-2xl bg-white/5 border border-white/10 shadow-sm p-5">
            <h2 className="text-xl font-semibold mb-4">{t.resultReady}</h2>
            <div className="rounded-xl bg-black border border-white/10 p-4 whitespace-pre-wrap text-sm min-h-[140px]">
              {loading ? (
                <div className="flex items-center gap-2 text-white/80">
                  <Spinner />
                  <span>Génération en cours…</span>
                </div>
              ) : (
                result || "Conseil : revenez à l’étape 2, remplissez au moins 1 champ puis « Générer »."
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-5">
              <button onClick={async () => copyResult()} className="px-4 py-2 rounded-xl bg-white text-black font-medium">
                Copier
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setResult("");
                }}
                className="px-4 py-2 rounded-xl border border-white/15"
              >
                Nouveau
              </button>
            </div>
            <div className="text-xs text-white/50 mt-3">* Mode démo : texte de démonstration (MOCK_OPENAI activé)</div>
          </div>
        </div>
      )}
    </div>
  );
            }
