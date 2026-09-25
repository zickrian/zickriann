"use client"

import { useLanguagePreference } from "@/hooks/use-language-preference"

import { getDictionary } from "./dictionary"
import { localize } from "./localize"

/** Client-only: current language, its dictionary, and the `localize` picker. */
export function useTranslation() {
  const { language } = useLanguagePreference()
  const t = getDictionary(language)

  return {
    language,
    t,
    l: <T,>(en: T, id?: T) => localize(language, en, id),
  }
}
