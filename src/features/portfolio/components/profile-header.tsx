"use client"

import { BriefcaseBusiness, Globe2, MapPin } from "lucide-react"
import Image from "next/image"

import { AsciiBanner } from "@/components/ascii-banner"
import { GitHubStars } from "@/components/github-stars"
import { VerifiedIcon } from "@/features/portfolio/components/verified-icon"
import type { GitHubRepoStats } from "@/features/portfolio/data/github-repo"
import { SOCIAL_LINKS } from "@/features/portfolio/data/social-links"
import { USER } from "@/features/portfolio/data/user"
import { useTranslation } from "@/lib/i18n/use-translation"

export function ProfileHeader({
  repoStats,
}: {
  repoStats?: GitHubRepoStats | null
}) {
  const { l } = useTranslation()

  return (
    <header
      id="about"
      className="relative z-1 border-x border-b border-line bg-card max-md:border-x-0"
    >
      <div className="relative h-44 overflow-hidden border-b border-line sm:h-56">
        <AsciiBanner src="/bannerfield.webp" alt="Profile Banner" />
      </div>

      <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="flex items-end justify-between gap-3">
          <div className="relative -mt-13 size-26 overflow-hidden rounded-[15%] border-4 border-card bg-card sm:-mt-16 sm:size-32 sm:rounded-[16%]">
            <Image
              src={USER.avatar}
              alt={`Portrait of ${USER.displayName}`}
              fill
              priority
              sizes="(min-width: 640px) 128px, 104px"
              className="size-full object-cover object-[center_28%]"
            />
          </div>

          <GitHubStars
            stargazersCount={repoStats?.stars ?? 0}
            className="mb-1"
          />
        </div>

        <div className="mt-3 min-w-0">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <h1 className="text-[20px] font-bold leading-6 tracking-tight text-foreground sm:text-[22px]">
              {USER.displayName}
            </h1>
            <div className="inline-flex items-center gap-1 sm:gap-1.5">
              <VerifiedIcon
                className="size-5 shrink-0 sm:size-[22px]"
                aria-label="Verified profile"
                role="img"
              />
              <a
                href="https://www.instagram.com/custompedia/"
                target="_blank"
                rel="noopener noreferrer"
                title="PT Custompedia Creative Group"
                aria-label="PT Custompedia Creative Group"
                className="relative inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-[#cfd9de] bg-white p-[2px] shadow-2xs transition-transform hover:scale-105 dark:border-[#536471] sm:size-[22px] sm:rounded-[4.5px]"
              >
                {/* Same quality as the experience list renders it at, so both
                    resolve to one optimised variant instead of fetching the
                    identical 32px logo twice per page load. */}
                <Image
                  src="/logos/custompedia-logo.webp"
                  alt="Custompedia"
                  width={22}
                  height={22}
                  quality={85}
                  className="size-full object-contain"
                />
              </a>
            </div>
          </div>
          <p className="mt-0.5 text-[15px] leading-5 text-muted-foreground">
            @{USER.username}
          </p>
        </div>

        <p className="mt-3.5 max-w-2xl text-[15px] leading-relaxed text-foreground sm:text-base">
          {l(USER.about, USER.aboutId)}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BriefcaseBusiness className="size-4" aria-hidden />
            {USER.jobTitle}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {USER.address}
          </span>
          <a
            href={USER.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Globe2 className="size-4" aria-hidden />
            zickrian.dev
          </a>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <h2 className="sr-only">Social links</h2>
          <ul className="flex flex-wrap gap-2">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.title}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={link.title}
                  title={link.title}
                  className="flex size-10 items-center justify-center rounded-lg border border-line bg-card text-muted-foreground transition-[background-color,color,border-color,transform] hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
                >
                  <span className="size-[18px] [&>svg]:size-full">
                    {link.icon}
                  </span>
                  <span className="sr-only">{link.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  )
}
