"use client"

import { differenceInMonths, parse } from "date-fns"
import { BriefcaseBusinessIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleChevronsIcon,
} from "@/components/base/collapsible-animated"
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/base/ui/collapsible"
import { Markdown } from "@/components/markdown"
import { Separator } from "@/components/ui/separator"
import { Tag } from "@/components/ui/tag"
import { Prose } from "@/components/ui/typography"
import type { ExperiencePosition } from "@/features/portfolio/types/experiences"
import { useTranslation } from "@/lib/i18n/use-translation"
import { cn } from "@/lib/utils"

const EMPLOYMENT_TYPE_ID: Record<string, string> = {
  Internship: "Magang",
  Cohort: "Kohort",
  "Part-time": "Paruh Waktu",
  Community: "Komunitas",
}

export function ExperiencePositionItem({
  position,
}: {
  position: ExperiencePosition
}) {
  const { t, l, language } = useTranslation()
  const { start, end } = position.employmentPeriod
  const isOngoing = !end
  const duration = formatDuration(start, end)
  const employmentType =
    language === "id" && position.employmentType
      ? (EMPLOYMENT_TYPE_ID[position.employmentType] ?? position.employmentType)
      : position.employmentType

  return (
    <Collapsible
      className="group/experience-position relative"
      defaultOpen={position.isExpanded}
      disabled={!position.description}
    >
      <div
        className="pointer-events-none absolute bottom-0 left-3 hidden size-4 bg-card group-last/experience-position:flex"
        aria-hidden
      >
        <span className="size-full -translate-y-2.25 rounded-bl-sm border-b border-l" />
      </div>
      <CollapsibleTrigger
        className={cn(
          "group block w-full text-left",
          "relative before:absolute before:-top-1 before:-right-1 before:-bottom-1.5 before:left-7 before:-z-1 before:rounded-lg before:transition-[background-color] before:ease-out hover:before:bg-accent-muted",
          "outline-none focus-visible:before:ring-2 focus-visible:before:ring-ring/50 focus-visible:before:ring-inset",
          "data-disabled:before:content-none"
        )}
      >
        <div className="relative z-1 mb-1 flex items-start gap-3">
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-lg",
              "bg-muted text-muted-foreground",
              "border border-muted-foreground/15 ring-1 ring-line ring-offset-1 ring-offset-background",
              "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            )}
          >
            {position.icon ?? <BriefcaseBusinessIcon />}
          </div>

          <span className="flex-1 font-medium text-balance">
            {position.title}
          </span>

          <div className="shrink-0 text-muted-foreground group-data-disabled:hidden [&_svg]:size-4">
            <CollapsibleChevronsIcon duration={0.15} />
          </div>
        </div>

        <div className="flex items-center gap-2 pl-9 text-sm text-muted-foreground">
          {employmentType && (
            <>
              <dl>
                <dt className="sr-only">{t.experiences.employmentType}</dt>
                <dd>{employmentType}</dd>
              </dl>
              <Separator
                className="data-vertical:h-4 data-vertical:self-center"
                orientation="vertical"
              />
            </>
          )}

          <dl>
            <dt className="sr-only">{t.experiences.employmentPeriod}</dt>
            <dd className="flex items-center gap-0.5 font-mono text-xs tabular-nums">
              <span>{start}</span>
              <span>-</span>
              <span>{isOngoing ? t.experiences.present : end}</span>
            </dd>
          </dl>

          {duration && (
            <>
              <Separator
                className="data-vertical:h-4 data-vertical:self-center"
                orientation="vertical"
              />
              <dl>
                <dt className="sr-only">{t.experiences.duration}</dt>
                <dd
                  suppressHydrationWarning
                  className="font-mono text-xs tabular-nums"
                >
                  {duration}
                </dd>
              </dl>
            </>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden">
        {position.description && (
          <Prose className="pt-2 pl-9">
            <Markdown>{l(position.description, position.descriptionId)}</Markdown>
          </Prose>
        )}
      </CollapsibleContent>

      {Array.isArray(position.skills) && position.skills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 pt-3 pl-9">
          {position.skills.map((skill, index) => (
            <li key={index} className="flex">
              <Tag>{skill}</Tag>
            </li>
          ))}
        </ul>
      )}
    </Collapsible>
  )
}

function formatDuration(start: string, end?: string): string {
  const startHasMonth = start.includes(".")
  const endHasMonth = end ? end.includes(".") : true

  // Both year-only: granularity is years, no month arithmetic needed.
  if (!startHasMonth && end && !endHasMonth) {
    const years = parseInt(end, 10) - parseInt(start, 10)
    if (years <= 0) {
      return ""
    }
    return `${years}y`
  }

  const startDate = parsePeriodDate(start, "first")
  const endDate = end ? parsePeriodDate(end, "last") : new Date()

  // +1 to count both the start and end months inclusively.
  const totalMonths = differenceInMonths(endDate, startDate) + 1
  if (totalMonths <= 0) {
    return ""
  }

  if (totalMonths < 12) {
    return `${totalMonths}m`
  }

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (months === 0) {
    return `${years}y`
  }
  return `${years}y ${months}m`
}

function parsePeriodDate(str: string, fallbackMonth: "first" | "last"): Date {
  if (str.includes(".")) {
    return parse(str, "MM.yyyy", new Date())
  }
  return parse(
    `${fallbackMonth === "last" ? "12" : "01"}.${str}`,
    "MM.yyyy",
    new Date()
  )
}
