type GroqChatRole = "system" | "user" | "assistant"

export type GroqChatMessage = {
  role: GroqChatRole
  content: string
}

type GroqStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: unknown
      reasoning?: unknown
    }
  }>
}

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions"
const MODEL_TIERS = [
  {
    tier: "1",
    model: "openai/gpt-oss-120b", // 8K ctx, 8K TPM, 200K TPD - largest model, best quality & reasoning
  },
  {
    tier: "2",
    model: "qwen/qwen3.6-27b", // 8K ctx, 8K TPM, 200K TPD - fast, balanced, high quality
  },
  {
    tier: "3",
    model: "qwen/qwen3.8-27b", // 8K ctx, 8K TPM, 2M TPD - balanced fallback
  },
  {
    tier: "4",
    model: "openai/gpt-oss-20b", // 8K ctx, 8K TPM, 200K TPD - lightweight fallback
  },
] as const
const FRIENDLY_LIMIT_MESSAGE =
  "The chat is busy right now. Please try again shortly."
const THINK_OPEN = "<think>"
const THINK_CLOSE = "</think>"
const DEFAULT_MAX_COMPLETION_TOKENS = 2048
const EMAIL_MAX_COMPLETION_TOKENS = 1024
const QWEN_SMALL_COMPLETION_TOKENS = 2048 // qwen3.6-27b / gpt-oss: 8K ctx, safe headroom

type GroqApiKeyConfig = {
  key: string
  label: string
}

function createThinkStripper() {
  let insideThink = false
  let buffer = ""

  function push(fragment: string) {
    buffer += fragment
    let output = ""

    while (true) {
      if (!insideThink) {
        const startIndex = buffer.indexOf(THINK_OPEN)

        if (startIndex === -1) {
          let safeLength = Math.max(0, buffer.length - (THINK_OPEN.length - 1))

          if (safeLength > 0) {
            const lastCode = buffer.charCodeAt(safeLength - 1)
            if (lastCode >= 0xd800 && lastCode <= 0xdbff) {
              safeLength -= 1
            }
          }

          if (safeLength > 0) {
            output += buffer.slice(0, safeLength)
            buffer = buffer.slice(safeLength)
          }

          break
        }

        output += buffer.slice(0, startIndex)
        buffer = buffer.slice(startIndex + THINK_OPEN.length)
        insideThink = true
        continue
      }

      const endIndex = buffer.indexOf(THINK_CLOSE)

      if (endIndex === -1) {
        const keepLength = THINK_CLOSE.length - 1

        if (buffer.length > keepLength) {
          buffer = buffer.slice(buffer.length - keepLength)
        }

        break
      }

      buffer = buffer.slice(endIndex + THINK_CLOSE.length)
      insideThink = false
    }

    return output
  }

  function flush() {
    if (insideThink) {
      buffer = ""
      return ""
    }

    const output = buffer
    buffer = ""
    return output
  }

  return { push, flush }
}

export class GroqConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GroqConfigurationError"
  }
}

export class GroqApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "GroqApiError"
  }
}

function getGroqApiKeys() {
  const apiKeys: GroqApiKeyConfig[] = []

  const rawEntries = [
    ...(process.env.GROQ_API_KEYS ?? "").split(","),
    ...(process.env.GROQ_API_KEY ?? "").split(","),
    ...Object.entries(process.env)
      .filter(([name]) => /^GROQ_API_KEY_\d+$/i.test(name))
      .sort(([left], [right]) =>
        left.localeCompare(right, undefined, { numeric: true })
      )
      .map(([, key]) => key),
  ]

  const keysArray = rawEntries
    .map((key) =>
      key
        ?.trim()
        .replace(/^["']|["']$/g, "")
        .trim()
    )
    .filter((key): key is string => Boolean(key))

  keysArray.forEach((key, index) => {
    apiKeys.push({
      key,
      label: `GROQ_API_KEY_${index + 1}`,
    })
  })

  const seenKeys = new Set<string>()
  const uniqueKeys = apiKeys.filter(({ key }) => {
    if (seenKeys.has(key)) return false

    seenKeys.add(key)
    return true
  })

  if (uniqueKeys.length === 0) {
    throw new GroqConfigurationError("No Groq API keys are configured.")
  }

  return uniqueKeys
}

function getFallbackModels() {
  return MODEL_TIERS.map((tier) => tier.model)
}

function createTextStream(text: string) {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
}

async function readGroqError(response: Response) {
  const fallback = "Groq could not process the chat request."
  const body = await response.text().catch(() => "")

  if (!body) return fallback

  try {
    const payload = JSON.parse(body) as {
      message?: string
      error?: {
        message?: string
      }
    }

    return payload.error?.message || payload.message || fallback
  } catch {
    return body.slice(0, 500)
  }
}

function extractTextFromChunk(chunk: GroqStreamChunk) {
  const content = chunk.choices?.[0]?.delta?.content

  if (typeof content === "string") return content

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (
          typeof part === "object" &&
          part !== null &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text
        }

        return ""
      })
      .join("")
  }

  return ""
}

export function createGroqTextStream(
  responseBody: ReadableStream<Uint8Array>,
  onComplete?: (outputCharacters: number) => void
) {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const thinkStripper = createThinkStripper()
  let buffer = ""
  let outputCharacters = 0
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined

  const enqueue = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    text: string
  ) => {
    outputCharacters += text.length
    controller.enqueue(encoder.encode(text))
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      reader = responseBody.getReader()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            const trimmedLine = line.trim()

            if (!trimmedLine.startsWith("data:")) continue

            const data = trimmedLine.slice(5).trim()
            if (!data || data === "[DONE]") continue

            try {
              const chunk = JSON.parse(data) as GroqStreamChunk
              const text = thinkStripper.push(extractTextFromChunk(chunk))

              if (text) {
                enqueue(controller, text)
              }
            } catch {
              continue
            }
          }
        }
      } finally {
        const remaining = thinkStripper.flush()

        if (remaining) {
          enqueue(controller, remaining)
        }

        onComplete?.(outputCharacters)
        controller.close()
        reader.releaseLock()
      }
    },
    async cancel(reason) {
      await reader?.cancel(reason)
    },
  })
}

function isLimitLikeError(error: GroqApiError) {
  return (
    error.status === 429 ||
    error.status === 503 ||
    (error.status === 413 &&
      /request too large|tokens per minute|token|tpm|rate|limit/i.test(
        error.message
      ))
  )
}

function shouldTryNextModel(error: GroqApiError) {
  return error.status === 404 || error.status === 503
}

type ModelRequestOptions = {
  max_completion_tokens: number
  temperature: number
  reasoning_effort?: string
}

const DEFAULT_MODEL_OPTIONS: ModelRequestOptions = {
  max_completion_tokens: DEFAULT_MAX_COMPLETION_TOKENS,
  temperature: 0.2,
}

// Per-model overrides - keyed by exact model string.
// Add an entry here when a model needs non-default settings.
// Qwen3 models are reasoning models; reasoning_effort:"none" disables
// internal thinking tokens that would otherwise consume output budget.
const MODEL_OPTIONS_MAP: Record<string, ModelRequestOptions> = {
  // 8K context models - cap completion at 2048 to stay safely within window
  "openai/gpt-oss-120b": {
    max_completion_tokens: QWEN_SMALL_COMPLETION_TOKENS,
    temperature: 0.2,
  },
  "qwen/qwen3.6-27b": {
    max_completion_tokens: QWEN_SMALL_COMPLETION_TOKENS,
    temperature: 0.2,
    reasoning_effort: "none",
  },
  "qwen/qwen3.8-27b": {
    max_completion_tokens: QWEN_SMALL_COMPLETION_TOKENS,
    temperature: 0.2,
    reasoning_effort: "none",
  },
  "openai/gpt-oss-20b": {
    max_completion_tokens: QWEN_SMALL_COMPLETION_TOKENS,
    temperature: 0.2,
  },
}

function getGroqRequestOptions(
  model: string,
  maxCompletionTokens = DEFAULT_MAX_COMPLETION_TOKENS
) {
  const options = MODEL_OPTIONS_MAP[model] ?? DEFAULT_MODEL_OPTIONS
  return {
    ...options,
    max_completion_tokens: Math.min(
      options.max_completion_tokens,
      maxCompletionTokens
    ),
  }
}

async function createGroqChatStreamForModel(
  messages: GroqChatMessage[],
  model: string,
  apiKey: string
) {
  let response: Response
  try {
    response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        ...getGroqRequestOptions(model),
      }),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown network error"
    throw new GroqApiError(`Network error: ${msg}`, 503)
  }

  if (!response.ok || !response.body) {
    throw new GroqApiError(
      await readGroqError(response),
      response.status || 500
    )
  }

  const inputCharacters = messages.reduce(
    (total, message) => total + message.content.length,
    0
  )
  return createGroqTextStream(response.body, (outputCharacters) => {
    console.info("[inference]", { model, inputCharacters, outputCharacters })
  })
}

function getOpenRouterApiKeys() {
  const apiKeys: GroqApiKeyConfig[] = []

  const rawKeys =
    process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || ""
  const keysArray = rawKeys
    .split(",")
    .map((k) =>
      k
        ?.trim()
        .replace(/^["']|["']$/g, "")
        .trim()
    )
    .filter((key): key is string => Boolean(key))

  keysArray.forEach((key, index) => {
    apiKeys.push({
      key,
      label: `OPENROUTER_API_KEY_${index + 1}`,
    })
  })

  const seenKeys = new Set<string>()
  const uniqueKeys = apiKeys.filter(({ key }) => {
    if (seenKeys.has(key)) return false

    seenKeys.add(key)
    return true
  })

  if (uniqueKeys.length === 0) {
    throw new GroqConfigurationError("No OpenRouter API keys are configured.")
  }

  return uniqueKeys
}

async function createOpenRouterChatStreamForModel(
  messages: GroqChatMessage[],
  model: string,
  apiKey: string
) {
  let response: Response
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Web Portfolio",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: DEFAULT_MAX_COMPLETION_TOKENS,
        temperature: 0.2,
      }),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown network error"
    throw new GroqApiError(`Network error: ${msg}`, 503)
  }

  if (!response.ok || !response.body) {
    throw new GroqApiError(
      await readGroqError(response),
      response.status || 500
    )
  }

  const inputCharacters = messages.reduce(
    (total, message) => total + message.content.length,
    0
  )
  return createGroqTextStream(response.body, (outputCharacters) => {
    console.info("[inference]", { model, inputCharacters, outputCharacters })
  })
}

export async function createGroqChatStream(messages: GroqChatMessage[]) {
  let lastError: GroqApiError | null = null
  const apiKeys = getGroqApiKeys()

  for (const model of getFallbackModels()) {
    for (const apiKey of apiKeys) {
      try {
        return await createGroqChatStreamForModel(messages, model, apiKey.key)
      } catch (error) {
        if (error instanceof GroqApiError) {
          lastError = error

          if (!shouldTryNextModel(error)) {
            throw error
          }

          console.warn(
            `Groq limit/not-found error on ${apiKey.label} with ${model}: ${error.status}`
          )
          continue
        }

        throw error
      }
    }
  }

  let openRouterAttempted = false
  try {
    const openRouterKeys = getOpenRouterApiKeys()
    openRouterAttempted = true
    for (const apiKey of openRouterKeys) {
      try {
        return await createOpenRouterChatStreamForModel(
          messages,
          "openai/gpt-oss-120b:free",
          apiKey.key
        )
      } catch (orError) {
        if (!(orError instanceof GroqApiError)) throw orError

        if (!shouldTryNextModel(orError)) {
          throw orError
        }

        console.warn(
          `OpenRouter limit/not-found error on ${apiKey.label}: ${orError.status}`
        )
      }
    }
  } catch (error) {
    if (openRouterAttempted) {
      console.warn("OpenRouter configuration or fallback failed:", error)
    }
  }

  if (lastError && isLimitLikeError(lastError)) {
    return createTextStream(FRIENDLY_LIMIT_MESSAGE)
  }

  throw (
    lastError ??
    new GroqApiError("Groq could not process the chat request.", 500)
  )
}

export async function createGroqChatCompletionForModel(
  messages: GroqChatMessage[],
  model: string,
  apiKey: string,
  options?: {
    response_format?: { type: "json_object" }
    maxCompletionTokens?: number
  }
) {
  const {
    maxCompletionTokens = EMAIL_MAX_COMPLETION_TOKENS,
    ...requestOptions
  } = options ?? {}
  let response: Response
  try {
    response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        ...getGroqRequestOptions(model, maxCompletionTokens),
        ...requestOptions,
      }),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown network error"
    throw new GroqApiError(`Network error: ${msg}`, 503)
  }

  if (!response.ok) {
    throw new GroqApiError(
      await readGroqError(response),
      response.status || 500
    )
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ""
}

export async function createOpenRouterChatCompletionForModel(
  messages: GroqChatMessage[],
  model: string,
  apiKey: string,
  options?: {
    response_format?: { type: "json_object" }
    maxCompletionTokens?: number
  }
) {
  const {
    maxCompletionTokens = EMAIL_MAX_COMPLETION_TOKENS,
    ...requestOptions
  } = options ?? {}
  let response: Response
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Web Portfolio",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        max_tokens: maxCompletionTokens,
        temperature: 0.2,
        ...requestOptions,
      }),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown network error"
    throw new GroqApiError(`Network error: ${msg}`, 503)
  }

  if (!response.ok) {
    throw new GroqApiError(
      await readGroqError(response),
      response.status || 500
    )
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ""
}

export async function createGroqChatCompletion(
  messages: GroqChatMessage[],
  options?: {
    response_format?: { type: "json_object" }
    maxCompletionTokens?: number
  }
) {
  let lastError: GroqApiError | null = null
  const apiKeys = getGroqApiKeys()

  for (const model of getFallbackModels()) {
    for (const apiKey of apiKeys) {
      try {
        return await createGroqChatCompletionForModel(
          messages,
          model,
          apiKey.key,
          options
        )
      } catch (error) {
        if (error instanceof GroqApiError) {
          lastError = error
          if (!shouldTryNextModel(error)) {
            throw error
          }
          console.warn(
            `Groq limit/not-found error on ${apiKey.label} with ${model}: ${error.status}`
          )
          continue
        }
        throw error
      }
    }
  }

  let openRouterAttempted = false
  try {
    const openRouterKeys = getOpenRouterApiKeys()
    openRouterAttempted = true
    for (const apiKey of openRouterKeys) {
      try {
        return await createOpenRouterChatCompletionForModel(
          messages,
          "openai/gpt-oss-120b:free",
          apiKey.key,
          options
        )
      } catch (orError) {
        if (!(orError instanceof GroqApiError)) throw orError
        if (!shouldTryNextModel(orError)) {
          throw orError
        }
        console.warn(
          `OpenRouter limit/not-found error on ${apiKey.label}: ${orError.status}`
        )
      }
    }
  } catch (error) {
    if (openRouterAttempted) {
      console.warn("OpenRouter configuration or fallback failed:", error)
    }
  }

  throw (
    lastError ??
    new GroqApiError("Groq could not process the chat request.", 500)
  )
}
