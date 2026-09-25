"use client"

import { BorderBeam } from "border-beam"
import {
  ArrowUpIcon,
  ArrowUpRightIcon,
  ChevronDownIcon,
  MailIcon,
  PencilIcon,
  SendIcon,
  XIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { type FormEvent, memo, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import ReactMarkdown from "react-markdown"
// remark-breaks turns a single "\n" into a real line break. Without it,
// consecutive lines from the model collapse into one <p>, which is the main
// reason answers looked like unreadable walls of text.
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

import { useChat } from "@/components/chat-provider"
import { TextShimmer } from "@/components/core/text-shimmer"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/use-translation"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

type EmailFlowStep =
  | "idle"
  | "filling_form"
  | "formatting"
  | "confirming"
  | "sending"
  | "done"

type EmailFlowData = {
  step: EmailFlowStep
  name: string
  email: string
  rawMessage: string
  formattedSubject: string
  formattedMessage: string
}

type FormattedEmail = {
  subject: string
  message: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RECENT_MESSAGE_LIMIT = 4
const STREAM_TOKEN_BATCH_SIZE = 2 // 1 word + 1 space
const STREAM_BATCH_DELAY_MS = 12

const BUDGET_KEY = "zickrian_ai_budget_data"
const BUDGET_LIMIT = 6000
const BUDGET_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const BUDGET_FLUSH_MS = 400

// ─── Utilities ────────────────────────────────────────────────────────────────

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// ─── Per-browser Rate Limit (localStorage) ───────────────────────────────────

const RATE_LIMIT_KEY = "zickrian_email_rl"
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function getRateLimitTimestamps(): number[] {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as number[]
  } catch {
    return []
  }
}

function checkRateLimit(): {
  allowed: boolean
  remaining: number
  resetInMs: number
} {
  const now = Date.now()
  const valid = getRateLimitTimestamps().filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  )
  const remaining = RATE_LIMIT_MAX - valid.length

  if (remaining <= 0) {
    const oldest = Math.min(...valid)
    const resetInMs = RATE_LIMIT_WINDOW_MS - (now - oldest)
    return { allowed: false, remaining: 0, resetInMs }
  }

  return { allowed: true, remaining, resetInMs: 0 }
}

function recordEmailSend() {
  const now = Date.now()
  const valid = getRateLimitTimestamps().filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  )
  valid.push(now)
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(valid))
  } catch {
    // localStorage might be unavailable (private mode edge case)
  }
}

function formatResetTime(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60000)
  if (totalMinutes >= 60) return "1 jam"
  return `${totalMinutes} menit`
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

function AsciiSpinner() {
  const [frameIndex, setFrameIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % SPINNER_FRAMES.length)
    }, 80)
    return () => clearInterval(interval)
  }, [])
  return (
    <span className="mt-0.5 mr-2 inline-block w-4 text-center font-handwritten text-[1.2rem] font-bold tracking-wide text-current">
      {SPINNER_FRAMES[frameIndex]}
    </span>
  )
}

// ─── Email Confirmation Card ──────────────────────────────────────────────────

function EmailConfirmCard({
  data,
  onConfirm,
  onCancel,
  isSending,
  onUpdate,
}: {
  data: EmailFlowData
  onConfirm: () => void
  onCancel: () => void
  isSending: boolean
  onUpdate: (subject: string, message: string) => void
}) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubject, setEditedSubject] = useState(data.formattedSubject)
  const [editedMessage, setEditedMessage] = useState(data.formattedMessage)

  const handleSave = () => {
    onUpdate(editedSubject, editedMessage)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedSubject(data.formattedSubject)
    setEditedMessage(data.formattedMessage)
    setIsEditing(false)
  }

  return (
    <div className="flex flex-col gap-2 rounded-4xl border border-white/40 bg-white/30 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all duration-200 sm:px-5 sm:py-4 dark:border-white/20 dark:bg-white/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Header */}

      <div className="mb-1 flex items-center justify-between">
        <h3 className="pl-1.5 text-[13px] font-semibold text-foreground/90">
          {t.chat.confirmEmail}
        </h3>
        <button
          onClick={onCancel}
          disabled={isSending}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="mb-1 flex flex-col border-b border-black/8 pb-1 dark:border-white/8">
        <div className="flex items-center border-b border-black/4 px-1.5 py-2.5 text-[13px] dark:border-white/4">
          <span className="w-16 font-medium text-muted-foreground/80">
            {t.chat.from}
          </span>
          <div className="flex-1 truncate font-medium text-foreground">
            {data.name}{" "}
            <span className="font-normal text-muted-foreground/60">
              &lt;{data.email}&gt;
            </span>
          </div>
        </div>

        <div className="flex items-start border-b border-black/4 px-1.5 py-2.5 text-[13px] dark:border-white/4">
          <span className="mt-0.5 w-16 font-medium text-muted-foreground/80">
            {t.chat.subject}
          </span>
          {isEditing ? (
            <input
              name="subject"
              toolparamdescription="Subject line of the email inquiry"
              className="flex-1 border-none bg-transparent text-[16px] font-medium text-foreground focus:outline-none sm:text-[13px]"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
            />
          ) : (
            <span className="mt-0.5 flex-1 font-medium text-foreground">
              {data.formattedSubject}
            </span>
          )}
        </div>

        <div className="flex flex-col px-1.5 py-3">
          {isEditing ? (
            <textarea
              name="message"
              toolparamdescription="Body content of the email inquiry"
              rows={Math.max(3, editedMessage.split("\n").length)}
              className="w-full resize-y overflow-y-auto bg-transparent text-[16px] leading-relaxed text-foreground/80 focus:outline-none sm:text-[14px]"
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
            />
          ) : (
            <div className="max-h-50 w-full overflow-y-auto bg-transparent text-[14px] leading-relaxed whitespace-pre-wrap text-foreground/80">
              {data.formattedMessage}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 pt-1">
        {isEditing ? (
          <>
            <Button
              onClick={handleCancelEdit}
              variant="ghost"
              size="sm"
              className="rounded-xl px-4 text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/10"
            >
              {t.chat.cancel}
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="rounded-xl bg-primary px-5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.chat.saveChanges}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => setIsEditing(true)}
              disabled={isSending}
              variant="ghost"
              size="icon"
              className="size-8 rounded-xl bg-transparent text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              title={t.chat.editEmail}
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isSending}
              size="sm"
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {isSending ? (
                <>
                  <AsciiSpinner />
                  {t.chat.sending}
                </>
              ) : (
                <>
                  <SendIcon className="size-3.5" />
                  {t.chat.sendEmail}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────
// Readability rules: left-aligned text (justify created rivers of whitespace in
// a narrow panel), generous vertical rhythm between blocks, and headings that
// get extra breathing room so each "### item" reads as its own card.

const MarkdownRenderer = memo(({ content }: { content: string }) => {
  return (
    <div className="flex flex-col gap-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ children }) => (
            <p className="leading-7 wrap-break-word text-foreground">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="text-foreground/90 italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1.5 pl-4 text-foreground marker:text-muted-foreground/60">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1.5 pl-4 text-foreground marker:text-muted-foreground/60">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-6 wrap-break-word text-foreground">
              {children}
            </li>
          ),
          hr: () => <hr className="my-1 border-line" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-line pl-3 text-foreground/80">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="w-full overflow-x-auto pb-2">
              <table className="w-full border-collapse border border-line text-sm text-foreground">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted text-muted-foreground">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-line px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-line px-3 py-2">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4 hover:decoration-foreground"
            >
              {children}
              <ArrowUpRightIcon className="ml-0.5 inline size-3" />
            </a>
          ),
          h1: ({ children }) => (
            <h2 className="mt-3 text-[15px] font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 text-[15px] font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-2 text-sm font-semibold text-foreground first:mt-0">
              {children}
            </h4>
          ),
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || "")
            const lang = match ? match[1] : ""
            const codeString = String(children).trim()

            if (lang === "widget" && codeString === "contact-form") {
              return (
                <div className="animate-in fade-in slide-in-from-bottom-2 my-1 duration-300">
                  <div className="relative flex h-18 w-full items-center justify-between overflow-hidden rounded-xl border border-white/30 bg-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all hover:bg-white/30 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                    <div className="absolute -bottom-16 left-4 h-30 w-14 -rotate-6 rounded-xl border border-black/10 bg-linear-to-br from-black/5 to-transparent shadow-sm dark:border-white/10 dark:from-white/5">
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <MailIcon className="size-5 text-muted-foreground/80" />
                      </div>
                    </div>
                    <div className="z-10 ml-21 flex flex-col justify-center gap-1">
                      <div className="text-[14px] leading-none font-medium text-foreground">
                        Direct Message
                      </div>
                      <div className="text-[12px] leading-none text-muted-foreground">
                        Interactive Form
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        window.dispatchEvent(new CustomEvent("startEmailFlow"))
                      }
                      className="z-10 mr-4 flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-black/10 bg-transparent px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-black/5 active:scale-95 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      Send
                      <ArrowUpRightIcon className="size-3" />
                    </button>
                  </div>
                </div>
              )
            }

            if (match) {
              return (
                <div className="overflow-hidden rounded-md border border-line bg-muted/60 text-sm text-foreground">
                  <div className="border-b border-line bg-muted/80 px-4 py-1.5 font-mono text-xs text-muted-foreground">
                    {lang}
                  </div>
                  <pre className="overflow-x-auto p-4">
                    <code>{children}</code>
                  </pre>
                </div>
              )
            }

            return (
              <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/10">
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
MarkdownRenderer.displayName = "MarkdownRenderer"

export function ChatWidgetPanel() {
  const { isChatOpen, setIsChatOpen } = useChat()
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const [isChatActive, setIsChatActive] = useState(false)
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const modeMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!modeMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modeMenuRef.current &&
        !modeMenuRef.current.contains(e.target as Node)
      ) {
        setModeMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [modeMenuOpen])

  // No width state and nothing published to the document: the panel is a
  // fixed-width dock whose size lives entirely in `--chat-panel-width`
  // (globals.css), and the page does not react to it opening at all.
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  const [budgetOpen, setBudgetOpen] = useState(false)
  const [budgetSpent, setBudgetSpent] = useState(0)

  // Streaming appends 2 tokens at a time, so writing localStorage on every
  // append meant hundreds of read+write round trips per answer. Buffer the
  // deltas and flush them on a timer instead.
  const budgetBufferRef = useRef(0)
  const budgetFlushRef = useRef<number | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(BUDGET_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Reset if the 1 hour window has passed
          if (Date.now() - parsed.timestamp > BUDGET_WINDOW_MS) {
            setBudgetSpent(0)
            localStorage.setItem(
              BUDGET_KEY,
              JSON.stringify({ spent: 0, timestamp: Date.now() })
            )
          } else {
            setBudgetSpent(parsed.spent || 0)
          }
        } else {
          localStorage.setItem(
            BUDGET_KEY,
            JSON.stringify({ spent: 0, timestamp: Date.now() })
          )
        }
      } catch {}
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const persistBudget = (next: number) => {
    try {
      const stored = localStorage.getItem(BUDGET_KEY)
      let timestamp = Date.now()
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Date.now() - parsed.timestamp <= BUDGET_WINDOW_MS) {
          timestamp = parsed.timestamp
        }
      }
      localStorage.setItem(
        BUDGET_KEY,
        JSON.stringify({ spent: next, timestamp })
      )
    } catch {}
  }

  const flushBudget = () => {
    const delta = budgetBufferRef.current
    budgetBufferRef.current = 0
    budgetFlushRef.current = null
    if (!delta) return
    setBudgetSpent((prev) => {
      const next = prev + delta
      persistBudget(next)
      return next
    })
  }

  const updateBudget = (amount: number) => {
    budgetBufferRef.current += amount
    if (budgetFlushRef.current !== null) return
    budgetFlushRef.current = window.setTimeout(flushBudget, BUDGET_FLUSH_MS)
  }

  useEffect(() => {
    return () => {
      if (budgetFlushRef.current !== null) {
        window.clearTimeout(budgetFlushRef.current)
      }
    }
  }, [])

  const [error, setError] = useState<string | null>(null)

  const [emailFlow, setEmailFlow] = useState<EmailFlowData>({
    step: "idle",
    name: "",
    email: "",
    rawMessage: "",
    formattedSubject: "",
    formattedMessage: "",
  })
  const [emailError, setEmailError] = useState<string | null>(null)

  useEffect(() => {
    const handleStartEmailFlow = () => startEmailFlow()
    window.addEventListener("startEmailFlow", handleStartEmailFlow)
    return () =>
      window.removeEventListener("startEmailFlow", handleStartEmailFlow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailFlow.step])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Keyboard handling (visual viewport) ─────────────────────────────────────
  useEffect(() => {
    if (!window.visualViewport) return

    const handleResize = () => {
      if (containerRef.current && window.visualViewport) {
        containerRef.current.style.height = `${window.visualViewport.height}px`
        containerRef.current.style.top = `${window.visualViewport.offsetTop}px`
      }
    }

    window.visualViewport.addEventListener("resize", handleResize)
    window.visualViewport.addEventListener("scroll", handleResize)
    handleResize()

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize)
      window.visualViewport?.removeEventListener("scroll", handleResize)
    }
  }, [])

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    // While tokens are streaming in every few milliseconds, a `smooth` scroll
    // animation starts a fresh eased scroll on each append - the browser is
    // perpetually catching up to content it has not rendered yet, which reads
    // as jank and burns main-thread time. Snap (`auto`) keeps the view pinned
    // to the latest token, and the discrete updates (send, email steps) still
    // get the gentle smooth scroll.
    messagesEndRef.current?.scrollIntoView({
      behavior: isLoading ? "auto" : "smooth",
    })
  }, [messages, isLoading, emailFlow.step])

  // ── Textarea auto-reset ─────────────────────────────────────────────────────
  useEffect(() => {
    if (input === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [input])

  // ── Loading message rotation ────────────────────────────────────────────────
  const latestMessage = messages[messages.length - 1]
  const waitingForFirstChunk =
    isLoading &&
    latestMessage?.role === "assistant" &&
    latestMessage.content.length === 0
  const loadingMessage =
    t.chat.loadingMessages[loadingMessageIndex % t.chat.loadingMessages.length]

  const isAgentThinking =
    isLoading || emailFlow.step === "formatting" || emailFlow.step === "sending"

  const showLoadingShimmer =
    waitingForFirstChunk ||
    emailFlow.step === "formatting" ||
    emailFlow.step === "sending"

  useEffect(() => {
    if (!isAgentThinking) {
      const timeoutId = window.setTimeout(() => setLoadingMessageIndex(0), 0)
      return () => window.clearTimeout(timeoutId)
    }
    const interval = window.setInterval(() => {
      setLoadingMessageIndex((i) => i + 1)
    }, 1200)
    return () => window.clearInterval(interval)
  }, [isAgentThinking])

  // ── Abort on unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => abortControllerRef.current?.abort()
  }, [])

  // ── Escape to close & Body Scroll Lock (Mobile Only) ───────────────────────
  useEffect(() => {
    if (!isChatOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsChatOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)

    // Only lock body on mobile/touch devices to prevent layout shift on PC
    const isMobile = window.matchMedia("(max-width: 640px)").matches
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream

    let scrollY = 0
    let originalStyle = ""

    if (isMobile) {
      scrollY = window.scrollY
      originalStyle = document.body.style.overflow

      if (isIOS) {
        document.body.style.position = "fixed"
        document.body.style.top = `-${scrollY}px`
        document.body.style.width = "100%"
        document.body.style.height = "100%"
      }
      document.body.style.overflow = "hidden"
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (isMobile) {
        if (isIOS) {
          document.body.style.position = ""
          document.body.style.top = ""
          document.body.style.width = ""
          document.body.style.height = ""
        }
        document.body.style.overflow = originalStyle
        if (isIOS) {
          window.scrollTo(0, scrollY)
        }
      }
    }
  }, [isChatOpen, setIsChatOpen])

  // ── Reset textarea height ───────────────────────────────────────────────────
  useEffect(() => {
    if (emailFlow.step !== "filling_form" && textareaRef.current) {
      const el = textareaRef.current
      requestAnimationFrame(() => {
        el.style.height = "auto"
        if (el.value) {
          el.style.height = `${el.scrollHeight}px`
        }
      })
    }
  }, [emailFlow.step])

  // ── Streaming helpers ────────────────────────────────────────────────────────
  function appendAssistantContent(messageId: string, content: string) {
    if (!content) return
    updateBudget(content.length)
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId
          ? { ...message, content: message.content + content }
          : message
      )
    )
  }

  async function appendAssistantContentFast(
    messageId: string,
    content: string
  ) {
    const tokens = content.split(/(\s+)/).filter(Boolean)
    for (
      let index = 0;
      index < tokens.length;
      index += STREAM_TOKEN_BATCH_SIZE
    ) {
      appendAssistantContent(
        messageId,
        tokens.slice(index, index + STREAM_TOKEN_BATCH_SIZE).join("")
      )
      await new Promise<void>((resolve) =>
        window.setTimeout(resolve, STREAM_BATCH_DELAY_MS)
      )
    }
  }

  // ── Inject an AI message into the chat ──────────────────────────────────────
  async function injectAssistantMessage(text: string) {
    const id = createId()
    setMessages((prev) => [...prev, { id, role: "assistant", content: "" }])
    await appendAssistantContentFast(id, text)
    return id
  }

  // ── Start email flow ─────────────────────────────────────────────────────────
  async function startEmailFlow() {
    if (emailFlow.step !== "idle") return
    setEmailError(null)

    // Check per-browser rate limit before starting
    const rl = checkRateLimit()
    if (!rl.allowed) {
      setIsChatActive(true)
      await injectAssistantMessage(
        t.chat.sendingLimitReached(RATE_LIMIT_MAX, formatResetTime(rl.resetInMs))
      )
      return
    }

    setIsChatActive(true)
    setEmailFlow((prev) => ({
      ...prev,
      step: "filling_form",
    }))
  }

  // ── Cancel email flow ────────────────────────────────────────────────────────
  async function cancelEmailFlow() {
    setEmailError(null)
    setEmailFlow((prev) => ({ ...prev, step: "idle" }))
  }

  // ── Handle email flow step submission ───────────────────────────────────────
  async function handleEmailFormSubmit() {
    const { name, email, rawMessage } = emailFlow

    if (!name.trim() || !email.trim() || !rawMessage.trim()) {
      return
    }
    if (!isValidEmail(email)) {
      setEmailError(t.chat.invalidEmail)
      return
    }

    setEmailError(null)

    setEmailFlow((prev) => ({
      ...prev,
      step: "formatting",
    }))

    // Inject user request as a message
    const userMsgId = createId()
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: `Send email:\n**Name:** ${name}\n**Email:** ${email}\n**Message:** ${rawMessage}`,
      },
    ])

    try {
      const [res] = await Promise.all([
        fetch("/api/format-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderName: name,
            senderEmail: email,
            rawMessage,
          }),
        }),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ])

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Failed to format email.")
      }

      const formatted = (await res.json()) as FormattedEmail

      setEmailFlow((prev) => ({
        ...prev,
        step: "confirming",
        formattedSubject: formatted.subject,
        formattedMessage: formatted.message,
      }))

      await injectAssistantMessage(
        t.chat.emailPreviewReady
      )
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to format message."
      setEmailFlow((prev) => ({ ...prev, step: "idle" }))
      setEmailError(msg)
    }
  }

  // ── Confirm & send email ─────────────────────────────────────────────────────
  async function handleEmailConfirm() {
    // Double-check rate limit right before sending (guards against tab duplication)
    const rl = checkRateLimit()
    if (!rl.allowed) {
      setEmailFlow((prev) => ({ ...prev, step: "idle" }))
      await injectAssistantMessage(
        t.chat.sendingLimitReached(RATE_LIMIT_MAX, formatResetTime(rl.resetInMs))
      )
      return
    }

    setEmailFlow((prev) => ({ ...prev, step: "sending" }))
    setEmailError(null)

    try {
      const [res] = await Promise.all([
        fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderName: emailFlow.name,
            senderEmail: emailFlow.email,
            subject: emailFlow.formattedSubject,
            message: emailFlow.formattedMessage,
          }),
        }),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ])

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Failed to send email.")
      }

      // Record the send ONLY after confirmed success
      recordEmailSend()

      const remaining = checkRateLimit().remaining
      setEmailFlow((prev) => ({ ...prev, step: "done" }))
      await injectAssistantMessage(
        t.chat.emailSentSuccess(emailFlow.name, emailFlow.email, remaining)
      )

      // Reset flow after success
      setTimeout(() => {
        setEmailFlow((prev) => ({
          ...prev,
          step: "idle",
          name: "",
          email: "",
          rawMessage: "",
        }))
      }, 500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send email."
      setEmailFlow((prev) => ({ ...prev, step: "confirming" }))
      setEmailError(msg)
    }
  }

  // ── Main chat submit ─────────────────────────────────────────────────────────
  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    if (budgetSpent >= BUDGET_LIMIT) {
      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmedInput,
      }
      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsChatActive(true)

      await new Promise((resolve) => setTimeout(resolve, 600))

      await injectAssistantMessage(
        "Waktu ngobrolku sudah habis nih! Kalau masih ada pertanyaan, yuk langsung DM Zickrian lewat tombol **Direct Message** di atas! 👆"
      )
      return
    }

    setIsChatActive(true)

    // If formatting/confirming/sending, disable normal input
    if (
      emailFlow.step === "formatting" ||
      emailFlow.step === "confirming" ||
      emailFlow.step === "sending" ||
      emailFlow.step === "filling_form"
    ) {
      return
    }

    // Normal chat
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmedInput,
    }
    const assistantMessage: ChatMessage = {
      id: createId(),
      role: "assistant",
      content: "",
    }
    const nextMessages = [...messages, userMessage, assistantMessage]

    setMessages(nextMessages)
    setInput("")
    setError(null)
    setIsLoading(true)
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const recentMessages = nextMessages
        .filter((message) => message.content.trim())
        .slice(-RECENT_MESSAGE_LIMIT)
        .map(({ role, content }) => ({ role, content }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: recentMessages }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error || "Chat is unavailable.")
      }

      if (!response.body) {
        throw new Error("The chat did not return a response stream.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        await appendAssistantContentFast(assistantMessage.id, chunk)
      }

      await appendAssistantContentFast(assistantMessage.id, decoder.decode())
    } catch (submitError) {
      if (abortController.signal.aborted) return

      const message =
        submitError instanceof Error
          ? submitError.message
          : "I can't answer right now."

      setError(message)
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== assistantMessage.id)
      )
    } finally {
      setIsLoading(false)
      flushBudget()
      abortControllerRef.current = null
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const inputPlaceholder = t.chat.inputPlaceholder

  const isInputDisabled =
    isLoading ||
    emailFlow.step === "formatting" ||
    emailFlow.step === "confirming" ||
    emailFlow.step === "sending"

  // ── Form element ─────────────────────────────────────────────────────────────
  const FormElement = (
    <form
      toolname={
        emailFlow.step === "filling_form"
          ? "send_contact_email"
          : "ask_portfolio_assistant"
      }
      tooldescription={
        emailFlow.step === "filling_form"
          ? "Send a direct contact email inquiry to Firdaus Khotibul Zickrian"
          : "Ask questions about Firdaus Khotibul Zickrian's skills, projects, experience, or background"
      }
      onSubmit={(e) => {
        e.preventDefault()
        if (emailFlow.step === "filling_form") {
          handleEmailFormSubmit()
        } else {
          handleSubmit(e)
        }
      }}
      className="w-full min-w-0"
    >
      <BorderBeam
        active={isAgentThinking}
        colorVariant="colorful"
        size="md"
        borderRadius={24}
        theme={resolvedTheme === "light" ? "light" : "dark"}
        className="w-full"
      >
        <div
          className={cn(
            "flex min-w-0 flex-col gap-2 rounded-3xl border border-border/80 bg-card/90 p-3.5 shadow-xl backdrop-blur-xl transition-all duration-200 sm:p-4 dark:border-white/12 dark:bg-[#181818]/95 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_36px_rgba(0,0,0,0.5)]",
            emailFlow.step === "filling_form" && "rounded-3xl"
          )}
        >
          {emailFlow.step === "filling_form" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 flex w-full flex-col duration-200">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="pl-1 text-[13px] font-semibold text-foreground/90">
                  {t.chat.sendEmailToZickrian}
                </h3>
                <button
                  type="button"
                  onClick={cancelEmailFlow}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>

              <div className="mb-2 flex flex-col border-b border-border/60 pb-1 dark:border-white/8">
                <input
                  name="senderName"
                  toolparamdescription="Sender's full name"
                  placeholder={t.chat.yourName}
                  value={emailFlow.name}
                  onChange={(e) => {
                    setEmailFlow((prev) => ({ ...prev, name: e.target.value }))
                    setEmailError(null)
                  }}
                  className="w-full border-b border-border/40 bg-transparent px-1.5 py-2 text-[16px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-[14px] dark:border-white/4"
                />

                <input
                  name="senderEmail"
                  toolparamdescription="Sender's email address"
                  placeholder={t.chat.yourEmail}
                  value={emailFlow.email}
                  type="email"
                  onChange={(e) => {
                    setEmailFlow((prev) => ({ ...prev, email: e.target.value }))
                    setEmailError(null)
                  }}
                  className="w-full bg-transparent px-1.5 py-2 text-[16px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-[14px]"
                />
              </div>

              {emailError && (
                <p className="animate-in fade-in slide-in-from-top-1 -mt-1 mb-1 px-1.5 text-[12px] font-medium text-destructive">
                  {emailError}
                </p>
              )}
            </div>
          )}

          <textarea
            ref={textareaRef}
            name={emailFlow.step === "filling_form" ? "message" : "query"}
            toolparamdescription={
              emailFlow.step === "filling_form"
                ? "Message body or inquiry to send to Firdaus"
                : "Natural language question about Firdaus Khotibul Zickrian's portfolio or background"
            }
            value={
              emailFlow.step === "filling_form" ? emailFlow.rawMessage : input
            }
            disabled={isInputDisabled && emailFlow.step !== "filling_form"}
            onChange={(event) => {
              const val = event.target.value
              if (emailFlow.step === "filling_form") {
                setEmailFlow((prev) => ({ ...prev, rawMessage: val }))
                setEmailError(null)
              } else {
                setInput(val)
              }
              const target = event.target
              requestAnimationFrame(() => {
                target.style.height = "auto"
                target.style.height = `${target.scrollHeight}px`
              })
            }}
            placeholder={
              emailFlow.step === "filling_form"
                ? t.chat.writeMessageHere
                : inputPlaceholder
            }
            rows={emailFlow.step === "filling_form" ? 3 : 1}
            className={cn(
              "max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-1 py-1 text-[16px] leading-6 font-medium text-wrap wrap-break-word text-foreground [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 sm:text-[14px] [&::-webkit-scrollbar]:hidden"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                const target = e.target as HTMLTextAreaElement
                if (emailFlow.step === "filling_form") {
                  handleEmailFormSubmit()
                } else if (input.trim() && !isInputDisabled) {
                  target.form?.requestSubmit()
                  target.style.height = "auto"
                }
              }
            }}
          />

          <div className="flex w-full min-w-0 items-center justify-between gap-2 pt-1">
            {/* Mode selector: 1 single seamless card that expands upward */}
            <div className="relative" ref={modeMenuRef}>
              {modeMenuOpen && (
                <div className="animate-in fade-in slide-in-from-bottom-1 absolute right-0 bottom-full left-0 z-50 flex flex-col overflow-hidden rounded-t-[18px] border border-b-0 border-border/80 bg-muted/95 shadow-xl backdrop-blur-xl duration-150 dark:border-white/15 dark:bg-[#1e1e1e]">
                  {emailFlow.step === "filling_form" ? (
                    <button
                      type="button"
                      onClick={() => {
                        cancelEmailFlow()
                        setModeMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground dark:hover:bg-white/10"
                    >
                      <Icons.claudeCode className="size-3.5 text-primary" />
                      <span>{t.chat.chatMode}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        startEmailFlow()
                        setModeMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground dark:hover:bg-white/10"
                    >
                      <MailIcon className="size-3.5 text-primary" />
                      <span>{t.chat.emailMode}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Base Button - Permanently mounted, never moves, seamlessly merges when open */}
              <button
                type="button"
                onClick={() => setModeMenuOpen((prev) => !prev)}
                className={cn(
                  "flex items-center gap-1.5 border border-border/80 bg-muted/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors dark:border-white/15 dark:bg-white/8",
                  modeMenuOpen
                    ? "rounded-t-none rounded-b-[18px] border-t-0 bg-muted/95 dark:bg-[#1e1e1e]"
                    : "rounded-full hover:bg-muted hover:text-foreground active:scale-95 dark:hover:bg-white/12"
                )}
                aria-haspopup="listbox"
                aria-expanded={modeMenuOpen}
              >
                {emailFlow.step === "filling_form" ? (
                  <>
                    <MailIcon className="size-3.5 text-primary" />
                    <span>{t.chat.emailMode}</span>
                  </>
                ) : (
                  <>
                    <Icons.claudeCode className="size-3.5 text-primary" />
                    <span>{t.chat.chatMode}</span>
                  </>
                )}
                <ChevronDownIcon
                  className={cn(
                    "size-3 text-muted-foreground transition-transform duration-200",
                    modeMenuOpen && "rotate-180"
                  )}
                />
              </button>
            </div>

            {/* Submit Button */}
            {emailFlow.step === "filling_form" ? (
              <Button
                type="button"
                onClick={handleEmailFormSubmit}
                size="sm"
                disabled={
                  !emailFlow.name.trim() ||
                  !emailFlow.email.trim() ||
                  !emailFlow.rawMessage.trim()
                }
                className="h-8.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95 disabled:opacity-40"
              >
                {t.chat.continue}
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon-sm"
                disabled={!input.trim() || isInputDisabled}
                className="size-8.5 shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95 disabled:opacity-40"
                aria-label={t.chat.sendMessage}
              >
                <ArrowUpIcon className="size-4" strokeWidth={2.5} />
              </Button>
            )}
          </div>
        </div>
      </BorderBeam>
    </form>
  )

  // ── Render ───────────────────────────────────────────────────────────────────
  if (typeof document === "undefined") return null

  return createPortal(
    <>
      {/* Seamless Full-height Background (hangs below 100dvh on mobile to cover translucent keyboard) */}
      <div
        data-open={isChatOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-59 border-line bg-card shadow-2xl transition-transform duration-300 ease-out",
          "h-[150vh] w-full border-0 sm:h-screen sm:w-(--chat-panel-width) sm:border-l",
          "data-[open=false]:pointer-events-none data-[open=false]:translate-x-full"
        )}
      />

      {/* Content Layer (constrained to visual viewport height) */}
      <div
        ref={containerRef}
        data-open={isChatOpen}
        className={cn(
          "fixed right-0 z-60 flex min-w-0 flex-col overflow-hidden transition-transform duration-300 ease-out",
          "w-full border-0 sm:h-screen sm:w-(--chat-panel-width)",
          "data-[open=false]:pointer-events-none data-[open=false]:translate-x-full"
        )}
        style={{
          height: "100dvh",
          top: 0,
        }}
      >
        {/* Header */}
        <div className="relative flex min-h-16 min-w-0 items-center justify-between gap-3 border-b border-line py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pr-6 pl-4">
          <div className="flex min-w-0 items-center gap-3">
            <Icons.claudeCode className="size-5 shrink-0" />
            <div
              className="flex min-w-0 cursor-pointer items-center gap-1 transition-opacity hover:opacity-80"
              onClick={() => setBudgetOpen(!budgetOpen)}
            >
              <span className="flex items-center gap-1.5 font-handwritten text-[1.15rem] tracking-wide text-foreground select-none">
                Zickrian
                <ChevronDownIcon
                  className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    budgetOpen && "rotate-180"
                  )}
                />
              </span>
            </div>
          </div>

          {/* Budget Popover */}
          {budgetOpen && (
            <div className="animate-in fade-in zoom-in-95 absolute top-15 left-4 z-50 w-84 origin-top-left duration-200">
              <div className="relative overflow-hidden rounded-[1.25rem] border border-border bg-background p-5 text-foreground shadow-2xl">
                <div className="relative z-10 flex flex-col gap-4 font-handwritten">
                  <h3 className="text-[1.75rem] leading-none tracking-widest uppercase">
                    {t.chat.budgetTitle}
                  </h3>

                  {/* Progress Bar */}
                  <div className="mt-2 flex w-full flex-col gap-0.5">
                    {[1, 2, 3].map((row) => (
                      <div key={`row${row}`} className="flex w-full gap-0.5">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div
                            key={`row${row}-${i}`}
                            className={cn(
                              "h-2.25 flex-1",
                              i / 30 <= budgetSpent / BUDGET_LIMIT
                                ? "bg-foreground"
                                : "bg-foreground/20"
                            )}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-[0.95rem] leading-[1.1] tracking-wide whitespace-pre-line text-foreground/80 uppercase">
                      {budgetSpent >= BUDGET_LIMIT
                        ? t.chat.budgetLimitReached
                        : budgetSpent > BUDGET_LIMIT * 0.8
                          ? t.chat.budgetClose
                          : t.chat.budgetHealthy}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.chat.closeChat}
            onClick={() => setIsChatOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {!isChatActive ? (
            <div className="flex-1" />
          ) : (
            <div className="min-w-0 flex-1 space-y-7 overflow-x-hidden overflow-y-auto pt-6 pr-6 pb-36 pl-4 sm:pb-40">
              {messages.map((m) => {
                if (m.role === "assistant" && !m.content) return null

                return (
                  <div key={m.id}>
                    {m.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[82%] rounded-2xl rounded-tr-md border border-border/60 bg-muted/80 px-4 py-3 text-sm leading-6 text-foreground shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/8 dark:shadow-none">
                          <div className="text-wrap wrap-break-word whitespace-pre-wrap">
                            {m.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                              part.startsWith("**") && part.endsWith("**") ? (
                                <strong
                                  key={i}
                                  className="font-semibold text-foreground"
                                >
                                  {part.slice(2, -2)}
                                </strong>
                              ) : (
                                part
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full text-sm leading-7 text-foreground">
                        <div className="w-full max-w-[calc(100vw-5rem)]">
                          <MarkdownRenderer content={m.content} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Email confirmation card */}
              {(emailFlow.step === "confirming" ||
                emailFlow.step === "sending") && (
                <EmailConfirmCard
                  data={emailFlow}
                  onConfirm={handleEmailConfirm}
                  onCancel={cancelEmailFlow}
                  isSending={emailFlow.step === "sending"}
                  onUpdate={(subject, message) =>
                    setEmailFlow((prev) => ({
                      ...prev,
                      formattedSubject: subject,
                      formattedMessage: message,
                    }))
                  }
                />
              )}

              {/* Email error (non-form state) */}
              {emailError && emailFlow.step !== "filling_form" && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {emailError}
                </p>
              )}

              {/* Loading spinner */}
              {showLoadingShimmer && (
                <div className="flex items-center py-1 text-sm leading-7 text-muted-foreground">
                  <AsciiSpinner />
                  <TextShimmer className="font-medium" duration={0.9}>
                    {(() => {
                      if (emailFlow.step === "formatting")
                        return t.chat.formattingMessages[
                          loadingMessageIndex % t.chat.formattingMessages.length
                        ]
                      if (emailFlow.step === "sending")
                        return t.chat.sendingMessages[
                          loadingMessageIndex % t.chat.sendingMessages.length
                        ]

                      return loadingMessage
                    })()}
                  </TextShimmer>
                </div>
              )}

              {error ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Unified Fixed Bottom Input Dock */}
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-30 bg-linear-to-t from-background via-background/90 to-transparent p-4 pt-10 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:p-5 sm:pt-12 sm:pb-5">
            <div className="pointer-events-auto w-full">{FormElement}</div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
