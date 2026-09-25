import { NextResponse } from "next/server"

import { fetchMediumPosts } from "@/features/blog/lib/fetch-medium-posts"

export const runtime = "edge"
export const revalidate = 1800

// Re-export the type so other modules can import from here
export type { MediumPost } from "@/features/blog/lib/fetch-medium-posts"

export async function GET() {
  const posts = await fetchMediumPosts()

  if (!posts.length) {
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 502 })
  }

  return NextResponse.json(posts, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  })
}
