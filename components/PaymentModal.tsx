"use client";

type Props = {
  open?: boolean;
  onClose?: () => void;
  plan?: "subscription" | "one-month";
  phoneE164?: string;
};

export default function PaymentModal(_props: Props) {
  // Stub temporaire : aucune UI tant qu’on n’active pas PayPal
  return null;
}
