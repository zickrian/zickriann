"use client"

import type { ComponentType } from "react"
import { useEffect, useState } from "react"

import { useChat } from "@/components/chat-provider"

type LoadedChatPanel = ComponentType

let chatPanelPromise: Promise<LoadedChatPanel> | undefined

export function loadChatPanel() {
  return (chatPanelPromise ??= import("@/components/chat-widget-panel").then(
    (mod) => mod.ChatWidgetPanel
  ))
}

export function preloadChatPanel() {
  void loadChatPanel().catch(() => {
    chatPanelPromise = undefined
  })
}

export function ChatWidget() {
  const { isChatOpen } = useChat()
  const [Panel, setPanel] = useState<LoadedChatPanel | null>(null)

  useEffect(() => {
    if (isChatOpen && !Panel) {
      let isMounted = true
      loadChatPanel()
        .then((Component) => {
          if (isMounted) setPanel(() => Component)
        })
        .catch(() => {
          chatPanelPromise = undefined
        })
      return () => {
        isMounted = false
      }
    }
  }, [isChatOpen, Panel])

  if (!Panel) return null

  return <Panel />
}
