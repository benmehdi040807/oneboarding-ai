// components/ConnectModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ----------------------------- Types & helpers ---------------------------- */
type Lang = "fr" | "en" | "ar";

type CheckReply = {
  ok: boolean;
  planActive?: boolean; // membre avec plan actif ?
  devices?: {
    hasAnyDevice: boolean;
    deviceKnown: boolean;
    deviceCount: number;
    maxDevices: number;
  };
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
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
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

  const [lang, setLang] = useState<Lang>("fr");
  const t = useMemo(() => T[lang], [lang]);

  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);

  // Écran “1 €” uniquement pour membre existant + nouvel appareil
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
      const detail = (e as CustomEvent<DeviceAuthorizedDetail>).detail;
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

  /* --------------------------- Sync <dialog> natif --------------------------- */
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

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
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
  async function apiCheck(phoneE164: string): Promise<CheckReply> {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch("/api/auth/check", {
        method: "POST",
        credentials: "include", // s'assurer que le cookie de session part bien
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneE164, deviceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data?.error || `HTTP_${res.status}` };
      }
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
    } catch {
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
        throw new Error("NO_USER"); // non-membre → pas d’écran 1€
      }
      throw new Error(out?.error || `HTTP_${res.status}`);
    }
    const approval = out?.approvalUrl as string | undefined;
    if (!approval) throw new Error("NO_APPROVAL_URL");
    window.location.href = approval;
  }

  async function connectKnown() {
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

      const p = (phone || "").trim();
      if (!p.startsWith("+") || p.length < 6) {
        toast(t.INVALID_PHONE);
        setChecking(false);
        return;
      }
      try {
        localStorage.setItem("oneboarding.phoneE164", p);
      } catch {}

      // 1) Vérification côté serveur (session + device)
      const chk = await apiCheck(p);
      const deviceKnown = !!chk.devices?.deviceKnown;
      const planActive = !!chk.planActive;

      // a) Membre + appareil connu → connexion directe
      if (chk.ok && deviceKnown) {
        await connectKnown();
        return;
      }

      // b) Membre + nouvel appareil → proposer 1 €
      if (chk.ok && planActive && !deviceKnown) {
        const max = chk.devices?.maxDevices ?? 3;
        const cnt = chk.devices?.deviceCount ?? 0;
        setMaxDevices(max);
        setRevokeOldest(cnt >= max); // auto-cocher si limite atteinte
        setNeedOneEuro(true);
        return;
      }

      // c) NO_SESSION / SESSION_INVALID / non-membre → ouverture directe de l’activation
      toast(t.NOT_MEMBER);
      window.dispatchEvent(new Event("ob:open-activate"));
      handleClose();
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
      // retour de paiement → event ob:device-authorized (géré plus haut)
    } catch (e: any) {
      if (e?.message === "NO_USER") {
        toast(t.NOT_MEMBER);
        window.dispatchEvent(new Event("ob:open-activate"));
        handleClose();
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
      <style>{`dialog::backdrop{background:rgba(0,0,0,.45);-webkit-backdrop-filter:saturate(120%) blur(2px);backdrop-filter:saturate(120%) blur(2px);}`}</style>
      <dialog ref={dialogRef} onMouseDown={onBackdropClick} className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg">
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t.TITLE}</h2>
            <button
              type="button"
              onClick={handleClose}
              className="h-10 w-10 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-black/80 grid place-items-center text-xl"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {/* Saisie téléphone */}
          <label className="text-sm block mb-1">{t.PHONE_LABEL}</label>
          <input
            className="w-full px-3 py-2 rounded-xl border border-black/15 bg-black/[0.04] outline-none"
            placeholder={t.PHONE_PH}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {/* Écran principal */}
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

          {/* Écran “autoriser 1 €” — seulement membre existant + nouvel appareil */}
          {needOneEuro && (
            <div className="mt-4">
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
            </div>
          )}
        </div>
      </dialog>
    </>
  );
    }
