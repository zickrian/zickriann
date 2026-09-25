import { getGitHubContributions } from "@/features/portfolio/data/github-contributions"

import { Panel } from "../panel"
import { getLastYearContributions } from "./calendar"
import {
  type CompactContributionDay,
  GitHubContributionFallback,
  GitHubContributionGraph,
} from "./graph"

export async function GitHubContributions() {
  let contributions: Awaited<ReturnType<typeof getGitHubContributions>> = []

  try {
    contributions = await getGitHubContributions()
  } catch {
    contributions = []
  }

  // Expand to the trailing-year calendar here rather than in the client
  // component: it keeps the day range identical on both render passes, and only
  // the ~366 days actually drawn get serialised into the RSC payload instead of
  // the full multi-year API response.
  const data =
    contributions.length > 0 ? getLastYearContributions(contributions) : []
  const startDate = data[0]?.date
  const days = data.map(
    ({ count, level }) => [count, level] as CompactContributionDay
  )

  return (
    <Panel id="github" className="defer-offscreen">
      <h2 className="sr-only">GitHub Contributions</h2>

      {startDate ? (
        <GitHubContributionGraph startDate={startDate} days={days} />
      ) : (
        <GitHubContributionFallback />
      )}
    </Panel>
  )
}
