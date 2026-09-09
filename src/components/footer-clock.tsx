"use client"

import { useEffect, useState } from "react"

/**
 * Analogue clock stamp for the footer colophon, adapted from cali.so
 * (MIT, © Cali Castle) onto this project's tokens.
 *
 * The hands only start once mounted: rendering a real time on the server would
 * be a different second than the client's first paint, which is a hydration
 * mismatch. Until then the readout shows placeholder dashes and the hands sit
 * at twelve, so nothing shifts when it resolves.
 */

function useClockParts(timeZone: string) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    let timer: number | undefined

    const tick = () => {
      const current = new Date()
      setNow(current)
      // Re-align to the next second boundary instead of drifting by interval.
      timer = window.setTimeout(tick, 1010 - (current.getTime() % 1000))
    }

    // A background tab does not need a running second hand.
    const syncVisibility = () => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = undefined
      if (!document.hidden) tick()
    }

    syncVisibility()
    document.addEventListener("visibilitychange", syncVisibility)

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [])

  // The zone's offset is deterministic, so it is derived here rather than held
  // in state: server and client resolve the same string for the same zone.
  const offset = utcOffsetLabel(timeZone, now ?? new Date(0))

  if (!now) {
    return {
      hour: 0,
      minute: 0,
      second: 0,
      label: "--:-- --",
      iso: undefined,
      offset,
    }
  }

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )

  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    label: new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    }).format(now),
    iso: now.toISOString(),
    offset,
  }
}

/** "Asia/Jakarta" → "UTC+7", read from the zone rather than hardcoded. */
function utcOffsetLabel(timeZone: string, at: Date) {
  const zonePart = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")

  return zonePart?.value.replace("GMT", "UTC") ?? "UTC"
}

export function FooterClock({
  timeZone,
  place,
}: {
  timeZone: string
  place: string
}) {
  const { hour, minute, second, label, iso, offset } = useClockParts(timeZone)

  const secondAngle = second * 6
  const minuteAngle = (minute + second / 60) * 6
  const hourAngle = ((hour % 12) + minute / 60 + second / 3600) * 30

  return (
    <div className="footer-stamp">
      {/* Size, fill and stroke are attributes as well as CSS: an SVG with none of
          them falls back to its 300×150 intrinsic box filled solid black, so any
          moment without the stylesheet renders a black disc instead of a dial.
          The utility still owns the per-hand weights and opacities. */}
      <svg
        className="footer-clock"
        viewBox="0 0 32 32"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        aria-hidden
        focusable="false"
      >
        <circle className="footer-clock-ring" cx="16" cy="16" r="14.5" />
        <path
          className="footer-clock-ticks"
          d="M16 3.5v2M28.5 16h-2M16 28.5v-2M3.5 16h2"
        />
        <line
          className="footer-clock-hour"
          x1="16"
          y1="16"
          x2="16"
          y2="9.5"
          transform={`rotate(${hourAngle} 16 16)`}
        />
        <line
          className="footer-clock-minute"
          x1="16"
          y1="16"
          x2="16"
          y2="6.75"
          transform={`rotate(${minuteAngle} 16 16)`}
        />
        <line
          className="footer-clock-second"
          x1="16"
          y1="17.5"
          x2="16"
          y2="5.5"
          transform={`rotate(${secondAngle} 16 16)`}
        />
        <circle className="footer-clock-pin" cx="16" cy="16" r="1" />
      </svg>

      <span className="footer-stamp-lines">
        <span suppressHydrationWarning>{offset}</span>
        <time
          suppressHydrationWarning
          dateTime={iso}
          aria-label={`Current local time in ${place}: ${label}`}
        >
          {label}
        </time>
      </span>
    </div>
  )
}
