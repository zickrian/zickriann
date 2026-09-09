import { unstable_cache } from "next/cache"

import { GITHUB_REPO } from "@/config/site"

export type GitHubRepoStats = {
  stars: number
  forks: number
}

export const getGitHubRepoStats = unstable_cache(
  async (repo: string = GITHUB_REPO): Promise<GitHubRepoStats> => {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return { stars: 0, forks: 0 }

      const data = (await res.json()) as {
        stargazers_count?: number
        forks_count?: number
      }
      return {
        stars: typeof data.stargazers_count === "number" ? data.stargazers_count : 0,
        forks: typeof data.forks_count === "number" ? data.forks_count : 0,
      }
    } catch {
      return { stars: 0, forks: 0 }
    }
  },
  ["github-repo-stats"],
  { revalidate: 3600 }
)
