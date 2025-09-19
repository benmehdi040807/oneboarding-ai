import dynamic from "next/dynamic";
const AppMvp = dynamic(() => import("@/components/AppMvp"), { ssr: false });

export default function Page() {
  return <AppMvp />;
}
