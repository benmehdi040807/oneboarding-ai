// app/page.tsx
import dynamic from "next/dynamic";

// Client-only components
const AppMvp = dynamic(() => import("@/components/AppMvp"), { ssr: false });
const LegalBar = dynamic(() => import("@/components/LegalBar"), { ssr: false });

export default function Page() {
  return (
    <>
      <AppMvp />
      <LegalBar />
    </>
  );
}
