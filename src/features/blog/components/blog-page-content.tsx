// Server Component - no client JS, rendered at build/ISR time.

import { BookOpenIcon } from "lucide-react"
import Image from "next/image"

import { Reveal } from "@/components/core/reveal"
import type { MediumPost } from "@/features/blog/lib/fetch-medium-posts"
import { fetchMediumPosts } from "@/features/blog/lib/fetch-medium-posts"

import { BlogEmptyState } from "./blog-empty-state"

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    })
  } catch {
    return dateStr
  }
}

function BlogListItem({ post, eager }: { post: MediumPost; eager?: boolean }) {
  return (
    <Reveal>
      <div className="group border-b border-line bg-card transition-[background-color] ease-out hover:bg-accent-muted">
        <a
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Read "${post.title}" on Medium`}
          className="flex items-start gap-4 px-4 py-5 transition-[background-color] ease-out hover:bg-accent-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset sm:px-6"
        >
          {/* Left: text content */}
          <div className="min-w-0 flex-1">
            {/* Author row - avatar + name + dot + date */}
            <div className="mb-2.5 flex items-center gap-2">
              <div className="relative size-5 shrink-0 overflow-hidden rounded-full border border-line bg-muted">
                <Image
                  src="/image/profile.webp"
                  alt=""
                  fill
                  sizes="20px"
                  className="object-cover"
                />
              </div>
              <span className="text-[13px] text-foreground/80">
                Firdaus Khotibul Zickrian
              </span>
              <span className="text-[13px] text-muted-foreground">·</span>
              <span className="text-[13px] text-muted-foreground">
                {formatDate(post.pubDate)}
              </span>
            </div>

            {/* Title */}
            <h2 className="mb-1.5 line-clamp-2 text-base leading-snug font-bold tracking-tight text-foreground sm:text-[1.1rem]">
              {post.title}
            </h2>

            {/* Description */}
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {post.description}
            </p>
          </div>

          {/* Right: landscape thumbnail - aligned with title */}
          {post.thumbnail && (
            <div className="relative mt-7 h-17 w-26 shrink-0 overflow-hidden rounded-md border border-line bg-muted sm:mt-7.5 sm:h-21 sm:w-32">
              <Image
                src={post.thumbnail}
                alt=""
                fill
                sizes="128px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                loading={eager ? "eager" : "lazy"}
                fetchPriority={eager ? "high" : "auto"}
              />
            </div>
          )}
        </a>
      </div>
    </Reveal>
  )
}

export async function BlogPageContent() {
  const posts = await fetchMediumPosts()

  if (!posts.length) {
    return (
      <div className="flex flex-col items-center gap-3 border-b border-line px-4 py-14 text-center">
        <BookOpenIcon className="size-5 text-muted-foreground" />
        <BlogEmptyState />
      </div>
    )
  }

  return (
    <div>
      {posts.map((post, index) => (
        <BlogListItem key={post.guid} post={post} eager={index === 0} />
      ))}
    </div>
  )
}
