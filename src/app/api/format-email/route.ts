import { NextResponse } from "next/server"

import { USER } from "@/features/portfolio/data/user"
import { acquireAiRequest } from "@/lib/chat-rate-limit"
import {
  createGroqChatCompletion,
  GroqApiError,
  GroqConfigurationError,
} from "@/lib/groq"

export const runtime = "nodejs"

type FormatPayload = {
  senderName: string
  senderEmail: string
  rawMessage: string
}

function sanitize(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().slice(0, max)
}

export async function POST(req: Request) {
  let releaseRequest: (() => void) | undefined

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 })
    }

    const raw = body as Record<string, unknown>
    const payload: FormatPayload = {
      senderName: sanitize(raw.senderName, 100),
      senderEmail: sanitize(raw.senderEmail, 254),
      rawMessage: sanitize(raw.rawMessage, 3000),
    }

    if (!payload.senderName || !payload.senderEmail || !payload.rawMessage) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 })
    }

    const rateLimit = acquireAiRequest(req)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many AI requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      )
    }
    releaseRequest = rateLimit.release

    const systemPrompt = `You are an email formatter assistant for ${USER.displayName}'s portfolio site.
Your task: Given a raw message from a visitor, produce a polished, clear email.

Rules:
- Output ONLY a valid JSON object (no markdown, no extra text).
- JSON shape: { "subject": "...", "message": "..." }
- Language: You MUST use the exact same language as the visitor's original message for BOTH the "subject" and the "message". Do NOT translate it to English if the user writes in another language.
- Tone & Meaning: You must strictly preserve the original meaning, intent, emotion, and vocabulary of the visitor's message. Do NOT change the meaning. Only tidy up typos, grammatical errors, and formatting to make it clearer and easier to read.
- Structure: Do not add greetings or sign-offs (these are handled separately). Just output the polished core body text.`

    const userPrompt = `Sender name: ${payload.senderName}
Sender email: ${payload.senderEmail}
Raw message: ${payload.rawMessage}

Format this into a professional email JSON.`

    const content = await createGroqChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        response_format: { type: "json_object" },
        maxCompletionTokens: 768,
      }
    )
    releaseRequest()
    releaseRequest = undefined

    let parsed: { subject?: string; message?: string }
    try {
      parsed = JSON.parse(content) as { subject?: string; message?: string }
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response." },
        { status: 500 }
      )
    }

    const subject = (parsed.subject ?? "").trim().slice(0, 200)
    const message = (parsed.message ?? "").trim().slice(0, 5000)

    if (!subject || !message) {
      return NextResponse.json(
        { error: "AI returned an incomplete response." },
        { status: 500 }
      )
    }

    return NextResponse.json({ subject, message })
  } catch (error) {
    releaseRequest?.()
    if (error instanceof GroqConfigurationError) {
      return NextResponse.json(
        { error: "Service not configured." },
        { status: 500 }
      )
    }

    if (error instanceof GroqApiError) {
      console.error("Format Email API Error:", error.message)
      return NextResponse.json(
        {
          error:
            error.status === 429
              ? "The service is temporarily rate-limited. Please try again shortly."
              : "Failed to format email.",
        },
        { status: error.status }
      )
    }

    console.error("Format email error:", error)
    return NextResponse.json(
      { error: "Failed to format email." },
      { status: 500 }
    )
  }
}
