import { unstable_cache } from "next/cache"

import { GITHUB_USERNAME } from "@/config/site"

import { getGitHubContributions } from "./github-contributions"

/** Weeks of history drawn in the footer hover card's mini calendar. */
const CARD_WEEKS = 20
const CARD_DAYS = CARD_WEEKS * 7

export type GitHubSocialCard = {
  /** All-time contribution count, summed from the contributions feed. */
  contributions: number
  /** `null` when the profile call failed - the card then omits the line
   *  rather than showing a zero that would read as a real figure. */
  followers: number | null
  /** Contribution levels 0–4 for the most recent `CARD_DAYS`, oldest first. */
  levels: number[]
  weeks: number
}

type GitHubUser = { followers?: number }

const getFollowers = unstable_cache(
  async (): Promise<number | null> => {
    try {
      const res = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}`,
        {
          headers: { Accept: "application/vnd.github+json" },
          signal: AbortSignal.timeout(5000),
        }
      )
      if (!res.ok) return null

      const user = (await res.json()) as GitHubUser
      return typeof user.followers === "number" ? user.followers : null
    } catch {
      // The footer renders on every route; a rate-limited or slow GitHub must
      // never be able to fail a page render.
      return null
    }
  },
  ["github-followers"],
  { revalidate: 86_400 }
)

export async function getGitHubSocialCard(): Promise<GitHubSocialCard | null> {
  let activities: Awaited<ReturnType<typeof getGitHubContributions>>
  let followers: number | null

  try {
    const [resolvedActivities, resolvedFollowers] = await Promise.all([
      getGitHubContributions(),
      getFollowers(),
    ])
    activities = resolvedActivities
    followers = resolvedFollowers
  } catch {
    // The footer is rendered on every static route. The contributions request
    // deliberately throws on timeout or invalid upstream data so it is not
    // cached as an empty result; catch it at this presentation boundary so a
    // temporary GitHub outage cannot fail the whole site export.
    return null
  }

  if (activities.length === 0) return null

  // Two traps in this feed, both of which silently produce an empty calendar:
  // it arrives newest-first, and `?y=all` pads the current year out to 31 Dec,
  // so the raw tail is the oldest days followed by unwritten future ones.
  // Sort ascending and cut at today before taking the recent window.
  const today = new Date().toISOString().slice(0, 10)
  const upToToday = activities
    .filter((activity) => activity.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    contributions: upToToday.reduce(
      (total, activity) => total + activity.count,
      0
    ),
    followers,
    levels: upToToday.slice(-CARD_DAYS).map((activity) => activity.level),
    weeks: CARD_WEEKS,
  }
}
