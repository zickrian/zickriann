import { createHash } from "node:crypto"

const MAX_REQUESTS_PER_WINDOW = 6
const REQUEST_WINDOW_MS = 60_000
const MAX_CONCURRENT_REQUESTS = 2

const requestTimes = new Map<string, number[]>()
let activeRequests = 0

function clientKey(req: Request) {
  const forwarded =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown"

  return createHash("sha256")
    .update(forwarded.trim())
    .digest("hex")
    .slice(0, 24)
}

export type AiRateLimitResult =
  | { allowed: true; release: () => void }
  | { allowed: false; retryAfterSeconds: number }

export function acquireAiRequest(req: Request): AiRateLimitResult {
  const now = Date.now()

  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return { allowed: false, retryAfterSeconds: 1 }
  }

  const key = clientKey(req)
  const recent = (requestTimes.get(key) ?? []).filter(
    (timestamp) => now - timestamp < REQUEST_WINDOW_MS
  )

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((REQUEST_WINDOW_MS - (now - recent[0])) / 1000)
      ),
    }
  }

  recent.push(now)
  requestTimes.set(key, recent)

  if (requestTimes.size > 10_000) {
    for (const [storedKey, timestamps] of requestTimes) {
      if (
        timestamps.every((timestamp) => now - timestamp >= REQUEST_WINDOW_MS)
      ) {
        requestTimes.delete(storedKey)
      }
    }
  }

  activeRequests += 1

  let released = false
  return {
    allowed: true,
    release: () => {
      if (released) return
      released = true
      activeRequests = Math.max(0, activeRequests - 1)
    },
  }
}
