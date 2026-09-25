import type { Language } from "@/hooks/use-language-preference"

/** Picks the Indonesian value when active and present, English otherwise. */
export function localize<T>(language: Language, en: T, id?: T): T {
  return language === "id" && id !== undefined ? id : en
}
