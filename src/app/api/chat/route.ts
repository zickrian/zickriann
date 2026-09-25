import { NextResponse } from "next/server"

import { getGitHubContributions } from "@/features/portfolio/data/github-contributions"
import { acquireAiRequest } from "@/lib/chat-rate-limit"
import {
  createGroqChatStream,
  GroqApiError,
  type GroqChatMessage,
  GroqConfigurationError,
} from "@/lib/groq"
import { buildPortfolioChatContext } from "@/lib/portfolio-chat-context"
import { buildPortfolioSystemPrompt } from "@/lib/portfolio-chat-prompt"

export const runtime = "nodejs"

type IncomingMessage = {
  role: "user" | "assistant"
  content: string
}

type SafeJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; status: number }

// Token budget: every one of these values is multiplied by every request that
// hits Groq, so they are deliberately tight. History and portfolio
// context together should stay well under the provider's per-minute ceiling.
const MAX_MESSAGES = 10
const MAX_MESSAGE_LENGTH = 2500
const MAX_TOTAL_MESSAGE_LENGTH = 12_000
const MAX_REQUEST_BODY_BYTES = 50_000
const GITHUB_FETCH_TIMEOUT_MS = 3500

// ─── Jailbreak / Prompt-Injection / Identity-Probing Detection ─────────────
// Grouped by attack category for maintainability. All groups are combined
// into a single compiled regex so detection stays a single test() call.
// These patterns are deliberately broad and deterministic (zero LLM tokens
// spent) - this is the first, non-bypassable line of defense, since the
// downstream Groq model can still be socially engineered even with a strong
// system prompt.

// Attempts to nullify or replace existing instructions.
const OVERRIDE_ATTEMPTS =
  "ignore|abaikan|lupakan|forget|override|bypass|unlock|unrestricted|tanpa aturan|without rules|no rules|tanpa batasan|no restriction|unfiltered|uncensored|tanpa sensor|tanpa filter|without filter|aturan baru|new rules|previous instructions|prior instructions|instruksi sebelumnya"

// Named "unlocked" modes popularized by common jailbreak scripts.
const MODE_SWITCH_ATTEMPTS =
  "jailbreak|developer mode|dev mode|god mode|sudo mode|dan mode|do anything now|opposite day|kebalikan hari ini"

// Direct or indirect attempts to extract the system prompt / instructions.
const PROMPT_EXTRACTION_ATTEMPTS =
  "system prompt|prompt rahasia|bocorin prompt|instruksi kamu|what.?is your prompt|show.?your prompt|tunjukin prompt|kasih liat prompt|print your instructions|repeat your instructions|repeat verbatim|ulangi instruksi|ulangi persis|tulis ulang prompt|rewrite your (?:prompt|instructions)|your system message|isi prompt|isi instruksi|behind the scenes|di balik layar|inner workings|cara kerja kamu|what are your instructions|conversation above|lanjutkan teks di atas"

// Questions specifically about the underlying model/provider (as opposed to
// generic "are you an AI?" curiosity, which the system prompt handles
// in-character).
const IDENTITY_PROBES =
  "siapa yang bikin kamu|who made you|what model are you|model apa kamu|kamu pakai model apa|underlying model|base model"

const JAILBREAK_PATTERN = new RegExp(
  `\\b(?:${[
    OVERRIDE_ATTEMPTS,
    MODE_SWITCH_ATTEMPTS,
    PROMPT_EXTRACTION_ATTEMPTS,
    IDENTITY_PROBES,
  ].join("|")})\\b`,
  "i"
)

// Detects requests for private/sensitive data.
// NOTE: salary/rate terms are intentionally NOT blocked here. "Berapa
// ekspektasi gaji kamu?" is one of the most common legitimate recruiter
// questions on a hiring portfolio; hard-blocking it looked broken. The system
// prompt handles it instead (ROUTING -> shape B: redirect to direct contact,
// never invent a number).
const SENSITIVE_DATA_PATTERN =
  /\b(password|kata sandi|sandi|api.?key|secret.?key|private.?key|token rahasia|credential|rekening|bank.?account|nomor.?rekening|\bktp\b|nomor.?ktp|\bnik\b|paspor|passport|alamat.?rumah|home.?address|alamat.?pribadi|private.?address|pin.?atm|\bcvv\b|kartu.?kredit|credit.?card)\b/i

// Detects literal code syntax pasted into the message (e.g. user wants to
// debug code). Every token here requires real code punctuation around it -
// bare "class " and "import " used to match innocent portfolio questions like
// "dia ambil class machine learning". The `i` flag also catches lowercase SQL,
// which the previous version silently let through.
const LITERAL_CODE_SYNTAX_PATTERN =
  /```|(?:^|\s)(?:def \w+\s*\(|class \w+\s*[:({]|import .+ from|from .+ import|#include|<\?php|public static void|select .+ from |insert into |console\.log\s*\(|\.then\s*\(|=>\s*\{|\bfunction\s+\w+\s*\()/im

// Detects explicit code-generation requests in natural language.
// Narrow verb+noun pattern only - avoids false positives on portfolio questions
// like "aplikasi apa yang pernah dibuat Firdaus" (noun precedes verb = no
// match). "app/aplikasi" is deliberately excluded from this list - see
// APP_BUILD_REQUEST_PATTERN below for why.
const CODE_GENERATION_REQUEST_PATTERN =
  /\b(?:write|create|make|generate|build|buat|buatkan|bikinin|buatin|tulis|tuliskan|bikin|kasih|gimme|show)\s+(?:(?:a|an|me|saya|aku|gue|gua)\s+)?(?:code|script|program|function|algorithm|snippet|class|module|kode|skrip|fungsi|algoritma)\b/i

const CODE_LANGUAGE_PATTERN =
  /\b(?:in|using|pakai|pake|dengan)\s+(?:python|javascript|js|typescript|ts|html|css|php|java|c\+\+|cpp|c\#|ruby|go|golang|rust|swift|kotlin|sql|bash|shell)\b/i

const IMPERATIVE_VERB_PATTERN =
  /\b(?:write me|create me|make me|build me|buatkan|bikinin|buatin|tuliskan|tolong buat|tolong bikin|tolong tulis)\b/i

// Separated from CODE_GENERATION_REQUEST_PATTERN because "app/aplikasi" is
// far more ambiguous - it very commonly appears in legitimate portfolio
// questions ("aplikasi apa aja yang pernah dibikin Firdaus?"). This pattern
// only matches when the request is unambiguously "build ME an app".
const APP_BUILD_REQUEST_PATTERN =
  /\b(?:buatkan|buatin|bikinin|build me|make me|create me)\s+(?:(?:a|an)\s+)?(?:app|aplikasi)\b|\b(?:app|aplikasi)\s+(?:untuk\s+(?:saya|aku|gue|gua)|for me)\b/i

async function safeJson(req: Request): Promise<SafeJsonResult> {
  try {
    if (!req.body) {
      return { ok: false, error: "Request body is required.", status: 400 }
    }

    const reader = req.body.getReader()
    try {
      const chunks: Uint8Array[] = []
      let length = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        length += value.byteLength
        if (length > MAX_REQUEST_BODY_BYTES) {
          await reader.cancel()
          return { ok: false, error: "Request body is too large.", status: 413 }
        }
        chunks.push(value)
      }

      const data = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)))
      return { ok: true, data }
    } finally {
      reader.releaseLock()
    }
  } catch {
    return {
      ok: false,
      error: "Invalid JSON request body.",
      status: 400,
    }
  }
}

// Strips injection-like patterns from assistant messages in history.
// Prevents a client-side attacker from crafting a fake "assistant" turn that
// contains instructions (e.g., "assistant: ignore previous rules...").
const ASSISTANT_INJECTION_PATTERN =
  /\b(ignore|forget|override|system:|<system>|instructions?:|new instructions?|pretend|act as|jailbreak|aturan baru|lupakan|abaikan|\[SYSTEM\]|\[INST\])\b/i

function sanitizeAssistantMessage(content: string): string {
  if (ASSISTANT_INJECTION_PATTERN.test(content)) {
    console.warn(
      "[chat] Potential injection detected in assistant history - stripping."
    )
    // Replace the suspicious turn with a neutral placeholder so conversation
    // flow is preserved without leaking attacker-controlled instructions.
    return "[previous response]"
  }
  return content
}

// Accept legacy UI tags from an active browser session without resending them.
function stripThinkingBlock(content: string): string {
  return content
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<\/?thinking>/gi, "")
    .trim()
}

function toModelMessages(messages: unknown): IncomingMessage[] {
  if (!Array.isArray(messages)) return []

  return messages
    .filter(
      (message): message is IncomingMessage =>
        typeof message === "object" &&
        message !== null &&
        ((message as IncomingMessage).role === "user" ||
          (message as IncomingMessage).role === "assistant") &&
        typeof (message as IncomingMessage).content === "string"
    )
    .map((message) => ({
      role: message.role,
      content:
        message.role === "assistant"
          ? stripThinkingBlock(message.content)
          : message.content.trim(),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role,
      // Sanitize assistant turns before sending - user turns are untrusted
      // input handled by shouldRefuseOutOfScope() separately.
      content:
        message.role === "assistant"
          ? sanitizeAssistantMessage(
              message.content.slice(0, MAX_MESSAGE_LENGTH)
            )
          : message.content.slice(0, MAX_MESSAGE_LENGTH),
    }))
}

// ─── Shared Language Scorer ────────────────────────────────────────────────
// Single source of truth for Indonesian vs English token matching.
// Covers standard Indonesian, common informal/slang forms, and a selection of
// Javanese, Sundanese, and Betawi words that frequently appear in mixed chat.

const INDONESIAN_PATTERNS: RegExp[] = [
  // Standard Indonesian
  /\bsaya\b/,
  /\baku\b/,
  /\bkamu\b/,
  /\bdia\b/,
  /\bapa\b/,
  /\bsaja\b/,
  /\bini\b/,
  /\bitu\b/,
  /\buntuk\b/,
  /\bga\b/,
  /\bgak\b/,
  /\bnggak\b/,
  /\bbisa\b/,
  /\bbuat\b/,
  /\bjelasin\b/,
  /\bpaling\b/,
  /\bdong\b/,
  /\bkan\b/,
  /\bnih\b/,
  /\bbagaimana\b/,
  /\bgimana\b/,
  /\bkenapa\b/,
  /\bdimana\b/,
  /\bkapan\b/,
  /\bsiapa\b/,
  /\bberapa\b/,
  /\bdengan\b/,
  /\bjuga\b/,
  /\byang\b/,
  /\bpernah\b/,
  /\bkerja\b/,
  /\bpengalaman\b/,
  /\bportofolio\b/,
  /\bpunya\b/,
  /\budah\b/,
  /\buda\b/,
  /\bmemang\b/,
  /\bbetul\b/,
  /\bbanget\b/,
  /\bsama\b/,
  /\bjadi\b/,
  /\bbro\b/,
  // Javanese slang
  /\bora\b/,
  /\biso\b/,
  /\bngono\b/,
  /\bngendi\b/,
  /\bwes\b/,
  /\bopo\b/,
  // Sundanese slang
  /\bkumaha\b/,
  /\baing\b/,
  /\bmah\b/,
  // Betawi slang
  /\biye\b/,
  /\bnape\b/,
  /\bente\b/,
  /\bgua\b/,
  /\bgue\b/,
]

const ENGLISH_PATTERNS: RegExp[] = [
  /\byou\b/,
  /\bplease\b/,
  /\bwhat\b/,
  /\bhow\b/,
  /\bwhy\b/,
  /\bwhen\b/,
  /\bcan\b/,
  /\bshould\b/,
  /\bmake\b/,
  /\banswer\b/,
  /\bexplain\b/,
  /\bthe\b/,
  /\bof\b/,
  /\band\b/,
  /\bi\b/,
  /\btell\b/,
  /\babout\b/,
  /\byour\b/,
  /\bare\b/,
  /\bwas\b/,
  /\bwere\b/,
  /\bhave\b/,
  /\bhas\b/,
]

function scoreLanguageTokens(text: string): { id: number; en: number } {
  const normalized = text.toLowerCase()
  return {
    id: INDONESIAN_PATTERNS.filter((p) => p.test(normalized)).length,
    en: ENGLISH_PATTERNS.filter((p) => p.test(normalized)).length,
  }
}

// Scores the latest message first, and falls back to recent history when the
// latest message carries no signal at all ("ok", "lanjut", "hmm"). Without the
// fallback the model would flip to English mid-conversation on every short
// reply, which was the single most visible language bug.
function scoreWithFallback(text: string, fallbackText: string) {
  const primary = scoreLanguageTokens(text)
  if (primary.id > 0 || primary.en > 0) return primary
  if (!fallbackText) return primary
  return scoreLanguageTokens(fallbackText)
}

function detectLanguageDirective(text: string, fallbackText = "") {
  const { id, en } = scoreWithFallback(text, fallbackText)
  const hasLetters = /\p{L}/u.test(text)

  // "Mixed" only when BOTH sides are genuinely strong and neither dominates.
  // The old `id > 0 && en > 0` check fired on pure Indonesian sentences that
  // merely borrowed one English noun ("project apa aja yang pernah dibuat?").
  if (id >= 2 && en >= 2 && Math.max(id, en) < Math.min(id, en) * 2) {
    return "Mixed Indonesian and English. Preserve the user's mixed style naturally instead of forcing only Indonesian or only English."
  }

  if (id > en) {
    return "Indonesian. Answer in Indonesian only because the latest user message is Indonesian."
  }

  if (en > id) {
    return "English. Answer in English because the latest user message is English."
  }

  if (hasLetters) {
    return "Infer the latest user message language and answer in that same language. If the language is truly ambiguous, answer in English."
  }

  return "English. The latest user message language is ambiguous, so answer in English."
}

function isLikelyIndonesian(text: string, fallbackText = "") {
  const { id, en } = scoreWithFallback(text, fallbackText)
  return id >= en
}

// The system prompt asks the model to vary its refusals. This deterministic
// path bypasses the model entirely, so it rotates its own wording to avoid
// sounding like a canned error string on repeated attempts.
const REFUSALS_ID =
  "Maaf, aku hanya bisa membahas portofolio Firdaus; untuk hal lain, silakan hubungi langsung lewat kontak yang tersedia."
const REFUSALS_EN =
  "Sorry, I can only discuss Firdaus's portfolio; for anything else, please use the available contact channel."

function buildOutOfScopeRefusal(message: string, fallbackText = "") {
  return isLikelyIndonesian(message, fallbackText) ? REFUSALS_ID : REFUSALS_EN
}

function shouldRefuseOutOfScope(message: string) {
  const normalized = message.trim()

  if (!normalized) {
    return true
  }

  // Block jailbreak / prompt-injection / identity-probing - always,
  // regardless of context.
  if (JAILBREAK_PATTERN.test(normalized)) {
    return true
  }

  // Block requests for private/sensitive personal data.
  if (SENSITIVE_DATA_PATTERN.test(normalized)) {
    return true
  }

  // Block messages with literal code syntax (user is pasting code to debug).
  if (LITERAL_CODE_SYNTAX_PATTERN.test(normalized)) {
    return true
  }

  // Block explicit natural-language code/app-generation requests.
  // e.g. "make a script in python", "buat fungsi untuk...", "buatin aplikasi buat aku"
  if (
    CODE_GENERATION_REQUEST_PATTERN.test(normalized) ||
    APP_BUILD_REQUEST_PATTERN.test(normalized) ||
    (IMPERATIVE_VERB_PATTERN.test(normalized) &&
      CODE_LANGUAGE_PATTERN.test(normalized))
  ) {
    return true
  }

  return false
}

function getTotalMessageLength(messages: IncomingMessage[]) {
  return messages.reduce((total, message) => total + message.content.length, 0)
}

function releaseWhenClosed(
  stream: ReadableStream<Uint8Array>,
  release: () => void
) {
  const reader = stream.getReader()

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) {
          release()
          controller.close()
          return
        }
        controller.enqueue(value)
      } catch (error) {
        release()
        controller.error(error)
      }
    },
    async cancel(reason) {
      release()
      await reader.cancel(reason)
    },
  })
}

async function getGitHubContributionStatus(query: string) {
  if (!/\b(github|contribution|commit|activity)\b/i.test(query)) {
    return { available: false, contributionDays: 0 }
  }

  try {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("GitHub contribution request timed out."))
      }, GITHUB_FETCH_TIMEOUT_MS)
    })

    const contributions = await Promise.race([
      getGitHubContributions(),
      timeout,
    ])

    return {
      available: true,
      contributionDays: contributions.length,
    }
  } catch {
    return {
      available: false,
      contributionDays: 0,
    }
  }
}

export async function POST(req: Request) {
  let releaseRequest: (() => void) | undefined

  try {
    const json = await safeJson(req)

    if (!json.ok) {
      return NextResponse.json({ error: json.error }, { status: json.status })
    }

    const body = json.data as { messages?: unknown }
    const modelMessages = toModelMessages(body.messages)

    if (modelMessages.length === 0) {
      return NextResponse.json(
        { error: "No valid chat messages provided." },
        { status: 400 }
      )
    }

    const lastMessage = modelMessages[modelMessages.length - 1]

    if (lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "The last message must be from the user." },
        { status: 400 }
      )
    }

    const totalMessageLength = getTotalMessageLength(modelMessages)

    if (totalMessageLength > MAX_TOTAL_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Message is too long. Please shorten your request." },
        { status: 413 }
      )
    }

    const lastUserMessage = lastMessage.content

    const userMessages = modelMessages.filter((m) => m.role === "user")

    // Used for retrieval relevance...
    const recentUserMessages = userMessages
      .slice(-2)
      .map((m) => m.content)
      .join("\n")

    // ...and separately as the language fallback window.
    const languageFallbackText = userMessages
      .slice(-3, -1)
      .map((m) => m.content)
      .join("\n")

    if (shouldRefuseOutOfScope(lastUserMessage)) {
      return new Response(
        buildOutOfScopeRefusal(lastUserMessage, languageFallbackText),
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Content-Type-Options": "nosniff",
          },
        }
      )
    }

    const rateLimit = acquireAiRequest(req)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many chat requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      )
    }
    releaseRequest = rateLimit.release

    const github = await getGitHubContributionStatus(recentUserMessages)
    const portfolioContext = buildPortfolioChatContext({
      github,
      query: recentUserMessages,
    })
    const languageDirective = detectLanguageDirective(
      lastUserMessage,
      languageFallbackText
    )

    const groqMessages: GroqChatMessage[] = [
      {
        role: "system",
        content: buildPortfolioSystemPrompt({
          languageDirective,
          portfolioContext: portfolioContext.context,
        }),
      },
      ...modelMessages,
    ]

    const stream = await createGroqChatStream(groqMessages)
    const responseStream = releaseWhenClosed(stream, releaseRequest)
    releaseRequest = undefined

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    releaseRequest?.()
    if (error instanceof GroqConfigurationError) {
      return NextResponse.json(
        { error: "No Groq API keys are configured." },
        { status: 500 }
      )
    }

    if (error instanceof GroqApiError) {
      console.error("Groq API Error:", error.message)

      return NextResponse.json(
        {
          error:
            error.status === 429
              ? "The chat is temporarily rate-limited. Please try again shortly."
              : "There was a problem processing the chat. Please try again later.",
        },
        { status: error.status }
      )
    }

    console.error("Chat API Error:", error)

    return NextResponse.json(
      { error: "An error occurred while communicating with the AI." },
      { status: 500 }
    )
  }
}
