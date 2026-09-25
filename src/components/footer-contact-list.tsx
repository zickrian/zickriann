"use client"

import { ArrowUpRightIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import type * as HoverCardComponents from "@/components/ui/hover-card"
import type { GitHubSocialCard } from "@/features/portfolio/data/github-social"
import { SOCIAL_LINKS } from "@/features/portfolio/data/social-links"
import { USER } from "@/features/portfolio/data/user"
import type { SocialLink } from "@/features/portfolio/types/social-links"

/**
 * The footer's CONTACT column, after cali.so's social cards.
 *
 * Every network gets its own card rather than one template wearing different
 * logos: GitHub is its calendar, LinkedIn a business card, Discord its profile
 * popout, Medium an editorial standfirst, Hugging Face a model-card header, and
 * email an actual airmail envelope.
 *
 * Deliberately a client component that renders its own list and triggers. The
 * alternative - a server component handing `<a>` elements to
 * `HoverCardTrigger asChild` - puts an element across the RSC boundary into a
 * Radix `Slot`, which React may stream as a lazy reference and `Slot` rejects.
 *
 * Figures appear only where the network publishes them without an authenticated
 * app, which today means GitHub alone. Nothing is invented to fill space.
 */

const BLOCK = 10
const GAP = 2
const ROWS = 7

/**
 * Radix's hover-card primitive is dead weight in the initial bundle: it draws a
 * preview that only ever appears on hover, in a footer that starts several
 * screens below the fold. It is fetched when the column scrolls within a
 * screen of the viewport, which is always well before a pointer can reach a
 * link - waiting for the hover itself would have missed the first one, since
 * `pointerenter` has already fired by the time the trigger exists. Pointer,
 * touch and focus stay as a fallback for anyone who lands mid-footer. Until it
 * arrives the links are plain anchors and fully working.
 */
type HoverCardModule = typeof HoverCardComponents

let hoverCardPromise: Promise<HoverCardModule> | undefined

function loadHoverCard() {
  return (hoverCardPromise ??= import("@/components/ui/hover-card"))
}

export function FooterContactList({
  github,
}: {
  github: GitHubSocialCard | null
}) {
  const [hoverCard, setHoverCard] = useState<HoverCardModule | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const enhance = () => {
    loadHoverCard()
      .then(setHoverCard)
      .catch(() => {
        hoverCardPromise = undefined
      })
  }

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        enhance()
      },
      { rootMargin: "600px 0px" }
    )
    observer.observe(list)

    return () => observer.disconnect()
  }, [])

  return (
    <ul
      ref={listRef}
      onPointerEnter={enhance}
      onTouchStart={enhance}
      onFocusCapture={enhance}
    >
      {SOCIAL_LINKS.map((link) => (
        <li key={link.href}>
          <SocialCard
            link={link}
            github={link.title === "GitHub" ? github : null}
            hoverCard={hoverCard}
          />
        </li>
      ))}
    </ul>
  )
}

function SocialCard({
  link,
  github,
  hoverCard,
}: {
  link: SocialLink
  github: GitHubSocialCard | null
  hoverCard: HoverCardModule | null
}) {
  const external = link.href.startsWith("http")
  const isEmail = link.href.startsWith("mailto:")

  const anchor = (
    <a
      href={link.href}
      className="inline-flex w-fit items-center gap-1 transition-[color] hover:text-foreground"
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {link.title}
      {external && (
        <ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0 opacity-60" />
      )}
    </a>
  )

  if (!hoverCard) return anchor

  const { HoverCard, HoverCardContent, HoverCardTrigger } = hoverCard

  return (
    <HoverCard openDelay={120} closeDelay={100}>
      <HoverCardTrigger asChild>{anchor}</HoverCardTrigger>

      <HoverCardContent
        side="top"
        align="start"
        // A preview, never a hit target - the link underneath it is.
        className={
          isEmail
            ? "w-72 overflow-hidden rounded-[5px] p-0 select-none"
            : "w-72 overflow-hidden select-none"
        }
      >
        <CardBody link={link} github={github} />
      </HoverCardContent>
    </HoverCard>
  )
}

function CardBody({
  link,
  github,
}: {
  link: SocialLink
  github: GitHubSocialCard | null
}) {
  switch (link.title) {
    case "Email":
      return <EnvelopeCard address={link.href.slice("mailto:".length)} />
    case "GitHub":
      return <GitHubCard data={github} icon={link.icon} />
    case "LinkedIn":
      return <LinkedInCard icon={link.icon} />
    case "Discord":
      return <DiscordCard handle={handleFor(link)} icon={link.icon} />
    case "Medium":
      return <MediumCard handle={handleFor(link)} icon={link.icon} />
    default:
      return <HuggingFaceCard handle={handleFor(link)} icon={link.icon} />
  }
}

/** GitHub is its contribution calendar - no avatar, no bio, just the record. */
function GitHubCard({
  data,
  icon,
}: {
  data: GitHubSocialCard | null
  icon: React.ReactNode
}) {
  if (!data) return <PlainCard handle="@zickrian" icon={icon} />

  const width = data.weeks * (BLOCK + GAP) - GAP
  const height = ROWS * (BLOCK + GAP) - GAP

  return (
    <div className="flex flex-col gap-2.5 overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full origin-left animate-chart-sweep"
        role="img"
        aria-label={`${data.levels.length} most recent days of contribution activity`}
      >
        {data.levels.map((level, index) => (
          <rect
            key={index}
            className="contribution-level"
            data-level={level}
            x={Math.floor(index / ROWS) * (BLOCK + GAP)}
            y={(index % ROWS) * (BLOCK + GAP)}
            width={BLOCK}
            height={BLOCK}
            rx="1"
          />
        ))}
      </svg>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-2.5 font-mono text-[0.6875rem] tracking-[0.02em] text-muted-foreground tabular-nums animate-card-content">
        <span>
          <b className="font-medium text-foreground">
            {data.contributions.toLocaleString("en-US")}
          </b>{" "}
          contributions
          {data.followers !== null && (
            <>
              {" · "}
              <b className="font-medium text-foreground">
                {data.followers.toLocaleString("en-US")}
              </b>{" "}
              followers
            </>
          )}
        </span>
        <Glyph icon={icon} />
      </div>
    </div>
  )
}

/**
 * Kicker shared by every card, so the set reads as one family: the same mono
 * micro-label this site already uses for `CONTACT` and `INDEX`.
 */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.625rem] tracking-[0.18em] text-muted-foreground uppercase">
      {children}
    </span>
  )
}

/**
 * LinkedIn is a business card: a ruled slip of professional facts.
 * Its blue survives only as a 2px spine at 55% - enough to place the platform,
 * not enough to become the loudest thing in a monochrome footer.
 */
function LinkedInCard({ icon }: { icon: React.ReactNode }) {
  const job = USER.jobs[0]

  return (
    <div className="flex gap-3 border-l-2 border-(--brand) pl-3 [--brand:color-mix(in_oklab,#0a66c2_55%,transparent)] animate-card-content">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Kicker>Profile</Kicker>
        <span className="text-sm font-medium text-foreground">
          {USER.displayName}
        </span>
        <span className="text-xs text-muted-foreground">{USER.jobTitle}</span>
        {job && (
          <span className="border-t border-line pt-1.5 text-xs text-foreground">
            {job.title}
            <span className="text-muted-foreground"> · {job.company}</span>
          </span>
        )}
        <span className="font-mono text-[0.6875rem] text-muted-foreground">
          {USER.address}
        </span>
      </div>
      <Glyph icon={icon} className="self-start" />
    </div>
  )
}

/**
 * Discord keeps the shape of its profile popout - banner, overlapping avatar,
 * presence dot - but the banner is a hairline-ruled tint of the page rather
 * than a slab of blurple, and the dot uses this site's own `--success`.
 */
function DiscordCard({
  handle,
  icon,
}: {
  handle: string
  icon: React.ReactNode
}) {
  return (
    <div className="-m-2.5 animate-card-content">
      <div className="h-11 border-b border-line bg-muted/40" />
      <div className="px-3 pb-3">
        <div className="-mt-5 mb-2 flex items-end justify-between">
          <span className="relative animate-stamp-pop">
            <Image
              src={USER.avatar}
              alt=""
              width={44}
              height={44}
              className="size-11 rounded-full border-[3px] border-popover object-cover"
            />
            {/* Decorative: this is a shape cue, not a live presence. */}
            <span
              aria-hidden
              className="absolute right-0 bottom-0 size-3 rounded-full border-[3px] border-popover bg-success"
            />
          </span>
          <Glyph icon={icon} />
        </div>
        <p className="text-sm font-medium text-foreground">
          {USER.displayName}
        </p>
        <p className="font-mono text-xs text-muted-foreground">{handle}</p>
      </div>
    </div>
  )
}

/** Medium is editorial: a rule, a standfirst, a byline. Already monochrome. */
function MediumCard({
  handle,
  icon,
}: {
  handle: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 animate-card-content">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <Kicker>Writing</Kicker>
        <Glyph icon={icon} />
      </div>
      <p className="text-sm/relaxed text-pretty text-foreground italic">
        “{USER.seoDescription}”
      </p>
      <span className="font-mono text-[0.6875rem] tracking-[0.02em] text-muted-foreground">
        {handle}
      </span>
    </div>
  )
}

/**
 * Hugging Face is a model card: a mono header strip over a spec line. The strip
 * is the page's own muted surface; the yellow is left to the glyph alone.
 */
function HuggingFaceCard({
  handle,
  icon,
}: {
  handle: string
  icon: React.ReactNode
}) {
  return (
    <div className="-m-2.5 overflow-hidden animate-card-content">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-muted/40 px-3 py-2">
        <span className="font-mono text-xs tracking-[0.02em] text-foreground">
          {handle}
        </span>
        <Glyph icon={icon} />
      </div>
      <div className="flex flex-col gap-1 px-3 py-2.5">
        <Kicker>Models · Datasets · Spaces</Kicker>
        <span className="text-sm text-foreground">{USER.displayName}</span>
      </div>
    </div>
  )
}

/** Fallback when a card's data source is unavailable. */
function PlainCard({
  handle,
  icon,
}: {
  handle: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 animate-card-content">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-foreground">
          {USER.displayName}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {handle}
        </span>
      </div>
      <Glyph icon={icon} />
    </div>
  )
}

function Glyph({
  icon,
  className,
}: {
  icon: React.ReactNode
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={`shrink-0 text-muted-foreground [&_svg]:size-5 ${className ?? ""}`}
    >
      {icon}
    </span>
  )
}

/** A posted letter, drawn in CSS: airmail edge, franked stamps, the address. */
function EnvelopeCard({ address }: { address: string }) {
  return (
    <span className="email-envelope animate-card-content" aria-hidden>
      <span className="envelope-flap" />

      <span className="envelope-return">
        <span>FROM</span>
        {USER.displayName.toUpperCase()}
        <br />
        {USER.address.toUpperCase()}
      </span>

      <span className="envelope-stamps">
        <span className="envelope-stamp envelope-stamp-portrait animate-stamp-pop">
          <Image src={USER.avatar} alt="" width={32} height={32} />
          <span>{USER.username.toUpperCase()} · 26</span>
        </span>
        <span className="envelope-stamp envelope-stamp-mark animate-stamp-pop">
          <span className="envelope-star">
            <svg
              viewBox="0 0 24 24"
              className="size-3.5 fill-current"
              aria-hidden
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>
          </span>
          <span>POST · 26</span>
        </span>
      </span>

      <span className="envelope-postmark animate-stamp-pop" data-mark="26 JUL" />

      <span className="envelope-address">
        <span>TO</span>
        {address}
      </span>
    </span>
  )
}

/** "https://github.com/zickrian" → "@zickrian"; falls back to the host. */
function handleFor(link: SocialLink) {
  try {
    const url = new URL(link.href)
    const segment = url.pathname.split("/").filter(Boolean).pop()
    return segment ? `@${segment.replace(/^@/, "")}` : url.host
  } catch {
    return link.title
  }
}
