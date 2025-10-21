"use client";


import { useEffect, useMemo, useRef, useState } from "react";


/* ----------------------------- Types & helpers ---------------------------- */
type Lang = "fr" | "en" | "ar";


type CheckReply = {
ok: boolean;
// présence d’un plan actif (informative)
planActive?: boolean;
// état devices
devices?: {
hasAnyDevice: boolean;
deviceKnown: boolean;
deviceCount: number;
maxDevices: number;
};
// codes d’erreur potentiels
error?: string;
};


type DeviceAuthorizedDetail = {
status: "active" | "pending" | "failed";
phoneE164: string;
deviceId?: string;
planActive?: boolean;
paymentRef?: string;
source?: string;
};


function uuid4() {
return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
const r = (Math.random() * 16) | 0,
v = c === "x" ? r : (r & 0x3) | 0x8;
return v.toString(16);
});
}
const DEVICE_ID_KEY = "oneboarding.deviceId";
function getOrCreateDeviceId(): string {
try {
const cur = localStorage.getItem(DEVICE_ID_KEY);
if (cur) return cur;
const id = uuid4();
localStorage.setItem(DEVICE_ID_KEY, id);
return id;
} catch {
return "device-fallback";
}
}
function toast(msg: string) {
const el = document.createElement("div");
el.textContent = msg;
el.style.cssText =
"position:fixed;left:50%;transform:translateX(-50%);bottom:20px;" +
"background:rgba(12,16,28,.92);color:#fff;padding:10px 14px;" +
"border-radius:14px;border:1px solid rgba(255,255,255,.16);" +
"z-index:100000;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25)";
document.body.appendChild(el);
setTimeout(() => el.remove(), 1700);
}


/* --------------------------------- i18n ---------------------------------- */
const T: Record<Lang, any> = {
fr: {
TITLE: "Connexion sécurisée",
PHONE_LABEL: "Numéro de téléphone (membre)",
PHONE_PH: "+33 6 12 34 56 78",
INFO:
"Nous vérifions votre espace et votre appareil. Si c’est un nouvel appareil, nous vous proposerons une autorisation à 1 €.",
CANCEL: "Annuler",
CONTINUE: "Continuer",
REVOKE_HINT:
"Limite d’appareils atteinte ({max}/{max}). En continuant, le plus ancien appareil sera révoqué.",
REVOKE_OPT: "Révoquer l’appareil le plus ancien",
PAY_BTN: "Autoriser cet appareil (1 €)",
WELCOME_OK: "Bienvenue — appareil reconnu.",
NOT_MEMBER:
"Vous n’êtes pas encore membre. Utilisez « Activer mon espace » pour choisir votre formule.",
ERROR: "Une erreur est survenue. Réessayez.",
INVALID_PHONE: "Numéro invalide (format E.164, ex : +2126…).",
},
en: {
TITLE: "Secure sign-in",
PHONE_LABEL: "Phone number (member)",
PHONE_PH: "+1 415 555 2671",
INFO:
"We’ll check your space and device. If this is a new device, we’ll propose a €1 authorization.",
CANCEL: "Cancel",
CONTINUE: "Continue",
REVOKE_HINT:
"Device limit reached ({max}/{max}). Continuing will revoke the oldest device.",
REVOKE_OPT: "Revoke the oldest device",
PAY_BTN: "Authorize this device (€1)",
WELCOME_OK: "Welcome — device recognized.",
NOT_MEMBER:
"You are not a member yet. Use “Activate my space” to choose a plan.",
ERROR: "Something went wrong. Please try again.",
INVALID_PHONE: "Invalid number (E.164 format, e.g. +1415...).",
},
ar: {
TITLE: "تسجيل آمن",
PHONE_LABEL: "رقم الهاتف (عضو)",
PHONE_PH: "+212 6 12 34 56 78",
INFO:
"سنتحقق من حسابك وجهازك. إذا كان هذا جهازًا جديدًا، سنقترح تفويضًا بقيمة 1€.",
CANCEL: "إلغاء",
CONTINUE: "متابعة",
REVOKE_HINT:
"تم بلوغ الحد الأقصى للأجهزة ({max}/{max}). بالمتابعة سيتم إلغاء أقدم جهاز.",
REVOKE_OPT: "إلغاء أقدم جهاز",
PAY_BTN: "تفويض هذا الجهاز (1€)",
WELCOME_OK: "مرحبًا — تم التعرّف على الجهاز.",
NOT_MEMBER:
"لست عضوًا بعد. استخدم «تفعيل مساحتي» لاختيار الخطة.",
ERROR: "حدث خطأ. حاول مجددًا.",
INVALID_PHONE: "رقم غير صالح (صيغة E.164، مثال: +2126...).",
},
};


/* ------------------------------- Composant ------------------------------- */
export default function ConnectModal() {
const dialogRef = useRef<HTMLDialogElement | null>(null);
const [open, setOpen] = useState(false);


const [lang, setLang] = useState("fr");
const t = useMemo(() => T[lang], [lang]);


const [phone, setPhone] = useState("");
const [checking, setChecking] = useState(false);


// état “nouveau device”
const [needOneEuro, setNeedOneEuro] = useState(false);
const [revokeOldest, setRevokeOldest] = useState(false);
const [maxDevices, setMaxDevices] = useState(3);


// préremplissage du téléphone
useEffect(() => {
try {
const L = (localStorage.getItem("oneboarding.lang") as Lang) || "fr";
setLang(L);
const saved = localStorage.getItem("oneboarding.phoneE164") || "";
if (saved) setPhone(saved);
} catch {}
}, []);


/* ----------------------- Ouverture via événement global ----------------------- */
useEffect(() => {
const openEvt = () => setOpen(true);
window.addEventListener("ob:open-connect", openEvt);
return () => window.removeEventListener("ob:open-connect", openEvt);
}, []);


/* --- Succès d'autorisation (retour de paiement / webhook → event global) --- */
useEffect(() => {
const onAuthorized = (e: Event) => {
const detail = (e as CustomEvent).detail;
if (!detail || detail.status !== "active") return;


  try {
    localStorage.setItem("ob_connected", "1");
    localStorage.setItem("oneboarding.phoneE164", detail.phoneE164 || phone);
  } catch {}

  window.dispatchEvent(
    new CustomEvent("ob:set-connected", {
      detail: {
        phoneE164: detail.phoneE164 || phone,
        deviceId: detail.deviceId,
        planActive: detail.planActive,
        paymentRef: detail.paymentRef,
        source: detail.source || "ConnectModal",
      },
    })
  );

  toast(t.WELCOME_OK);
  handleClose();
};

window.addEventListener("ob:device-authorized", onAuthorized as EventListener);
return () => window.removeEventListener("ob:device-authorized", onAuthorized as EventListener);



}, [phone, t.WELCOME_OK]);


/* --------------------------- Sync 
 natif --------------------------- */
useEffect(() => {
const d = dialogRef.current;
if (!d) return;
if (open && !d.open) d.showModal();
else if (!open && d.open) d.close();
}, [open]);
useEffect(() => {
const d = dialogRef.current;
if (!d) return;
const onCancel = (e: Event) => {
e.preventDefault();
handleClose();
};
d.addEventListener("cancel", onCancel);
return () => d.removeEventListener("cancel", onCancel);
}, []);



const onBackdropClick = (e: React.MouseEvent) => {
const d = dialogRef.current;
if (!d) return;
const r = d.getBoundingClientRect();
const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
if (!inside) handleClose();
};


function handleClose() {
setOpen(false);
setChecking(false);
setNeedOneEuro(false);
setRevokeOldest(false);
}


/* --------------------------------- API calls -------------------------------- */
async function apiCheck(phoneE164: string): Promise {
try {
const deviceId = getOrCreateDeviceId();
const res = await fetch("/api/auth/check", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ phone: phoneE164, deviceId }),
});
const data = await res.json().catch(() => ({}));
if (!res.ok) {
return { ok: false, error: data?.error || HTTP_${res.status} };
}
// normaliser structure
const dev = data?.devices || {};
return {
ok: true,
planActive: !!data?.planActive,
devices: {
hasAnyDevice: !!dev.hasAnyDevice,
deviceKnown: !!dev.deviceKnown,
deviceCount: Number(dev.deviceCount || 0),
maxDevices: Number(dev.maxDevices || 3),
},
};
} catch (e) {
return { ok: false, error: "NETWORK" };
}
}


async function startOneEuro(phoneE164: string, revoke: boolean) {
const deviceId = getOrCreateDeviceId();
const res = await fetch("/api/pay/authorize-device", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ phoneE164, deviceId, revokeOldest: revoke }),
});
const out = await res.json().catch(() => ({}));
if (!res.ok || !out?.ok) {
if (out?.error === "NO_USER") {
// non-membre → suggérer activation
throw new Error("NO_USER");
}
throw new Error(out?.error || HTTP_${res.status});
}
const approval = out?.approvalUrl as string | undefined;
if (!approval) throw new Error("NO_APPROVAL_URL");
// redirection native (même onglet)
window.location.href = approval;
}


async function connectKnown() {
// marquer “connecté”
try {
localStorage.setItem("ob_connected", "1");
localStorage.setItem("oneboarding.phoneE164", phone);
} catch {}
window.dispatchEvent(new Event("ob:connected-changed"));
window.dispatchEvent(new CustomEvent("ob:set-connected", { detail: { phoneE164: phone, source: "ConnectModal" } }));
toast(t.WELCOME_OK);
handleClose();
}


/* --------------------------------- Flow UI --------------------------------- */
async function onContinue() {
try {
setChecking(true);


  // validation basique
  const p = (phone || "").trim();
  if (!p.startsWith("+") || p.length < 6) {
    toast(t.INVALID_PHONE);
    setChecking(false);
    return;
  }
  try {
    localStorage.setItem("oneboarding.phoneE164", p);
  } catch {}

  // 1) Tenter check côté serveur (deviceKnown / counts)
  const chk = await apiCheck(p);

  if (chk.ok && chk.devices?.deviceKnown) {
    await connectKnown();
    return;
  }

  // 2) Cas “nouvel appareil pour membre existant” → proposer 1 €
  //    Si /api/auth/check n’a pas répondu, on tentera directement l’ordre 1 € :
  const max = chk.devices?.maxDevices ?? 3;
  const cnt = chk.devices?.deviceCount ?? 0;
  setMaxDevices(max);

  // Auto-cocher la révocation si c’est (au moins) le 4ᵉ
  const autoRevoke = cnt >= max;
  setRevokeOldest(autoRevoke);

  setNeedOneEuro(true);
  // On reste dans la modale, l’utilisateur déclenchera “Autoriser (1 €)”
} catch {
  toast(t.ERROR);
} finally {
  setChecking(false);
}



}


async function onAuthorizeOneEuro() {
try {
setChecking(true);
await startOneEuro(phone, revokeOldest);
// Retour de paiement géré via event ob:device-authorized
} catch (e: any) {
if (e?.message === "NO_USER") {
toast(t.NOT_MEMBER);
} else {
toast(t.ERROR);
}
} finally {
setChecking(false);
}
}


/* ----------------------------------- JSX ----------------------------------- */
return (
<>








{t.TITLE}


×





      <label className="text-sm block mb-1">{t.PHONE_LABEL}</label>
      <input
        className="w-full px-3 py-2 rounded-xl border border-black/15 bg-black/[0.04] outline-none"
        placeholder={t.PHONE_PH}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {!needOneEuro && (
        <>
          <p className="text-xs text-black/70 mt-3">{t.INFO}</p>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-black/15 bg-black/5 hover:bg-black/10"
            >
              {t.CANCEL}
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={checking}
              className="px-4 py-2 rounded-2xl bg-black text-white font-semibold hover:bg-black/90 disabled:opacity-60"
            >
              {checking ? "…" : t.CONTINUE}
            </button>
          </div>
        </>
      )}

      {needOneEuro && (
        <div className="mt-4">
          {/* Alerte si limite atteinte */}
          {revokeOldest && (
            <div className="mb-3 p-3 rounded-xl border border-yellow-400/30 bg-yellow-300/15 text-black/85">
              {t.REVOKE_HINT.replaceAll("{max}", String(maxDevices))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              id="revokeOldest"
              type="checkbox"
              className="h-4 w-4"
              checked={revokeOldest}
              onChange={(e) => setRevokeOldest(e.target.checked)}
            />
            <label htmlFor="revokeOldest" className="text-sm">
              {t.REVOKE_OPT}
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-black/15 bg-black/5 hover:bg-black/10"
            >
              {t.CANCEL}
            </button>
            <button
              type="button"
              onClick={onAuthorizeOneEuro}
              disabled={checking}
              className="px-4 py-2 rounded-2xl bg-black text-white font-semibold hover:bg-black/90 disabled:opacity-60"
            >
              {checking ? "…" : t.PAY_BTN}
            </button>
          </div>

          {/* Non-membre → message discret (affiché via toast après NO_USER) */}
        </div>
      )}
    </div>
  </dialog>
</>



);
}
