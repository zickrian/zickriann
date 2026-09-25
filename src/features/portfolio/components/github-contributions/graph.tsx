"use client"

import { useMemo, useState } from "react"

import type * as TooltipComponents from "@/components/base/ui/tooltip"
import { GITHUB_USERNAME, UTM_PARAMS } from "@/config/site"
import { addQueryParams } from "@/utils/url"

/**
 * Radix's tooltip is only ever shown by this graph, which sits below the fold
 * and reacts to the pointer alone, so it is fetched on the first pointer entry
 * rather than shipped in the initial bundle. Until then the calendar renders
 * and reads exactly the same - it just has no floating label yet.
 */
type TooltipModule = typeof TooltipComponents

let tooltipPromise: Promise<TooltipModule> | undefined

function loadTooltip() {
  return (tooltipPromise ??= import("@/components/base/ui/tooltip"))
}

export type CompactContributionDay = readonly [count: number, level: number]

const BLOCK_SIZE = 12
const BLOCK_MARGIN = 2
const CELL_SIZE = BLOCK_SIZE + BLOCK_MARGIN
const LABEL_HEIGHT = 22
const HEIGHT = LABEL_HEIGHT + CELL_SIZE * 7 - BLOCK_MARGIN
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

type PositionedDay = {
  count: number
  date: string
  dayIndex: number
  level: number
  weekIndex: number
}

function buildCalendar(startDate: string, days: CompactContributionDay[]) {
  const start = new Date(`${startDate}T00:00:00Z`)
  const startDay = start.getUTCDay()
  const positionedDays = days.map(([count, level], index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    const cellIndex = startDay + index

    return {
      count,
      date: date.toISOString().slice(0, 10),
      dayIndex: cellIndex % 7,
      level,
      weekIndex: Math.floor(cellIndex / 7),
    }
  })
  const weekCount = Math.ceil((startDay + days.length) / 7)
  const monthLabels = positionedDays
    .filter((day, index, all) => {
      if (index > 0 && day.weekIndex === all[index - 1]?.weekIndex) return false
      const previousWeek = all.find(
        (candidate) => candidate.weekIndex === day.weekIndex - 1
      )
      return (
        !previousWeek || previousWeek.date.slice(5, 7) !== day.date.slice(5, 7)
      )
    })
    .map((day) => ({
      label: MONTHS[Number(day.date.slice(5, 7)) - 1],
      weekIndex: day.weekIndex,
    }))
    .filter((label, index, labels) => {
      const next = labels[index + 1]
      if (index === 0)
        return next ? next.weekIndex - label.weekIndex >= 3 : true
      if (!next) return weekCount - label.weekIndex >= 3
      return true
    })

  const paths = Array.from({ length: 5 }, () => "")
  const cells = new Map<string, PositionedDay>()
  for (const day of positionedDays) {
    cells.set(`${day.weekIndex}:${day.dayIndex}`, day)
    if (day.level < 0 || day.level > 4) continue
    const x = day.weekIndex * CELL_SIZE
    const y = LABEL_HEIGHT + day.dayIndex * CELL_SIZE
    paths[day.level] += `M${x} ${y}h${BLOCK_SIZE}v${BLOCK_SIZE}h-${BLOCK_SIZE}Z`
  }

  return {
    cells,
    monthLabels,
    paths,
    totalCount: days.reduce((sum, [count]) => sum + count, 0),
    weekCount,
  }
}

export function GitHubContributionGraph({
  startDate,
  days,
}: {
  startDate: string
  days: CompactContributionDay[]
}) {
  const calendar = useMemo(
    () => buildCalendar(startDate, days),
    [days, startDate]
  )
  const [hovered, setHovered] = useState<PositionedDay | null>(null)
  const [tooltip, setTooltip] = useState<TooltipModule | null>(null)
  const width = calendar.weekCount * CELL_SIZE - BLOCK_MARGIN

  function handlePointerEnter() {
    if (tooltip) return
    loadTooltip()
      .then(setTooltip)
      .catch(() => {
        tooltipPromise = undefined
      })
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * width
    const y = ((event.clientY - rect.top) / rect.height) * HEIGHT
    const weekIndex = Math.floor(x / CELL_SIZE)
    const dayIndex = Math.floor((y - LABEL_HEIGHT) / CELL_SIZE)
    const insideBlock =
      y >= LABEL_HEIGHT &&
      x % CELL_SIZE <= BLOCK_SIZE &&
      (y - LABEL_HEIGHT) % CELL_SIZE <= BLOCK_SIZE
    const next = insideBlock
      ? (calendar.cells.get(`${weekIndex}:${dayIndex}`) ?? null)
      : null

    if (next?.date !== hovered?.date) setHovered(next)
  }

  return (
    <div className="mx-auto flex w-full min-w-0 flex-col gap-4 py-4 text-sm">
      <div className="w-full min-w-0 overflow-hidden px-4 text-muted-foreground">
        <svg
          className="block h-auto w-full overflow-visible"
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width={width}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHovered(null)}
          aria-hidden
        >
          <title>GitHub Contributions</title>
          <g className="fill-current selection:fill-selection-foreground">
            {calendar.monthLabels.map(({ label, weekIndex }) => (
              <text
                dominantBaseline="hanging"
                key={weekIndex}
                x={CELL_SIZE * weekIndex}
              >
                {label}
              </text>
            ))}
          </g>
          {calendar.paths.map((path, level) => (
            <path
              className="contribution-level"
              data-level={level}
              d={path}
              key={level}
            />
          ))}
          {hovered && tooltip && (
            <tooltip.TooltipProvider>
              <tooltip.Tooltip open>
                <tooltip.TooltipTrigger asChild>
                  <rect
                    fill="transparent"
                    height={BLOCK_SIZE}
                    width={BLOCK_SIZE}
                    x={hovered.weekIndex * CELL_SIZE}
                    y={LABEL_HEIGHT + hovered.dayIndex * CELL_SIZE}
                  />
                </tooltip.TooltipTrigger>
                <tooltip.TooltipContent className="font-sans">
                  <p>
                    {hovered.count} contribution{hovered.count > 1 ? "s" : null}{" "}
                    on{" "}
                    {dateFormatter.format(new Date(`${hovered.date}T00:00:00Z`))}
                  </p>
                </tooltip.TooltipContent>
              </tooltip.Tooltip>
            </tooltip.TooltipProvider>
          )}
        </svg>
      </div>

      <div className="flex flex-wrap gap-4 px-4 leading-none whitespace-nowrap">
        <div className="text-muted-foreground">
          {calendar.totalCount.toLocaleString("en")} contributions on{" "}
          <a
            className="text-foreground link-underline"
            href={addQueryParams(
              `https://github.com/${GITHUB_USERNAME}`,
              UTM_PARAMS
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </div>

        <div className="ml-auto flex items-center gap-0.75" aria-hidden>
          <span className="mr-1 text-muted-foreground">Less</span>
          {calendar.paths.map((_, level) => (
            <svg height={BLOCK_SIZE} key={level} width={BLOCK_SIZE}>
              <rect
                className="contribution-level"
                data-level={level}
                height={BLOCK_SIZE}
                width={BLOCK_SIZE}
              />
            </svg>
          ))}
          <span className="ml-1 text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  )
}

export function GitHubContributionFallback() {
  return (
    <div className="flex h-40.5 w-full items-center justify-center px-4 text-center">
      <p className="text-sm text-muted-foreground">
        Contribution data is unavailable right now. View it on{" "}
        <a
          className="text-foreground link-underline"
          href={addQueryParams(
            `https://github.com/${GITHUB_USERNAME}`,
            UTM_PARAMS
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
      </p>
    </div>
  )
}
