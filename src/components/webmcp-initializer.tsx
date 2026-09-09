"use client"

import { useEffect } from "react"

import { registerWebMCPTools } from "@/lib/webmcp/register-tools"

export function WebMCPInitializer() {
  useEffect(() => {
    // Schedule registration after main thread goes idle to guarantee 0ms TBT impact
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => {
          void registerWebMCPTools()
        })
      } else {
        setTimeout(() => {
          void registerWebMCPTools()
        }, 500)
      }
    }
  }, [])

  return null
}
