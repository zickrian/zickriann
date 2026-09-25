import { getGitHubContributions } from "@/features/portfolio/data/github-contributions"

export async function GET() {
  const contributions = await getGitHubContributions()

  return Response.json(contributions, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}
