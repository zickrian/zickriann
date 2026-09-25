"use client"

import { createContext, useContext, useState } from "react"

interface ChatContextType {
  isChatOpen: boolean
  setIsChatOpen: (open: boolean) => void
  toggleChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const toggleChat = () => setIsChatOpen((prev) => !prev)

  return (
    <ChatContext.Provider value={{ isChatOpen, setIsChatOpen, toggleChat }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
