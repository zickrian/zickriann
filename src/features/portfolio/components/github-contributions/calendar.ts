import { eachDayOfInterval, formatISO, subYears } from "date-fns"

import type { Activity } from "@/features/portfolio/data/github-contributions"

const getDateKey = (date: Date) => formatISO(date, { representation: "date" })

/**
 * Expands the raw API response into one entry per day for the trailing year.
 *
 * This has to run on the server only. It reads `new Date()` and formats in the
 * local zone, so running it during render of a client component made the server
 * (UTC, at ISR build time) and the browser (visitor's zone, at hydration time)
 * disagree about which days the calendar covers - a hydration text mismatch
 * (React #418) whenever the cached HTML was a day old or the visitor was not on
 * UTC. Computing it once here and passing the result down keeps both sides
 * rendering from the same fixed array.
 */
export function getLastYearContributions(activities: Activity[]): Activity[] {
  const today = new Date()
  const start = subYears(today, 1)
  const calendar = new Map(
    (Array.isArray(activities) ? activities : []).map((activity) => [
      activity.date,
      activity,
    ])
  )

  return eachDayOfInterval({ start, end: today }).map((day) => {
    const date = getDateKey(day)

    return (
      calendar.get(date) ?? {
        date,
        count: 0,
        level: 0,
      }
    )
  })
}
