// components/ConnectModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ----------------------------- Types & helpers ---------------------------- */
type Lang = "fr" | "en" | "ar";

type CheckReply = {
  ok: boolean;
  planActive?: boolean; // mappé depuis spaceActive côté /api/auth/check (GET)
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
      "Nous vérifions votre espace et votre appareil. Si c’est un nouvel appareil, une confirmation par code s’affichera sur vos appareils déjà connectés.",
    CANCEL: "Annuler",
    CONTINUE: "Continuer",
    WELCOME_OK: "Bienvenue — appareil reconnu.",
    NOT_MEMBER:
      "Vous n’êtes pas encore membre. Utilisez « Activer mon espace » pour choisir votre formule.",
    ERROR: "Une erreur est survenue. Réessayez.",
    INVALID_PHONE: "Vérifiez votre numéro et réessayez.",
    LOADING: "…",
    BANNER_REDIRECTING: "Redirection vers l’activation…",
    PAIR_TITLE: "Autoriser ce nouvel appareil",
    PAIR_HINT:
      "Un code à 6 chiffres s’affiche sur vos appareils déjà connectés. Recopiez-le ici pour confirmer que c’est bien vous.",
    CODE_LABEL: "Code de sécurité",
    CODE_PH: "123456",
    SUBMIT: "Confirmer",
    TRY_AGAIN: "Renvoyer un code",
    INVALID_CODE: "Code invalide. Tentatives restantes : {n}.",
    EXPIRED: "Code expiré. Renvoyez un nouveau code.",
    SLOTS_FULL: "Limite d’appareils atteinte. Révoquez un appareil, puis réessayez.",
    START_FAIL: "Impossible de démarrer la vérification.",
    DEVICE_ALREADY_AUTHORIZED: "Cet appareil est déjà autorisé.",
  },
  en: {
    TITLE: "Secure sign-in",
    PHONE_LABEL: "Phone number (member)",
    PHONE_PH: "+1 415 555 2671",
    INFO:
      "We’ll check your space and device. If this is a new device, a 6-digit code will show on your already-connected devices.",
    CANCEL: "Cancel",
    CONTINUE: "Continue",
    WELCOME_OK: "Welcome — device recognized.",
    NOT_MEMBER:
      "You are not a member yet. Use “Activate my space” to choose a plan.",
    ERROR: "Something went wrong. Please try again.",
    INVALID_PHONE: "Please check your number and try again.",
    LOADING: "…",
    BANNER_REDIRECTING: "Redirecting to activation…",
    PAIR_TITLE: "Authorize this new device",
    PAIR_HINT:
      "A 6-digit code appears on your already-connected devices. Enter it here to confirm it’s you.",
    CODE_LABEL: "Security code",
    CODE_PH: "123456",
    SUBMIT: "Confirm",
    TRY_AGAIN: "Send a new code",
    INVALID_CODE: "Invalid code. Attempts left: {n}.",
    EXPIRED: "Code expired. Request a new one.",
    SLOTS_FULL: "Device limit reached. Revoke a device then try again.",
    START_FAIL: "Unable to start verification.",
    DEVICE_ALREADY_AUTHORIZED: "This device is already authorized.",
  },
  ar: {
    TITLE: "تسجيل آمن",
    PHONE_LABEL: "رقم الهاتف (عضو)",
    PHONE_PH: "+212 6 12 34 56 78",
    INFO:
      "سنتحقق من حسابك وجهازك. إذا كان هذا جهازًا جديدًا، سيظهر رمز من 6 أرقام على أجهزتك المتصلة مسبقًا.",
    CANCEL: "إلغاء",
    CONTINUE: "متابعة",
    WELCOME_OK: "مرحبًا — تم التعرّف على الجهاز.",
    NOT_MEMBER: "لست عضوًا بعد. استخدم «تفعيل مساحتي» لاختيار الخطة.",
    ERROR: "حدث خطأ. حاول مجددًا.",
    INVALID_PHONE: "تحقق من رقمك وحاول مرة أخرى.",
    LOADING: "…",
    BANNER_REDIRECTING: "جارٍ التحويل إلى التفعيل…",
    PAIR_TITLE: "تفويض هذا الجهاز الجديد",
    PAIR_HINT:
      "سيظهر رمز من 6 أرقام على أجهزتك المتصلة مسبقًا. أدخله هنا لتأكيد هويتك.",
    CODE_LABEL: "رمز الأمان",
    CODE_PH: "123456",
    SUBMIT: "تأكيد",
    TRY_AGAIN: "إرسال رمز جديد",
    INVALID_CODE: "رمز غير صحيح. المحاولات المتبقية: {n}.",
    EXPIRED: "انتهت صلاحية الرمز. اطلب رمزًا جديدًا.",
    SLOTS_FULL: "الحد الأقصى للأجهزة مُكتمل. ألغِ جهازًا ثم أعد المحاولة.",
    START_FAIL: "تعذّر بدء التحقق.",
    DEVICE_ALREADY_AUTHORIZED: "هذا الجهاز مصادق عليه بالفعل.",
  },
};

/* ------------------------------- Composant ------------------------------- */
export default function ConnectModal() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const redirectTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);

  const [lang, setLang] = useState<Lang>("fr");
  const t = useMemo(() => T[lang], [lang]);

  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);

  // État PAIRING v2 (remplace l’ancien 1 €)
  const [pairingActive, setPairingActive] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(5);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState("");

  // Bandeau "non membre" + erreur inline
  const [showNonMember, setShowNonMember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // préremplissage + langue
  useEffect(() => {
    try {
      const L = (localStorage.getItem("oneboarding.lang") as Lang) || "fr";
      setLang(L);
      const saved = localStorage.getItem("oneboarding.phoneE164") || "";
      if (saved) setPhone(saved);
    } catch {}
  }, []);

  // écoute des changements de langue (depuis Menu) + refocus input
  useEffect(() => {
    const onLang = (e: Event) => {
      const L =
        ((e as CustomEvent).detail?.lang as Lang) ||
        (localStorage.getItem("oneboarding.lang") as Lang) ||
        "fr";
      setLang(L);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener("ob:lang-changed", onLang as EventListener);
    return () => window.removeEventListener("ob:lang-changed", onLang as EventListener);
  }, []);

  /* ----------------------- Ouverture via événement global ----------------------- */
  useEffect(() => {
    const openEvt = () => setOpen(true);
    window.addEventListener("ob:open-connect", openEvt);
    return () => window.removeEventListener("ob:open-connect", openEvt);
  }, []);

  /* --- Succès d'autorisation (event global) --- */
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

  // Autofocus à l’ouverture de la modale
  useEffect(() => {
    if (open) setTimeout(() => (pairingActive ? codeInputRef.current?.focus() : inputRef.current?.focus()), 60);
  }, [open, pairingActive]);

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

  function clearTimer() {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  }

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
    setShowNonMember(false);
    setError(null);
    clearTimer();
    // reset pairing
    setPairingActive(false);
    setChallengeId(null);
    setAttemptsLeft(5);
    setExpiresAt(null);
    setCode("");
  }

  /* --------------------------------- API calls -------------------------------- */
  // ⬇️ PATCH: utilise GET + cookie de session + header x-ob-device-id, et mappe spaceActive -> planActive
  async function apiCheck(): Promise<CheckReply> {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch("/api/auth/check", {
        method: "GET",
        credentials: "include",
        headers: { "x-ob-device-id": deviceId },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data?.error || `HTTP_${res.status}` };
      }
      const dev = data?.devices || {};
      return {
        ok: true,
        // /api/auth/check renvoie spaceActive → on le mappe vers planActive attendu par le flux
        planActive: !!data?.spaceActive,
        devices: {
          hasAnyDevice: Number(dev.deviceCount || 0) > 0,
          deviceKnown: !!dev.deviceKnown,
          deviceCount: Number(dev.deviceCount || 0),
          maxDevices: Number(dev.maxDevices || 3),
        },
      };
    } catch {
      return { ok: false, error: "NETWORK" };
    }
  }

  async function startPairing(phoneE164: string) {
    const newDeviceId = getOrCreateDeviceId();
    const res = await fetch("/api/pairing/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ phoneE164, newDeviceId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      const err = data?.error || `HTTP_${res.status}`;
      throw new Error(err);
    }
    return data as {
      ok: true;
      challengeId: string;
      expiresAt: string;
      attemptsLeft: number;
      alreadyPending: boolean;
      note: "CODE_VISIBLE_ON_AUTH_DEVICES";
    };
  }

  async function confirmPairing(code6: string) {
    if (!challengeId) throw new Error("NO_CHALLENGE");
    const res = await fetch("/api/pairing/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ challengeId, code: code6 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `HTTP_${res.status}`);
    }
    return data as
      | { ok: true; authorized: true; userId: string; newDeviceId: string }
      | {
          ok: true;
          authorized: false;
          error: "SLOTS_FULL" | "INVALID_CODE" | "EXPIRED" | "NO_CHALLENGE";
          attemptsLeft?: number;
        };
  }

  async function connectKnown() {
    try {
      localStorage.setItem("ob_connected", "1");
      localStorage.setItem("oneboarding.phoneE164", phone);
    } catch {}
    window.dispatchEvent(new Event("ob:connected-changed"));
    window.dispatchEvent(
      new CustomEvent("ob:set-connected", { detail: { phoneE164: phone, source: "ConnectModal" } })
    );
    toast(t.WELCOME_OK);
    handleClose();
  }

  /* --------------------------------- Flow UI --------------------------------- */
  async function onContinue() {
    try {
      setChecking(true);
      setError(null);

      const p = (phone || "").trim();
      // On garde la vérif téléphone (utilisé par /pairing/start)
      if (!p || !p.startsWith("+") || p.length < 10) {
        setError(t.INVALID_PHONE);
        inputRef.current?.focus();
        setChecking(false);
        return;
      }
      try {
        localStorage.setItem("oneboarding.phoneE164", p);
      } catch {}

      // 1) Vérification côté serveur (session+cookie, device via header)
      const chk = await apiCheck(); // ⬅️ plus de paramètre ici
      const deviceKnown = !!chk.devices?.deviceKnown;
      const planActive = !!chk.planActive;

      // a) Membre + appareil connu → connexion directe
      if (chk.ok && deviceKnown) {
        await connectKnown();
        return;
      }

      // b) Membre + nouvel appareil → Pairing v2
      if (chk.ok && planActive && !deviceKnown) {
        try {
          const started = await startPairing(p);
          setPairingActive(true);
          setChallengeId(started.challengeId);
          setAttemptsLeft(started.attemptsLeft ?? 5);
          setExpiresAt(started.expiresAt);
          setTimeout(() => codeInputRef.current?.focus(), 60);
          return;
        } catch (e: any) {
          const msg = String(e?.message || "");
          if (msg === "SLOTS_FULL") setError(t.SLOTS_FULL);
          else if (msg === "DEVICE_ALREADY_AUTHORIZED") setError(t.DEVICE_ALREADY_AUTHORIZED);
          else setError(t.START_FAIL);
          return;
        }
      }

      // c) NO_USER / non-membre → afficher bandeau puis basculer
      setShowNonMember(true);
      clearTimer();
      redirectTimerRef.current = window.setTimeout(() => {
        setShowNonMember(false);
        window.dispatchEvent(new Event("ob:open-activate"));
        handleClose();
      }, 2600);
    } catch {
      toast(t.ERROR);
    } finally {
      setChecking(false);
    }
  }

  async function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    const code6 = (code || "").replace(/[^\d]/g, "");
    if (code6.length !== 6) {
      setError(t.INVALID_PHONE); // message générique court
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const out = await confirmPairing(code6);
      if (out.ok && (out as any).authorized) {
        await connectKnown();
        return;
      }
      const err = (out as any).error as string | undefined;
      if (err === "INVALID_CODE") {
        const n = (out as any).attemptsLeft ?? attemptsLeft - 1;
        setAttemptsLeft(n);
        setError(t.INVALID_CODE.replace("{n}", String(n)));
        return;
      }
      if (err === "EXPIRED") {
        setError(t.EXPIRED);
        return;
      }
      if (err === "SLOTS_FULL") {
        setError(t.SLOTS_FULL);
        return;
      }
      setError(t.START_FAIL);
    } catch {
      setError(t.ERROR);
    } finally {
      setChecking(false);
    }
  }

  /* ----------------------------------- JSX ----------------------------------- */
  return (
    <>
      <style>{`dialog::backdrop{background:rgba(0,0,0,.45);-webkit-backdrop-filter:saturate(120%) blur(2px);backdrop-filter:saturate(120%) blur(2px);}`}</style>
      <dialog
        ref={dialogRef}
        onMouseDown={onBackdropClick}
        className="m-0 p-0 rounded-3xl border border-black/10 w-[92vw] max-w-lg"
      >
        <div className="p-4 sm:p-6 bg-white text-black rounded-3xl" dir={lang === "ar" ? "rtl" : "ltr"}>
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

          {/* Étape 1 : saisie téléphone */}
          {!pairingActive && (
            <>
              <label className="text-sm block mb-1">{t.PHONE_LABEL}</label>
              <div dir="ltr">
                <input
                  ref={inputRef}
                  className="w-full px-3 py-2 rounded-xl border border-black/15 bg-black/[0.04] outline-none"
                  placeholder={t.PHONE_PH}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError(null);
                  }}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              {error && (
                <div className="mt-2 text-sm text-red-600" role="status" aria-live="polite">
                  {error}
                </div>
              )}

              {showNonMember && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mt-3 rounded-xl border border-amber-300/40 bg-amber-100 text-amber-900 px-3 py-2 text-sm"
                >
                  {t.NOT_MEMBER} <span className="opacity-75">{t.BANNER_REDIRECTING}</span>
                </div>
              )}

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
                  {checking ? t.LOADING : t.CONTINUE}
                </button>
              </div>
            </>
          )}

          {/* Étape 2 : saisie du code (Pairing v2) */}
          {pairingActive && (
            <form onSubmit={onSubmitCode} className="mt-2">
              <h3 className="text-base font-semibold">{t.PAIR_TITLE}</h3>
              <p className="text-sm text-black/80 mt-1">{t.PAIR_HINT}</p>

              <label className="text-sm block mt-3 mb-1">{t.CODE_LABEL}</label>
              <input
                ref={codeInputRef}
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder={t.CODE_PH}
                value={code}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "").slice(0, 6);
                  setCode(v);
                  setError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-black/15 bg-black/[0.04] outline-none tracking-[0.3em] text-center text-lg"
              />

              {expiresAt && (
                <div className="mt-2 text-xs text-black/60">
                  TTL : jusqu’au {new Date(expiresAt).toLocaleString()}
                </div>
              )}

              {error && (
                <div className="mt-2 text-sm text-red-600" role="status" aria-live="polite">
                  {error}
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // réinitialiser et renvoyer un nouveau challenge
                    setPairingActive(false);
                    setChallengeId(null);
                    setAttemptsLeft(5);
                    setExpiresAt(null);
                    setCode("");
                    // relance onContinue() pour rejouer la logique (device inconnu → startPairing)
                    onContinue();
                  }}
                  className="px-3 py-2 rounded-xl border border-black/15 bg-black/5 hover:bg-black/10 text-sm"
                >
                  {t.TRY_AGAIN}
                </button>
                <button
                  type="submit"
                  disabled={checking || code.replace(/[^\d]/g, "").length !== 6}
                  className="px-4 py-2 rounded-2xl bg-black text-white font-semibold hover:bg-black/90 disabled:opacity-60"
                >
                  {checking ? t.LOADING : t.SUBMIT}
                </button>
              </div>

              <div className="mt-2 text-xs text-black/60">
                {attemptsLeft < 5 ? t.INVALID_CODE.replace("{n}", String(attemptsLeft)) : ""}
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
            }
