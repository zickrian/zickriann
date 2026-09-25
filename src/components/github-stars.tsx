"use client"

import { useEffect, useState } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/base/ui/tooltip"
import { Button } from "@/components/ui/button"
import { GITHUB_REPO, GITHUB_REPO_URL, UTM_PARAMS } from "@/config/site"
import { formatCompactNumber, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export type GitHubStarsProps = {
  repo?: string
  stargazersCount?: number
  className?: string
}

export function GitHubStars({
  repo = GITHUB_REPO,
  stargazersCount = 0,
  className,
}: GitHubStarsProps) {
  const [stars, setStars] = useState<number>(stargazersCount)

  useEffect(() => {
    let ignore = false
    async function fetchStars() {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: { Accept: "application/vnd.github+json" },
        })
        if (!res.ok) return
        const data = (await res.json()) as { stargazers_count?: number }
        if (!ignore && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count)
        }
      } catch {
        // Silently retain cached stars on failure
      }
    }

    fetchStars()
    return () => {
      ignore = true
    }
  }, [repo])

  const href = `${repo === GITHUB_REPO ? GITHUB_REPO_URL : `https://github.com/${repo}`}?utm_source=${UTM_PARAMS.utm_source}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5 pr-1.5 pl-2 border-none", className)}
          asChild
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`GitHub repository ${repo}, ${formatNumber(stars)} stars`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 fill-current">
              <path
                d="M12 0C5.37 0 0 5.372 0 11.997 0 17.3 3.438 21.795 8.205 23.38c.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.609-4.042-1.609C4.422 17.77 3.633 17.4 3.633 17.4c-1.087-.744.084-.73.084-.73 1.205.085 1.838 1.237 1.838 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.417-1.304.76-1.604-2.665-.3-5.466-1.332-5.466-5.929 0-1.31.465-2.38 1.235-3.219-.135-.303-.54-1.523.105-3.175 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.006 2.04.138 3 .404 2.28-1.551 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.608-2.805 5.623-5.475 5.918.42.36.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.284 0 .315.21.69.825.57C20.565 21.79 24 17.291 24 11.997 24 5.372 18.627 0 12 0"
                fill="currentColor"
              />
            </svg>

            <span
              className="text-[0.8125rem]/none text-muted-foreground tabular-nums transition-colors group-hover/button:text-foreground"
              style={{ textBox: "trim-end cap alphabetic" }}
            >
              {formatCompactNumber(stars).toLowerCase()}
            </span>

            <span className="sr-only">GitHub stars</span>
          </a>
        </Button>
      </TooltipTrigger>

      <TooltipContent side="bottom" sideOffset={6}>
        <span>
          {formatNumber(stars)} {stars === 1 ? "star" : "stars"}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
