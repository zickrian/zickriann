"use client"

import { createContext, useContext, useState } from "react"

const STORAGE_KEY = "sound-enabled"

type SoundPreference = {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

const SoundPreferenceContext = createContext<SoundPreference | null>(null)

function readStoredPreference() {
  if (typeof window === "undefined") return true
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === null ? true : stored === "true"
}

export function SoundPreferenceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [enabled, setEnabledState] = useState(readStoredPreference)

  const setEnabled = (value: boolean) => {
    setEnabledState(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }

  return (
    <SoundPreferenceContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </SoundPreferenceContext.Provider>
  )
}

export function useSoundPreference() {
  const ctx = useContext(SoundPreferenceContext)
  if (!ctx) {
    throw new Error(
      "useSoundPreference must be used within SoundPreferenceProvider"
    )
  }
  return ctx
}
