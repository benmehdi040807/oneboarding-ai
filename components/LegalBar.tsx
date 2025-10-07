// components/LegalBar.tsx
"use client";
import Link from "next/link";

export default function LegalBar() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[2000] text-center text-sm py-3 backdrop-blur-[6px]"
      style={{
        background: "rgba(0,0,0,0.35)",
        color: "rgba(255,255,255,0.85)",
        borderTop: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <Link
        href="/legal"
        className="hover:text-white transition underline underline-offset-4"
      >
        CGU / Privacy
      </Link>
    </div>
  );
}
