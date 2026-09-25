"use client"

import { createContext, useContext, useEffect, useState } from "react"

const STORAGE_KEY = "language"

export type Language = "en" | "id"

type LanguagePreference = {
  language: Language
  setLanguage: (language: Language) => void
}

const LanguagePreferenceContext = createContext<LanguagePreference | null>(null)

export function LanguagePreferenceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const nextLanguage = stored === "id" || stored === "en" ? stored : "en"

    if (nextLanguage === "en") {
      return
    }

    requestAnimationFrame(() => {
      setLanguageState(nextLanguage)
    })
  }, [])

  const setLanguage = (value: Language) => {
    setLanguageState(value)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, value)
    }
    document.documentElement.lang = value
  }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <LanguagePreferenceContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguagePreferenceContext.Provider>
  )
}

export function useLanguagePreference() {
  const context = useContext(LanguagePreferenceContext)
  if (!context) {
    return {
      language: "en" as Language,
      setLanguage: () => {},
    }
  }

  return context
}
