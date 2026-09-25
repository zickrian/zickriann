"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { type MouseEvent, useEffect, useRef, useState } from "react"

import { useChat } from "@/components/chat-provider"
import { preloadChatPanel } from "@/components/chat-widget"
import { useNavigationSound } from "@/hooks/soundcn/use-navigation-sound"
import { useSoundPreference } from "@/hooks/soundcn/use-sound-preference"
import { useLanguagePreference } from "@/hooks/use-language-preference"
import { useTranslation } from "@/lib/i18n/use-translation"
import { cn } from "@/lib/utils"

import { CircleSettingsMenu } from "./circle-settings-menu"

type IconProps = {
  className?: string
  active?: boolean
}

/* Refined Duotone SVG Icons with subtle translucent fills adaptive to light & dark mode + micro-animations */
function IconHome({ className, active = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        "transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-105",
        className
      )}
    >
      <path
        d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        fill="currentColor"
        opacity={active ? 0.16 : 0.06}
      />
      <path
        d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-90"
      />
    </svg>
  )
}

function IconProjects({ className, active = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        "transition-transform duration-300 ease-out group-hover:scale-105",
        className
      )}
    >
      <path
        d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"
        fill="currentColor"
        opacity={active ? 0.16 : 0.06}
      />
      <path
        d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="origin-[4px_19px] transition-transform duration-300 ease-out group-hover:-rotate-3 group-hover:skew-x-2"
      />
      <circle
        cx="14"
        cy="15"
        r="1.1"
        fill="currentColor"
        className="origin-[14px_15px] transition-transform duration-300 ease-out group-hover:scale-125"
      />
    </svg>
  )
}

function IconBlog({ className, active = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        "transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-[-2deg]",
        className
      )}
    >
      <path
        d="M6 2h14v20H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
        fill="currentColor"
        opacity={active ? 0.16 : 0.06}
      />
      <path
        d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 7h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="transition-transform duration-300 ease-out group-hover:translate-x-0.5"
      />
      <path
        d="M8 11h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="transition-transform duration-300 ease-out group-hover:translate-x-1"
      />
      <path
        d="M8 15h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="transition-transform duration-300 ease-out group-hover:translate-x-0.5"
      />
    </svg>
  )
}

function IconGallery({ className, active = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        "transition-transform duration-300 ease-out group-hover:scale-105 group-hover:rotate-2",
        className
      )}
    >
      <rect
        width="18"
        height="18"
        x="3"
        y="3"
        rx="3"
        fill="currentColor"
        opacity={active ? 0.16 : 0.06}
      />
      <rect
        width="18"
        height="18"
        x="3"
        y="3"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="8.5"
        cy="8.5"
        r="1.5"
        fill="currentColor"
        className="origin-[8.5px_8.5px] transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110"
      />
      <path
        d="m21 15-5-5-8 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m14 14 2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconChat({ className, active = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        "origin-bottom-left transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-rotate-3",
        className
      )}
    >
      <path
        d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
        fill="currentColor"
        opacity={active ? 0.16 : 0.06}
      />
      <path
        d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="8"
        cy="12"
        r="1"
        fill="currentColor"
        className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
      />
      <circle
        cx="12"
        cy="12"
        r="1"
        fill="currentColor"
        className="transition-transform delay-75 duration-300 ease-out group-hover:-translate-y-0.5"
      />
      <circle
        cx="16"
        cy="12"
        r="1"
        fill="currentColor"
        className="transition-transform delay-150 duration-300 ease-out group-hover:-translate-y-0.5"
      />
    </svg>
  )
}

export function PortfolioNavbar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { setIsChatOpen } = useChat()
  const { theme, setTheme } = useTheme()
  const { enabled, setEnabled } = useSoundPreference()
  const { language, setLanguage } = useLanguagePreference()
  const { t } = useTranslation()
  const playNavigation = useNavigationSound()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!settingsOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (target?.closest?.("[data-settings-trigger]")) return
      if (!settingsRef.current?.contains(target)) setSettingsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [settingsOpen])

  const handleLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    isActive: boolean
  ) => {
    setSettingsOpen(false)
    if (
      !isActive &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      playNavigation()
    }
  }

  const handleOpenChat = () => {
    playNavigation()
    setIsChatOpen(true)
  }

  const items = [
    {
      id: "home",
      label: t.nav.home,
      href: "/",
      icon: IconHome,
      type: "link" as const,
    },
    {
      id: "projects",
      label: t.nav.projects,
      href: "/projects",
      icon: IconProjects,
      type: "link" as const,
    },
    {
      id: "blog",
      label: t.nav.blog,
      href: "/blog",
      icon: IconBlog,
      type: "link" as const,
    },
    {
      id: "gallery",
      label: t.nav.gallery,
      href: "/gallery",
      icon: IconGallery,
      type: "link" as const,
    },
    {
      id: "chat",
      label: t.nav.chat,
      icon: IconChat,
      type: "action" as const,
      onClick: handleOpenChat,
      onPointerEnter: preloadChatPanel,
    },
    {
      id: "settings",
      label: t.nav.settings,
      type: "settings" as const,
    },
  ]

  const activeItemIndex = items.findIndex(
    (item) =>
      item.type === "link" &&
      (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
  )

  return (
    <nav
      className={cn(
        "relative sticky top-0 z-40 -mt-px border border-line bg-card/95 backdrop-blur-md max-md:border-x-0",
        className
      )}
      aria-label="Main Navigation"
    >
      <div className="relative grid h-full w-full grid-cols-6">
        {items.map((item) => {
          if (item.type === "link") {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                data-active={isActive || undefined}
                onClick={(event) => handleLinkClick(event, isActive)}
                className={cn(
                  "group relative flex h-full min-w-0 cursor-pointer items-center justify-center gap-1.5 px-2 text-xs font-medium transition-colors duration-200 select-none focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset sm:text-sm",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  active={isActive}
                  className="size-4 shrink-0 transition-colors duration-200 sm:size-4.5"
                />
                <span
                  className={cn(
                    "hidden max-w-24 overflow-hidden font-sans whitespace-nowrap transition-[opacity,max-width] duration-200 ease-out sm:block",
                    isActive ? "opacity-100" : "max-w-0 opacity-0"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          }

          if (item.type === "settings") {
            return (
              <div
                key={item.id}
                ref={settingsRef}
                className="relative flex h-full w-full items-center justify-center"
              >
                <CircleSettingsMenu
                  isOpen={settingsOpen}
                  onToggle={() => {
                    playNavigation()
                    setSettingsOpen((open) => !open)
                  }}
                  label={item.label}
                  theme={theme === "light" ? "light" : "dark"}
                  setTheme={setTheme}
                  language={language}
                  setLanguage={setLanguage}
                  soundEnabled={enabled}
                  setSoundEnabled={setEnabled}
                  t={t}
                  playNavigation={playNavigation}
                />
              </div>
            )
          }

          const ActionIcon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              onPointerEnter={item.onPointerEnter}
              title={item.label}
              aria-label={item.label}
              className="group relative flex h-full min-w-0 cursor-pointer items-center justify-center gap-1.5 px-2 text-xs font-medium text-muted-foreground transition-colors duration-200 select-none hover:text-foreground focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset sm:text-sm"
            >
              <ActionIcon className="size-4 shrink-0 transition-transform duration-300 ease-out sm:size-4.5" />
              <span className="hidden max-w-24 overflow-hidden font-sans whitespace-nowrap transition-[opacity,max-width] duration-200 ease-out sm:block opacity-0">
                {item.label}
              </span>
            </button>
          )
        })}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/6 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            opacity: activeItemIndex >= 0 ? 1 : 0,
            transform: `translate3d(${Math.max(activeItemIndex, 0) * 100}%, 0, 0)`,
          }}
        >
          <span
            className="absolute bottom-0 h-0.5 bg-foreground"
            style={{ insetInline: "min(1rem, 20%)" }}
          />
        </span>
      </div>
    </nav>
  )
}
