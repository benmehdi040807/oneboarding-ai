// app/trademark/metadata.ts
import { TRADEMARK_META } from "@/lib/trademark/copy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: TRADEMARK_META.title,
  description: TRADEMARK_META.description,
  alternates: {
    canonical: TRADEMARK_META.canonical,
  },
  openGraph: {
    title: TRADEMARK_META.title,
    description: TRADEMARK_META.description,
    images: [TRADEMARK_META.ogImage],
    url: TRADEMARK_META.canonical,
    siteName: "OneBoarding AI",
  },
};
