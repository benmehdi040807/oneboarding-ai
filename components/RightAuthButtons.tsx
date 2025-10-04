// ==============================
// Auth natif "phone + OTP" + PayPal abonnement (5 €)
// Next.js 14+ (App Router) — TypeScript
// Composants client + routes API stubs
// ==============================
// Notes d'implémentation (à lire une fois) :
// - Identité = numéro de téléphone (E.164). Aucun prénom/nom demandé.
// - Abonnement PayPal mensuel (5 €) AVANT l'envoi d'OTP.
// - OTP 6 caractères alphanum (A–Z, 0–9), validité 5 minutes, usage unique.
// - Transport OTP conseillé : WhatsApp Cloud API (fallback SMS si besoin).
// - Données minimales : phone, status (paid/free), codeHash, expiresAt.
// - Côté client : localStorage.ob_connected = "1" quand connecté.
// - Sécurité : throttling par IP et par phone (ex. 3 req / 5 min),
//   hash du code côté serveur, compare en timing-safe, webhooks PayPal.
// - À remplacer : mocks KV/WhatsApp par vos providers (Vercel KV/Upstash, Meta, etc.).


// ==============================
// lib/phone.ts — normalisation & validation E.164
// ==============================
export function normalizeToE164(countryDial: string, national: string) {
const d = countryDial.replace(/[^0-9]/g, '');
const n = national.replace(/[^0-9]/g, '');
if (!d || !n) throw new Error('INVALID_PHONE_INPUT');
// Contrôle basique ; pour la prod, utiliser libphonenumber-js
const e164 = +${d}${n};
if (e164.length < 8 || e164.length > 16) throw new Error('INVALID_E164');
return e164;
}


// ==============================
// lib/otp.ts — génération & hash
// ==============================
import crypto from 'node:crypto';


const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/I/1
export function generateOtp(len = 6) {
const bytes = crypto.randomBytes(len);
let out = '';
for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
return out;
}


export function hashOtp(otp: string) {
return crypto.createHash('sha256').update(otp).digest('hex');
}


export function timingSafeEqualHash(a: string, b: string) {
const A = Buffer.from(a, 'hex');
const B = Buffer.from(b, 'hex');
if (A.length !== B.length) return false;
return crypto.timingSafeEqual(A, B);
}


// ==============================
// lib/kv.ts — stockage minimal (remplacer par Vercel KV/Redis)
// ==============================
// Structure :
//   otp:{phone} -> { codeHash, expiresAt: number }
//   user:{phone} -> { status: 'paid' | 'free', payerId?: string }


const mem = new Map<string, any>();


export const kv = {
async get(key: string): Promise<T | null> { return (mem.get(key) ?? null) as T | null; },
async set(key: string, value: T): Promise { mem.set(key, value); },
async del(key: string): Promise { mem.delete(key); },
};


// ==============================
// lib/whatsapp.ts — envoi OTP (stub)
// ==============================
// Remplacer par Meta WhatsApp Cloud API (messages)
export async function sendOtpViaWhatsApp(toE164: string, code: string) {
// TODO: implémenter l'appel HTTP vers Graph API
console.log([DEV] WhatsApp → ${toE164}: votre code est ${code});
return true;
}


// ==============================
// app/api/otp/request/route.ts — demande d'OTP (après paiement réussi OU gratuit total)
// ==============================
import { NextRequest, NextResponse } from 'next/server';
import { generateOtp, hashOtp } from '@/lib/otp';
import { kv } from '@/lib/kv';
import { sendOtpViaWhatsApp } from '@/lib/whatsapp';


export async function POST(req: NextRequest) {
try {
const { phoneE164 } = await req.json();
if (!phoneE164 || typeof phoneE164 !== 'string' || !phoneE164.startsWith('+')) {
return NextResponse.json({ ok: false, error: 'INVALID_PHONE' }, { status: 400 });
}


// (Optionnel) Vérifier statut d'abonnement : user:phone
const user = await kv.get<{ status: 'paid' | 'free' }>(`user:${phoneE164}`);
if (!user || user.status !== 'paid') {
  return NextResponse.json({ ok: false, error: 'PAYMENT_REQUIRED' }, { status: 402 });
}

const code = generateOtp(6);
const codeHash = hashOtp(code);
const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

await kv.set(`otp:${phoneE164}`, { codeHash, expiresAt });

await sendOtpViaWhatsApp(phoneE164, code);

return NextResponse.json({ ok: true });



} catch (e: any) {
return NextResponse.json({ ok: false, error: e?.message ?? 'SERVER_ERROR' }, { status: 500 });
}
}


// ==============================
// app/api/otp/verify/route.ts — vérification du code
// ==============================
import { timingSafeEqualHash, hashOtp } from '@/lib/otp';


export async function POST(req: NextRequest) {
try {
const { phoneE164, code } = await req.json();
if (!phoneE164 || typeof phoneE164 !== 'string' || !code) {
return NextResponse.json({ ok: false, error: 'INVALID_INPUT' }, { status: 400 });
}


const rec = await kv.get<{ codeHash: string; expiresAt: number }>(`otp:${phoneE164}`);
if (!rec) return NextResponse.json({ ok: false, error: 'NO_OTP' }, { status: 400 });
if (Date.now() > rec.expiresAt) return NextResponse.json({ ok: false, error: 'EXPIRED' }, { status: 400 });

const ok = timingSafeEqualHash(rec.codeHash, hashOtp(String(code).trim().toUpperCase()));
if (!ok) return NextResponse.json({ ok: false, error: 'BAD_CODE' }, { status: 400 });

// OTP single-use : supprimer
await kv.del(`otp:${phoneE164}`);

// Retourner un token minimal (ici: JWT-like mock)
const token = Buffer.from(JSON.stringify({ sub: phoneE164, iat: Date.now() }), 'utf8').toString('base64url');
return NextResponse.json({ ok: true, token });



} catch (e: any) {
return NextResponse.json({ ok: false, error: e?.message ?? 'SERVER_ERROR' }, { status: 500 });
}
}


// ==============================
// app/api/paypal/webhook/route.ts — marquage "paid" après évènement valide
// ==============================
// ⚠️ À sécuriser avec la vérification de la signature PayPal et le type d'évènement (paiement d'abonnement approuvé)
import { kv } from '@/lib/kv';


export async function POST(req: NextRequest) {
try {
const body = await req.json();
// TODO: vérifier signature via headers + endpoint PayPal webhook verify
// TODO: distinguer event types (BILLING.SUBSCRIPTION.ACTIVATED, PAYMENT.SALE.COMPLETED…)


const payerId: string | undefined = body?.resource?.subscriber?.payer_id;
const customPhone: string | undefined = body?.resource?.custom_id; // cf. createSubscription → custom_id

if (!payerId || !customPhone) return NextResponse.json({ ok: false, error: 'INVALID_EVENT' }, { status: 400 });

await kv.set(`user:${customPhone}`, { status: 'paid', payerId });
return NextResponse.json({ ok: true });



} catch (e: any) {
return NextResponse.json({ ok: false, error: e?.message ?? 'SERVER_ERROR' }, { status: 500 });
}
}


// ==============================
// app/components/SubscribeDialog.tsx — O bleu (Créer mon espace)
// ==============================
'use client';
import { useEffect, useMemo, useState } from 'react';
import Script from 'next/script';
import { normalizeToE164 } from '@/lib/phone';


interface Props {
open: boolean;
onClose: () => void;
paypalClientId: string; // process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
planId: string; // ID du plan d'abonnement PayPal (5 € / mois)
}


export default function SubscribeDialog({ open, onClose, paypalClientId, planId }: Props) {
const [countryDial, setCountryDial] = useState('212'); // Maroc par défaut
const [national, setNational] = useState('');
const [phoneE164, setPhoneE164] = useState('');
const [error, setError] = useState<string | null>(null);
const [paid, setPaid] = useState(false);


useEffect(() => {
if (!open) {
setCountryDial('212'); setNational(''); setPhoneE164(''); setPaid(false); setError(null);
}
}, [open]);


const paypalSrc = useMemo(() => https://www.paypal.com/sdk/js?components=buttons,subscriptions&vault=true&intent=subscription&client-id=${paypalClientId}&locale=fr_FR, [paypalClientId]);


const onNormalize = () => {
try { setPhoneE164(normalizeToE164(countryDial, national)); setError(null); } catch { setError('Numéro invalide'); }
};


async function requestOtp() {
const res = await fetch('/api/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneE164 }) });
const j = await res.json();
if (!res.ok) { setError(j.error || 'Erreur OTP'); return; }
alert('Code envoyé sur WhatsApp.');
onClose();
}


return (
<div className={fixed inset-0 ${open ? '' : 'hidden'} z-50 flex items-center justify-center bg-black/60}>



Créer mon espace



    <label className="block text-sm mb-1">Pays</label>
    <select className="w-full rounded-xl border p-2 mb-3" value={countryDial} onChange={e => setCountryDial(e.target.value)}>
      {/* Club des 33 : ajouter vos pays en priorité */}
      <option value="212">Maroc (+212)</option>
      <option value="33">France (+33)</option>
      <option value="34">Espagne (+34)</option>
      <option value="39">Italie (+39)</option>
      <option value="44">Royaume-Uni (+44)</option>
      <option value="1">États-Unis/Canada (+1)</option>
      {/* … compléter au besoin */}
    </select>

    <label className="block text-sm mb-1">Préfixe</label>
    <input type="tel" inputMode="numeric" placeholder="ex. 06" className="w-full rounded-xl border p-2 mb-3" onBlur={onNormalize} onChange={e => setNational(prev => (e.target.value + (national.slice(e.target.value.length))))} />

    <label className="block text-sm mb-1">Numéro</label>
    <input type="tel" inputMode="numeric" placeholder="ex. 11223344" className="w-full rounded-xl border p-2 mb-3" value={national} onChange={e => setNational(e.target.value)} onBlur={onNormalize} />

    <div className="text-xs text-gray-600 mb-3">Identité = numéro de téléphone. Aucun nom/prénom requis.</div>

    {phoneE164 && (
      <div className="mb-4 rounded-xl bg-gray-50 p-3 text-sm">Numéro détecté : <span className="font-mono">{phoneE164}</span></div>
    )}

    {/* PayPal Smart Buttons (Subscription) */}
    <Script src={paypalSrc} strategy="lazyOnload" />
    <div id="paypal-buttons" className="mb-3" />
    <Script id="paypal-init" strategy="lazyOnload">
      {`
        (function init(){
          if (!window.paypal || !document.getElementById('paypal-buttons')) { setTimeout(init, 300); return; }
          window.paypal.Buttons({
            style: { shape: 'rect', label: 'subscribe', layout: 'vertical' },
            onClick: () => {
              const phoneEl = document.querySelector('[data-phone-e164]');
            },
            createSubscription: function(data, actions) {
              const phone = '${phoneE164}';
              if (!phone) { alert('Veuillez renseigner un numéro valide'); return; }
              return actions.subscription.create({
                plan_id: '${planId}',
                custom_id: phone // important pour marquer l’utilisateur dans le webhook
              });
            },
            onApprove: function(data, actions) {
              // L’évènement final (activation paiement) viendra par webhook.
              // Mais on peut déclencher la demande OTP côté client pour accélérer.
              fetch('/api/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneE164: '${phoneE164}' }) })
                .then(r => r.json()).then(j => {
                  if (j.ok) alert('Paiement ok. Code envoyé via WhatsApp.'); else alert('Paiement ok, mais OTP non envoyé: ' + (j.error||''));
                });
            },
            onError: function(err) {
              alert('Erreur PayPal'); console.error(err);
            }
          }).render('#paypal-buttons');
        })();
      `}
    </Script>

    <button
      disabled={!phoneE164 || !paid}
      onClick={requestOtp}
      className="w-full rounded-xl bg-black/90 px-4 py-2 text-white disabled:opacity-40"
    >Recevoir mon code</button>

    {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

    <div className="mt-4 flex justify-end">
      <button onClick={onClose} className="text-sm underline">Fermer</button>
    </div>
  </div>
</div>



);
}


// ==============================
// app/components/CodeAccessDialog.tsx — O doré (Connexion / Déconnexion)
// ==============================
'use client';
import { useEffect, useState } from 'react';


interface AccessProps {
open: boolean;
onClose: () => void;
phoneE164: string; // facultatif si vous voulez code seul ; ici on éduque à saisir le tel + code
}


export function CodeAccessDialog({ open, onClose, phoneE164: preset }: AccessProps) {
const [phoneE164, setPhoneE164] = useState(preset || '');
const [code, setCode] = useState('');
const [error, setError] = useState<string | null>(null);


useEffect(() => { if (!open) { setCode(''); setError(null); } }, [open]);


async function verify() {
const res = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneE164, code }) });
const j = await res.json();
if (!res.ok || !j.ok) { setError(j.error || 'Code invalide'); return; }
localStorage.setItem('ob_connected', '1');
localStorage.setItem('ob_token', j.token);
onClose();
}


return (
<div className={fixed inset-0 ${open ? '' : 'hidden'} z-50 flex items-center justify-center bg-black/60}>



Se connecter



    <label className="block text-sm mb-1">Numéro (E.164)</label>
    <input className="w-full rounded-xl border p-2 mb-3 font-mono" placeholder="+2126…" value={phoneE164} onChange={e => setPhoneE164(e.target.value)} />

    <label className="block text-sm mb-1">Code d’accès (5 min)</label>
    <input className="w-full rounded-xl border p-2 mb-3 font-mono uppercase" maxLength={8} value={code} onChange={e => setCode(e.target.value.toUpperCase())} />

    <button onClick={verify} className="w-full rounded-xl bg-amber-600 px-4 py-2 text-white">Valider</button>

    {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

    <div className="mt-4 text-sm text-center">
      <button className="underline" onClick={() => {
        fetch('/api/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneE164 }) })
          .then(r => r.json()).then(j => alert(j.ok ? 'Nouveau code envoyé.' : 'Erreur: '+(j.error||'')));
      }}>Recevoir un nouveau code</button>
    </div>

    <div className="mt-4 flex justify-end">
      <button onClick={onClose} className="text-sm underline">Fermer</button>
    </div>
  </div>
</div>



);
}


// ==============================
// app/components/RightAuthButtons.tsx — rôles définitifs (version cercle "O" + sans bannière)
// ==============================
'use client';
import { useEffect, useState } from 'react';
import SubscribeDialog from '@/app/components/SubscribeDialog';
import { CodeAccessDialog } from '@/app/components/CodeAccessDialog';


export default function RightAuthButtons() {
const [connected, setConnected] = useState(false);
const [openSub, setOpenSub] = useState(false);
const [openCode, setOpenCode] = useState(false);


useEffect(() => {
const load = () => setConnected(localStorage.getItem('ob_connected') === '1');
load();
const onChange = () => load();
window.addEventListener('ob:connected-changed', onChange);
return () => window.removeEventListener('ob:connected-changed', onChange);
}, []);


const circle =
'h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--chip-bg)] ' +
'hover:bg-[var(--chip-hover)] grid place-items-center transition select-none';


function logout() {
localStorage.removeItem('ob_connected');
localStorage.removeItem('ob_token');
window.dispatchEvent(new Event('ob:connected-changed'));
}


return (
<>


{/* O bleu — Créer mon espace */}
<button
type="button"
aria-label="Créer mon espace"
onClick={() => setOpenSub(true)}
className={circle}
title="Créer mon espace"
>
<span
className="text-xl font-extrabold"
style={{
lineHeight: 1,
background: 'linear-gradient(90deg,#3b82f6,#06b6d4)',
WebkitBackgroundClip: 'text',
WebkitTextFillColor: 'transparent',
}}
>
O





    {/* O doré — Se connecter / Se déconnecter */}
    {!connected ? (
      <button
        type="button"
        aria-label="Se connecter"
        className={circle}
        onClick={() => setOpenCode(true)}
        title="Se connecter"
      >
        <span
          className="text-xl font-extrabold"
          style={{
            lineHeight: 1,
            background: 'linear-gradient(90deg,#FFD451,#EABE3F,#D9D1C0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          O
        </span>
      </button>
    ) : (
      <button
        type="button"
        aria-label="Se déconnecter"
        className={circle}
        onClick={logout}
        title="Se déconnecter"
      >
        <span
          className="text-xl font-extrabold"
          style={{
            lineHeight: 1,
            background: 'linear-gradient(90deg,#FFD451,#EABE3F,#D9D1C0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          O
        </span>
      </button>
    )}
  </div>

  {/* Plus de bannière de bienvenue : on reste 100% natif */}

  {/* Dialogues natifs */}
  <SubscribeDialog
    open={openSub}
    onClose={() => setOpenSub(false)}
    paypalClientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string}
    planId={process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID as string}
  />
  <CodeAccessDialog open={openCode} onClose={() => setOpenCode(false)} phoneE164="" />
</>



);
}


// ==============================
// app/layout.tsx — retirer le bandeau de bienvenue, style minimal
// ==============================
import RightAuthButtons from '@/app/components/RightAuthButtons';


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (





OneBoarding AI



{children}


);
}



// ==============================
// .env.local (exemple)
// ==============================
// NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id
// NEXT_PUBLIC_PAYPAL_PLAN_ID=P-xxxxxxxx (plan 5 € / mois)
// WHATSAPP_TOKEN=xxx
// WHATSAPP_PHONE_ID=xxx
// PAYPAL_WEBHOOK_ID=xxx


// ==============================
// Points à finaliser pour la prod
// ==============================
// - Vérification cryptographique du webhook PayPal (headers + verify API)
// - Vrai KV (Upstash / Vercel KV) et quotas anti-abus
// - WhatsApp Cloud API (messages endpoint) + fallback SMS (Twilio/Vonage)
// - libphonenumber-js pour validation solide (pays, longueur, préfixes)
// - UI : toasts non bloquants au lieu de alert()
// - Accessibilité : focus trap dans les dialogues
// - Sécurité : CSRF, CORS, rate limit, logs
  
