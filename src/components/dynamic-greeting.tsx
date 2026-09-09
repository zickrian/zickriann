"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

export function DynamicGreeting() {
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  if (!isMounted) {
    return <span suppressHydrationWarning>Good morning</span>
  }

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return <span suppressHydrationWarning>{greeting}</span>
}
