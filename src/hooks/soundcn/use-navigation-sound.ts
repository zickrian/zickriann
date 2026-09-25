"use client"

import { play, setEnabled } from "cuelume"
import { useCallback } from "react"

import { useSoundPreference } from "./use-sound-preference"

export function useNavigationSound() {
  const { enabled } = useSoundPreference()

  return useCallback(() => {
    setEnabled(enabled)
    if (enabled) play("chime")
  }, [enabled])
}
