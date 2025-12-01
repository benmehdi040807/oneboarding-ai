// components/Footer.tsx
"use client";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="
        fixed inset-x-0 bottom-0 z-[40]
        border-t border-black/10
        bg-[rgba(17,24,39,0.08)]
        backdrop-blur-[6px]
        text-gray-600
        flex items-center justify-center
      "
      style={{
        height: "18px",
        paddingBottom: "max(env(safe-area-inset-bottom), 3px)",
      }}
    >
      <p className="text-[10px] tracking-tight leading-none text-center">
        OneBoarding AI® – Designed for the world – © 2025 – All rights reserved
      </p>
    </footer>
  );
}
