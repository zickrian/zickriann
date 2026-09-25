import { NextResponse } from "next/server"

import { USER } from "@/features/portfolio/data/user"
import { getResendClient } from "@/lib/resend"

export const runtime = "nodejs"

const OWNER_EMAIL = Buffer.from(USER.email, "base64").toString("utf-8")
const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_SUBJECT_LENGTH = 200
const MAX_MESSAGE_LENGTH = 5000

type ContactPayload = {
  senderName: string
  senderEmail: string
  subject: string
  message: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitize(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().slice(0, max)
}

// ─── Server-side IP Rate Limiter ──────────────────────────────────────────────
// Sliding window: max 3 requests per IP per hour.
// Stored in-memory; resets when the serverless instance cold-starts.
// For Vercel deployments the real IP comes from x-real-ip or x-forwarded-for.

const IP_RATE_LIMIT_MAX = 3
const IP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const ipStore = new Map<string, number[]>()

function getClientIp(req: Request): string {
  const headers = (req as Request & { headers: Headers }).headers
  const xRealIp = headers.get("x-real-ip")
  if (xRealIp) return xRealIp.trim()
  const xForwardedFor = headers.get("x-forwarded-for")
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim()
  return "unknown"
}

type IpRateLimitResult =
  | { allowed: true }
  | { allowed: false; resetInMs: number }

function checkIpRateLimit(ip: string): IpRateLimitResult {
  const now = Date.now()
  const timestamps = (ipStore.get(ip) ?? []).filter(
    (t) => now - t < IP_RATE_LIMIT_WINDOW_MS
  )

  if (timestamps.length >= IP_RATE_LIMIT_MAX) {
    const oldest = Math.min(...timestamps)
    const resetInMs = IP_RATE_LIMIT_WINDOW_MS - (now - oldest)
    return { allowed: false, resetInMs }
  }

  timestamps.push(now)
  ipStore.set(ip, timestamps)

  // Periodically prune the store to avoid unbounded growth
  if (ipStore.size > 10_000) {
    for (const [key, ts] of ipStore) {
      const fresh = ts.filter((t) => now - t < IP_RATE_LIMIT_WINDOW_MS)
      if (fresh.length === 0) ipStore.delete(key)
      else ipStore.set(key, fresh)
    }
  }

  return { allowed: true }
}

function buildOwnerHtml(payload: ContactPayload) {
  const { senderName, senderEmail, subject, message } = payload
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <style>
    :root { color-scheme: light dark; }

    body, .body-wrap {
      margin: 0; padding: 0;
      background-color: #f6f8fa;
      color: #202124;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px 24px;
      background-color: #ffffff;
    }
    .subject {
      font-size: 20px; font-weight: 400;
      color: #202124; margin: 0 0 16px;
      line-height: 1.3;
    }
    .meta-table { border-collapse: collapse; width: 100%; margin-bottom: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 16px; }
    .meta-table td { padding: 3px 0; vertical-align: top; }
    .meta-label { color: #5f6368; font-size: 13px; white-space: nowrap; padding-right: 16px; width: 52px; }
    .meta-value { color: #202124; font-size: 13px; }
    .meta-value a { color: #1a73e8; text-decoration: none; }
    .section-label {
      font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
      text-transform: uppercase; color: #9aa0a6;
      display: block; margin-bottom: 8px;
    }
    .recap-box { border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; margin-bottom: 28px; }
    .recap-subject {
      padding: 10px 14px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 13px; font-weight: 600;
      color: #202124; background-color: #f8f9fa;
    }
    .recap-body {
      padding: 14px;
      font-size: 14px; color: #3c4043;
      line-height: 1.7; white-space: pre-wrap; word-break: break-word;
      background-color: #ffffff;
    }
    .reply-btn {
      display: inline-block;
      padding: 9px 20px; border-radius: 4px;
      background-color: #1a73e8; color: #ffffff !important;
      font-size: 13px; font-weight: 500; text-decoration: none;
      letter-spacing: 0.25px;
    }
    .footer { margin-top: 32px; font-size: 11px; color: #9aa0a6; }

    /* ── Dark mode: Apple Mail, Outlook Mobile, Samsung Mail ── */
    @media (prefers-color-scheme: dark) {
      body, .body-wrap { background-color: #1f1f1f !important; }
      .wrapper { background-color: #1f1f1f !important; }
      .subject { color: #e8eaed !important; }
      .meta-table { border-color: #3c4043 !important; }
      .meta-label { color: #9aa0a6 !important; }
      .meta-value { color: #e8eaed !important; }
      .meta-value a { color: #8ab4f8 !important; }
      .section-label { color: #5f6368 !important; }
      .recap-box { border-color: #3c4043 !important; }
      .recap-subject { background-color: #2d2e30 !important; border-color: #3c4043 !important; color: #e8eaed !important; }
      .recap-body { background-color: #1f1f1f !important; color: #bdc1c6 !important; }
      .reply-btn { background-color: #8ab4f8 !important; color: #202124 !important; }
      .footer { color: #5f6368 !important; }
    }

    /* ── Gmail Android dark mode ── */
    [data-ogsc] body, [data-ogsc] .body-wrap { background-color: #1f1f1f !important; }
    [data-ogsc] .wrapper { background-color: #1f1f1f !important; }
    [data-ogsc] .subject { color: #e8eaed !important; }
    [data-ogsc] .meta-table { border-color: #3c4043 !important; }
    [data-ogsc] .meta-label { color: #9aa0a6 !important; }
    [data-ogsc] .meta-value { color: #e8eaed !important; }
    [data-ogsc] .meta-value a { color: #8ab4f8 !important; }
    [data-ogsc] .section-label { color: #5f6368 !important; }
    [data-ogsc] .recap-box { border-color: #3c4043 !important; }
    [data-ogsc] .recap-subject { background-color: #2d2e30 !important; border-color: #3c4043 !important; color: #e8eaed !important; }
    [data-ogsc] .recap-body { background-color: #1f1f1f !important; color: #bdc1c6 !important; }
    [data-ogsc] .reply-btn { background-color: #8ab4f8 !important; color: #202124 !important; }
    [data-ogsc] .footer { color: #5f6368 !important; }

    /* ── Gmail iOS dark mode ── */
    u + .body .wrapper { background-color: #1f1f1f !important; }
    u + .body .subject { color: #e8eaed !important; }
    u + .body .meta-label { color: #9aa0a6 !important; }
    u + .body .meta-value { color: #e8eaed !important; }
    u + .body .meta-value a { color: #8ab4f8 !important; }
    u + .body .recap-box { border-color: #3c4043 !important; }
    u + .body .recap-subject { background-color: #2d2e30 !important; border-color: #3c4043 !important; color: #e8eaed !important; }
    u + .body .recap-body { background-color: #1f1f1f !important; color: #bdc1c6 !important; }
    u + .body .reply-btn { background-color: #8ab4f8 !important; color: #202124 !important; }
    u + .body .footer { color: #5f6368 !important; }
  </style>
</head>
<body class="body-wrap">
  <u></u>
  <div class="wrapper">
    <h1 class="subject">${subject}</h1>

    <table class="meta-table" cellpadding="0" cellspacing="0">
      <tr>
        <td class="meta-label">From</td>
        <td class="meta-value">${senderName}</td>
      </tr>
      <tr>
        <td class="meta-label">Email</td>
        <td class="meta-value"><a href="mailto:${senderEmail}">${senderEmail}</a></td>
      </tr>
      <tr>
        <td class="meta-label">Subject</td>
        <td class="meta-value">${subject}</td>
      </tr>
    </table>

    <span class="section-label">Message</span>
    <div class="recap-box">
      <div class="recap-subject">Subject: ${subject}</div>
      <div class="recap-body">${message}</div>
    </div>

    <a href="mailto:${senderEmail}?subject=Re: ${encodeURIComponent(subject)}" class="reply-btn">Reply</a>

    <div class="footer">Sent via ${USER.website}</div>
  </div>
</body>
</html>`
}

function buildSenderHtml(payload: ContactPayload) {
  const { senderName, subject, message } = payload
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Message Received – ${USER.displayName}</title>
  <style>
    :root { color-scheme: light dark; }

    body, .body-wrap {
      margin: 0; padding: 0;
      background-color: #f6f8fa;
      color: #202124;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px 24px;
      background-color: #ffffff;
    }
    .greeting-title { font-size: 20px; font-weight: 600; color: #202124; margin: 0 0 8px; }
    .greeting-sub { font-size: 14px; color: #5f6368; margin: 0 0 24px; }
    .greeting-sub strong { color: #202124; }
    .section-label {
      font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
      text-transform: uppercase; color: #9aa0a6;
      display: block; margin-bottom: 8px;
    }
    .recap-box { border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; margin-bottom: 28px; }
    .recap-subject {
      padding: 10px 14px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 13px; font-weight: 600;
      color: #202124; background-color: #f8f9fa;
    }
    .recap-body {
      padding: 14px;
      font-size: 14px; color: #3c4043;
      line-height: 1.7; white-space: pre-wrap; word-break: break-word;
      background-color: #ffffff;
    }
    .connect-label { font-size: 13px; color: #5f6368; margin: 0 0 12px; }
    .icon-link { display: inline-block; margin-right: 16px; text-decoration: none; }
    .icon-link img { display: block; border: none; }
    .footer { margin-top: 32px; font-size: 11px; color: #9aa0a6; }
    .footer a { color: #9aa0a6; text-decoration: underline; }

    /* ── Dark mode: Apple Mail, Outlook Mobile, Samsung Mail ── */
    @media (prefers-color-scheme: dark) {
      body, .body-wrap { background-color: #1f1f1f !important; }
      .wrapper { background-color: #1f1f1f !important; }
      .greeting-title { color: #e8eaed !important; }
      .greeting-sub { color: #9aa0a6 !important; }
      .greeting-sub strong { color: #e8eaed !important; }
      .section-label { color: #5f6368 !important; }
      .recap-box { border-color: #3c4043 !important; }
      .recap-subject { background-color: #2d2e30 !important; border-color: #3c4043 !important; color: #e8eaed !important; }
      .recap-body { background-color: #1f1f1f !important; color: #bdc1c6 !important; }
      .connect-label { color: #9aa0a6 !important; }
      .footer { color: #5f6368 !important; }
      .footer a { color: #5f6368 !important; }
    }

    /* ── Gmail Android dark mode ── */
    [data-ogsc] body, [data-ogsc] .body-wrap { background-color: #1f1f1f !important; }
    [data-ogsc] .wrapper { background-color: #1f1f1f !important; }
    [data-ogsc] .greeting-title { color: #e8eaed !important; }
    [data-ogsc] .greeting-sub { color: #9aa0a6 !important; }
    [data-ogsc] .section-label { color: #5f6368 !important; }
    [data-ogsc] .recap-box { border-color: #3c4043 !important; }
    [data-ogsc] .recap-subject { background-color: #2d2e30 !important; border-color: #3c4043 !important; color: #e8eaed !important; }
    [data-ogsc] .recap-body { background-color: #1f1f1f !important; color: #bdc1c6 !important; }
    [data-ogsc] .connect-label { color: #9aa0a6 !important; }
    [data-ogsc] .footer { color: #5f6368 !important; }

    /* ── Gmail iOS dark mode ── */
    u + .body .wrapper { background-color: #1f1f1f !important; }
    u + .body .greeting-title { color: #e8eaed !important; }
    u + .body .greeting-sub { color: #9aa0a6 !important; }
    u + .body .recap-box { border-color: #3c4043 !important; }
    u + .body .recap-subject { background-color: #2d2e30 !important; border-color: #3c4043 !important; color: #e8eaed !important; }
    u + .body .recap-body { background-color: #1f1f1f !important; color: #bdc1c6 !important; }
    u + .body .footer { color: #5f6368 !important; }
  </style>
</head>
<body class="body-wrap">
  <u></u>
  <div class="wrapper">
    <h1 class="greeting-title">Hi ${senderName}, message received! ✅</h1>
    <p class="greeting-sub">Thank you for contacting <strong>${USER.displayName}</strong>. Your email has been successfully sent. I will review and reply to you as soon as possible.</p>

    <span class="section-label">Your Message</span>
    <div class="recap-box">
      <div class="recap-subject">Subject: ${subject}</div>
      <div class="recap-body">${message}</div>
    </div>

    <p class="connect-label">You can also reach me here:</p>
    <div>
      <a href="${USER.website}" class="icon-link" title="Portfolio">
        <img src="https://img.icons8.com/ios-filled/100/71717a/domain.png" alt="Portfolio" width="24" height="24" />
      </a>
      <a href="https://wa.me/6285155487647" class="icon-link" title="WhatsApp">
        <img src="https://img.icons8.com/ios-filled/100/71717a/whatsapp--v1.png" alt="WhatsApp" width="24" height="24" />
      </a>
      <a href="https://linkedin.com/in/firdauskhotibulzickrian/" class="icon-link" title="LinkedIn">
        <img src="https://img.icons8.com/ios-filled/100/71717a/linkedin.png" alt="LinkedIn" width="24" height="24" />
      </a>
    </div>

    <div class="footer">This is an automated response from <a href="${USER.website}">${USER.website}</a></div>
  </div>
</body>
</html>`
}

export async function POST(req: Request) {
  try {
    // ── IP rate-limit check ───────────────────────────────────────────────────
    const ip = getClientIp(req)
    const ipRl = checkIpRateLimit(ip)
    if (!ipRl.allowed) {
      const totalMinutes = Math.ceil(ipRl.resetInMs / 60000)
      const resetLabel =
        totalMinutes >= 60 ? "1 hour" : `${totalMinutes} minutes`
      return NextResponse.json(
        {
          error: `Too many requests. You have reached the limit of ${IP_RATE_LIMIT_MAX} emails per hour from this IP. Please try again in ${resetLabel}.`,
          retryAfterMs: ipRl.resetInMs,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(ipRl.resetInMs / 1000)),
            "X-RateLimit-Limit": String(IP_RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      )
    }

    const raw = body as Record<string, unknown>

    const senderName = sanitize(raw.senderName, MAX_NAME_LENGTH)
    const senderEmail = sanitize(raw.senderEmail, MAX_EMAIL_LENGTH)
    const subject = sanitize(raw.subject, MAX_SUBJECT_LENGTH)
    const message = sanitize(raw.message, MAX_MESSAGE_LENGTH)

    if (!senderName || !senderEmail || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      )
    }

    if (!isValidEmail(senderEmail)) {
      return NextResponse.json(
        { error: "Invalid sender email address." },
        { status: 400 }
      )
    }

    const resend = getResendClient()
    const payload: ContactPayload = {
      senderName,
      senderEmail,
      subject,
      message,
    }

    // Send both emails concurrently
    const [ownerResult, senderResult] = await Promise.allSettled([
      resend.emails.send({
        from: `${USER.displayName} Portfolio <hello@zickrian.dev>`,
        to: [OWNER_EMAIL],
        replyTo: senderEmail,
        subject: `[Contact] ${subject} - from ${senderName}`,
        html: buildOwnerHtml(payload),
      }),
      resend.emails.send({
        from: `${USER.displayName} <hello@zickrian.dev>`,
        to: [senderEmail],
        subject: `Message received! – ${USER.displayName}`,
        html: buildSenderHtml(payload),
      }),
    ])

    const ownerOk =
      ownerResult.status === "fulfilled" && !ownerResult.value.error
    const senderOk =
      senderResult.status === "fulfilled" && !senderResult.value.error

    if (!ownerOk) {
      const err =
        ownerResult.status === "rejected"
          ? ownerResult.reason
          : ownerResult.value.error
      console.error("Failed to send owner email:", err)
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      senderNotified: senderOk,
    })
  } catch (error) {
    console.error("Contact API Error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    )
  }
}
