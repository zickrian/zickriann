"use client"

import { ArrowUpRightIcon } from "lucide-react"

import { useChat } from "@/components/chat-provider"
import { preloadChatPanel } from "@/components/chat-widget"
import { Magnetic } from "@/components/core/magnetic"
import { UTM_PARAMS } from "@/config/site"
import type { SocialLink } from "@/features/portfolio/types/social-links"
import { cn } from "@/lib/utils"
import { addQueryParams } from "@/utils/url"

export function SocialLinkItem({
  icon,
  title,
  href,
  index = 0,
  className,
}: SocialLink & { index?: number; className?: string }) {
  const isExternal = href.startsWith("http")
  const isMailto = href.startsWith("mailto:")
  const { setIsChatOpen } = useChat()

  const handleMouseEnter = () => {
    if (isMailto) {
      preloadChatPanel()
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMailto) {
      e.preventDefault()
      setIsChatOpen(true)
      setTimeout(
        () => window.dispatchEvent(new CustomEvent("startEmailFlow")),
        100
      )
    }
  }

  // Desktop (3 columns: 0,1,2 / 3,4,5)
  const isDesktopRow1 = index < 3
  const isDesktopRow2 = index >= 3
  const isDesktopCol1 = index % 3 === 0
  const isDesktopCol2 = index % 3 === 1
  const isDesktopCol3 = index % 3 === 2

  // Mobile (2 columns: 0,1 / 2,3 / 4,5)
  const isMobileRow1 = index < 2
  const isMobileRow2 = index >= 2 && index < 4
  const isMobileRow3 = index >= 4
  const isMobileCol1 = index % 2 === 0
  const isMobileCol2 = index % 2 === 1

  return (
    <a
      className={cn(
        "flex cursor-pointer items-center gap-3 bg-card px-4 py-3 transition-[background-color] ease-out hover:bg-accent-muted",
        // Desktop horizontal dividers (2 horizontal lines)
        isDesktopRow1 && "md:border-b md:border-line",
        isDesktopRow2 && "md:border-t md:border-line",
        // Desktop vertical dividers (2 vertical lines)
        isDesktopCol1 && "md:border-r md:border-line",
        isDesktopCol2 && "md:border-x md:border-line",
        isDesktopCol3 && "md:border-l md:border-line",
        // Mobile horizontal dividers (2 horizontal lines between each row)
        isMobileRow1 && "max-md:border-b max-md:border-line",
        isMobileRow2 && "max-md:border-y max-md:border-line",
        isMobileRow3 && "max-md:border-t max-md:border-line",
        // Mobile vertical dividers (2 vertical lines)
        isMobileCol1 && "max-md:border-r max-md:border-line",
        isMobileCol2 && "max-md:border-l max-md:border-line",
        className
      )}
      href={isExternal ? addQueryParams(href, UTM_PARAMS) : href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      onClick={handleClick}
      onPointerEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
    >
      <Magnetic intensity={0.25}>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg select-none",
            "border border-border",
            "bg-muted/50 text-foreground",
            "shadow-xs",
            "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-foreground/80 [&_svg]:drop-shadow-xs [&_svg:not([class*='size-'])]:size-5"
          )}
          aria-hidden
        >
          {icon}
        </span>
      </Magnetic>

      <span className="flex-1 font-medium">{title}</span>

      <ArrowUpRightIcon className="size-4 text-muted-foreground" />
    </a>
  )
}
