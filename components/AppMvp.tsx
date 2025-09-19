"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getDict, type Locale } from "@/lib/i18n";

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
];

const PLANS = [
  { id: "free", label: "Freemium", price: "Gratuit", desc: "Découverte (limité)", color: "bg-gray-800" },
  { id: "pro", label: "Pro", price: "33€/mois", desc: "Biographie complète", color: "bg-emerald-700" },
  { id: "team", label: "Entreprise", price: "200–330€/mois", desc: "Mémoire partagée", color: "bg-indigo-700" },
];

// Loader (spinner)
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

  // Hero (facultatif; off pour l’instant)
  const [showHero, setShowHero] = useState(false);

  const [step, setStep] = useState(1);
  const [templateId, setTemplateId] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProfile((p: any) => ({ ...p, locale }));
  }, [locale]);

  const template = useMemo(() => TEMPLATES.find((t) => t.id === templateId) || null, [templateId]);

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
    } catch {
      alert("Impossible de copier");
    }
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

      {/* Hero (si activé) */}
      {showHero && (
        <section className="relative overflow-hidden border-b border-white/10 fade-in">
          <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl">
              <div className="text-sm uppercase tracking-widest text-white/50 mb-2">Démo</div>
              <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                Votre <span className="text-white/80">ticket d’embarquement</span> vers l’IA personnalisée
              </h1>
              <p className="text-white/70 mt-3">
                Remplissez 3 champs ou choisissez un exemple. Le résultat s’affiche immédiatement en mode{" "}
                <span className="font-medium">démo</span>.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowHero(false);
                    setStep(1);
                  }}
                  className="px-5 py-3 rounded-xl bg-white text-black font-medium"
                >
                  Commencer la démo
                </button>
              </div>
              <div className="text-xs text-white/50 mt-3">* Mode démo : texte de démonstration (MOCK_OPENAI activé)</div>
            </div>
          </div>
        </section>
      )}

      {/* Étape 1 */}
      {step === 1 && !showHero && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="rounded-2xl bg-white/5 border border-white/10 shadow-sm p-5 fade-in">
            <h2 className="text-xl font-semibold mb-3">{t.whatToGenerate}</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
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
          </div>
        </div>
      )}

      {/* Étape 2 */}
      {step === 2 && !showHero && template && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="rounded-2xl bg-white/5 border border-white/10 shadow-sm p-5 fade-in">
            <h2 className="text-xl font-semibold mb-4">{template.label}</h2>
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

      {/* Étape 3 */}
      {step === 3 && !showHero && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="rounded-2xl bg-white/5 border border-white/10 shadow-sm p-5 fade-in">
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
              <button
                onClick={copyResult}
                className="px-4 py-2 rounded-xl bg-white text-black font-medium"
              >
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
