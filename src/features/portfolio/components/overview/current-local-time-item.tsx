"use client"

import { Clock12Icon } from "lucide-react"
import { useEffect, useState } from "react"

import { IntroItem, IntroItemContent, IntroItemIcon } from "./intro-item"

type CurrentLocalTimeItemProps = {
  timeZone: string
}

export function CurrentLocalTimeItem({ timeZone }: CurrentLocalTimeItemProps) {
  const [timeString, setTimeString] = useState<string>("")

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    })

    const update = () => {
      setTimeString(formatter.format(new Date()))
    }

    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [timeZone])

  return (
    <IntroItem>
      <IntroItemIcon>
        <Clock12Icon />
      </IntroItemIcon>

      <IntroItemContent
        suppressHydrationWarning
        aria-label={`Local time: ${timeString || "00:00"}`}
      >
        <span suppressHydrationWarning>{timeString || "00:00"}</span>
      </IntroItemContent>
    </IntroItem>
  )
}
