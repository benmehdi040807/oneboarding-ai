import fr from "@/i18n/fr";
import en from "@/i18n/en";
import ar from "@/i18n/ar";

export type Locale = "fr" | "en" | "ar";
export function getDict(locale: Locale) {
  return locale === "en" ? en : locale === "ar" ? ar : fr;
}
