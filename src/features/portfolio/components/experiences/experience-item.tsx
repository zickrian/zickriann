import Image from "next/image"

import { UTM_PARAMS } from "@/config/site"
import { addQueryParams } from "@/utils/url"

import type { Experience } from "../../types/experiences"
import { ExperiencePositionItem } from "./experience-position-item"

export function ExperienceItem({ experience }: { experience: Experience }) {
  return (
    <div
      id={`experience-${experience.id}`}
      className="scroll-mt-14 space-y-4 border-b border-line px-4 py-4 last:border-b-0"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-6 shrink-0 items-center justify-center select-none">
          {experience.companyLogo ? (
            <Image
              src={experience.companyLogo}
              alt={`${experience.companyName} logo`}
              width={24}
              height={24}
              quality={85}
              className={`rounded-full ${experience.companyLogo.endsWith(".svg") ? "" : "dark:bg-white dark:p-0.5"}`}
              aria-hidden
            />
          ) : (
            <span className="flex size-2 rounded-full bg-muted-foreground/40" />
          )}
        </div>

        <h3 className="text-lg leading-snug font-semibold">
          {experience.companyWebsite ? (
            <a
              className="link"
              href={addQueryParams(experience.companyWebsite, UTM_PARAMS)}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              {experience.companyName}
            </a>
          ) : (
            experience.companyName
          )}
        </h3>
      </div>

      <div className="relative space-y-4 before:absolute before:left-3 before:h-full before:w-px before:bg-border">
        {experience.positions.map((position) => (
          <ExperiencePositionItem key={position.id} position={position} />
        ))}
      </div>
    </div>
  )
}
