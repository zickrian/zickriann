import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SectionCalloutProps = {
  side: "left" | "right"
  children: ReactNode
  className?: string
}

export function SectionCallout({
  side,
  children,
  className,
}: SectionCalloutProps) {
  const isLeft = side === "left"

  return (
    <aside
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-12 z-10 hidden w-40 flex-col gap-1 xl:flex",
        isLeft ? "left-[-11rem] items-end" : "right-[-11rem] items-start",
        className
      )}
    >
      <div
        className={cn(
          "flex max-w-40 flex-col font-handwritten text-[1.35rem]/[1.05] tracking-normal text-muted-foreground",
          isLeft ? "items-end text-right" : "items-start text-left"
        )}
      >
        <span>{children}</span>
      </div>
      <svg
        className={cn(
          "size-10 text-muted-foreground/55",
          isLeft ? "-scale-x-100 -rotate-6" : "rotate-6"
        )}
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M34 4c1 15-5 26-21 30" />
        <path d="m21 36-8-2 7-7" />
      </svg>
    </aside>
  )
}
