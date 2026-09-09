import { unstable_cache } from "next/cache"

import { GITHUB_USERNAME } from "@/config/site"

export type Activity = {
  date: string
  count: number
  level: number
}

type GitHubContributionsResponse = {
  contributions?: Activity[]
}

function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== "object") return false

  const activity = value as Record<string, unknown>

  return (
    typeof activity.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(activity.date) &&
    typeof activity.count === "number" &&
    Number.isFinite(activity.count) &&
    activity.count >= 0 &&
    typeof activity.level === "number" &&
    Number.isInteger(activity.level) &&
    activity.level >= 0 &&
    activity.level <= 4
  )
}

async function fetchFromJogruber(username: string): Promise<Activity[] | null> {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=all`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return null

    const data = (await res.json()) as GitHubContributionsResponse
    const contributions = data.contributions

    if (
      Array.isArray(contributions) &&
      contributions.length > 0 &&
      contributions.every(isActivity)
    ) {
      return contributions
    }
    return null
  } catch {
    return null
  }
}

async function fetchFromGitHubDirect(
  username: string
): Promise<Activity[] | null> {
  try {
    const res = await fetch(
      `https://github.com/users/${username}/contributions`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return null
    const html = await res.text()

    const tooltips = new Map<string, number>()
    const tooltipRegex =
      /<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]+)<\/tool-tip>/g
    let match: RegExpExecArray | null

    while ((match = tooltipRegex.exec(html)) !== null) {
      const forId = match[1]
      const text = match[2].trim()
      const countMatch = text.match(/^(\d+)\s+contribution/i)
      const count = countMatch ? parseInt(countMatch[1], 10) : 0
      tooltips.set(forId, count)
    }

    const days: Activity[] = []
    const dayRegex =
      /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"[^>]*data-level="(\d+)"[^>]*>/g

    while ((match = dayRegex.exec(html)) !== null) {
      const date = match[1]
      const id = match[2]
      const level = parseInt(match[3], 10)
      const count = tooltips.get(id) ?? (level > 0 ? 1 : 0)
      days.push({ date, count, level })
    }

    if (days.length > 0 && days.every(isActivity)) {
      return days
    }
    return null
  } catch {
    return null
  }
}

export const getGitHubContributions = unstable_cache(
  // Throws on failure instead of swallowing it here: `unstable_cache` only
  // memoizes a *resolved* value, so a caught-and-returned `[]` would get
  // stored as "no contributions" for the full 24h `revalidate` window off the
  // back of a single network hiccup - every visitor would see the empty
  // fallback for a day. Letting it throw means a failed fetch is retried on
  // the very next request instead.
  //
  // Dual-source strategy:
  // 1. Primary: jogruber API for full multi-year history.
  // 2. Fallback: official GitHub public profile HTML endpoint for rock-solid 1-year history.
  async () => {
    const jogruberResult = await fetchFromJogruber(GITHUB_USERNAME)
    if (jogruberResult) {
      return jogruberResult
    }

    const directGitHubResult = await fetchFromGitHubDirect(GITHUB_USERNAME)
    if (directGitHubResult) {
      return directGitHubResult
    }

    throw new Error("Failed to fetch GitHub contributions from all sources")
  },
  ["github-contributions"],
  { revalidate: 86400 }
)
