"use client"

import { ArrowUpRightIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Tag } from "@/components/ui/tag"
import type { Project } from "@/features/portfolio/types/projects"
import { useIntentPrefetch } from "@/hooks/use-intent-prefetch"
import { localize } from "@/lib/i18n/localize"
import { useTranslation } from "@/lib/i18n/use-translation"

export function ProjectCard({
  project,
  eager,
}: {
  project: Project
  eager?: boolean
}) {
  const { language } = useTranslation()
  const href = `/projects/${project.id}`
  const intentPrefetch = useIntentPrefetch(href)
  const coverSkills = project.coverSkills ?? project.skills.slice(0, 3)
  const tagline = localize(language, project.tagline, project.taglineId)

  const handleCardClick = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("projects_scroll_y", String(window.scrollY))
      sessionStorage.setItem("projects_from_detail", "true")
      sessionStorage.setItem("projects_last_id", project.id)
    }
  }

  return (
    <div
      id={`project-${project.id}`}
      className="group flex flex-col gap-2 bg-background p-3 transition-[background-color] duration-200 ease-out hover:bg-accent-muted"
    >
      <Link
        href={href}
        prefetch={false}
        scroll={false}
        {...intentPrefetch}
        onClick={handleCardClick}
        className="flex h-full flex-col gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        {/* Photo frame container (locked design) */}
        <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg border border-line bg-muted select-none">
          {/* Main Background: Sharp unblurred image.webp */}
          <Image
            src="/image.webp"
            alt=""
            fill
            sizes="(min-width: 640px) 550px, 100vw"
            className="pointer-events-none object-cover select-none"
            priority={eager}
          />

          {/* Standardized Floating Frame in the center */}
          <div className="relative z-10 flex aspect-[16/10] w-[86%] items-center justify-center overflow-hidden rounded-lg border border-black/20 bg-black/40 shadow-xl shadow-black/40 transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 dark:border-white/20">
            {/* Empty space / slip filler: Blurred project photo */}
            <Image
              src={project.image}
              alt=""
              fill
              sizes="(min-width: 640px) 480px, 90vw"
              className="pointer-events-none object-cover blur-md scale-110 opacity-75 brightness-90 select-none"
              priority={eager}
            />
            <div className="absolute inset-0 bg-black/15 pointer-events-none dark:bg-black/30" />

            {/* Main project photo: 100% visible, uncropped */}
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="(min-width: 640px) 480px, 90vw"
              className="relative z-10 object-contain drop-shadow-md"
              quality={85}
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : "auto"}
            />
          </div>
        </div>

        {/* Project details inside card (original design) */}
        <div className="flex flex-col gap-2 p-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg leading-snug font-medium text-balance">
              {project.title}
            </p>
            <ArrowUpRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>

          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {tagline}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <Tag>{project.year}</Tag>
            {coverSkills.map((skill) => (
              <Tag key={skill}>{skill}</Tag>
            ))}
          </div>
        </div>
      </Link>
    </div>
  )
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const isOdd = projects.length % 2 === 1

  return (
    <div className="grid grid-cols-1 gap-px border-b border-line bg-line sm:grid-cols-2">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} eager={index < 2} />
      ))}
      {isOdd && (
        <div className="hidden min-h-[300px] flex-col items-center justify-center bg-background p-6 select-none sm:flex">
          <span className="font-handwritten text-3xl font-medium tracking-wider text-muted-foreground">
            Still cooking
          </span>
        </div>
      )}
    </div>
  )
}
