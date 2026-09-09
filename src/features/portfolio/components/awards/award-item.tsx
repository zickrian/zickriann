"use client"

import { format } from "date-fns"
import { Crown, Paperclip } from "lucide-react"

import {
  Collapsible,
  CollapsibleChevronsIcon,
} from "@/components/base/collapsible-animated"
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/base/ui/collapsible"
import { Markdown } from "@/components/markdown"
import { Separator } from "@/components/ui/separator"
import { Prose } from "@/components/ui/typography"
import type { Award } from "@/features/portfolio/types/awards"
import { useTranslation } from "@/lib/i18n/use-translation"
import { cn } from "@/lib/utils"

export function AwardItem({
  className,
  award,
}: {
  className?: string
  award: Award
}) {
  const { t, l } = useTranslation()
  const canExpand = !!award.description

  return (
    <Collapsible className={className} disabled={!canExpand}>
      <div className="group flex items-center transition-colors duration-200 ease-out hover:bg-accent-muted">
        <div className="flex w-15 shrink-0 items-center justify-center">
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-line ring-offset-1 ring-offset-background",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
            )}
          >
            <Crown />
          </div>
        </div>

        <div className="flex-1 border-l border-dashed border-line">
          <CollapsibleTrigger className="flex w-full items-center gap-2 p-4 pr-2 text-left">
            <div className="flex-1">
              <p className="mb-1 leading-snug font-medium text-balance">
                {award.title}
              </p>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <dl>
                  <dt className="sr-only">{t.awards.prize}</dt>
                  <dd>{award.prize}</dd>
                </dl>

                <Separator
                  className="data-vertical:h-4 data-vertical:self-center"
                  orientation="vertical"
                />

                <dl>
                  <dt className="sr-only">{t.awards.awardedIn}</dt>
                  <dd>
                    <time
                      suppressHydrationWarning
                      dateTime={new Date(award.date).toISOString()}
                    >
                      {format(new Date(award.date), "MM.yyyy")}
                    </time>
                  </dd>
                </dl>

                <Separator
                  className="data-vertical:h-4 data-vertical:self-center"
                  orientation="vertical"
                />

                <dl>
                  <dt className="sr-only">{t.awards.receivedInGrade}</dt>
                  <dd>{award.grade}</dd>
                </dl>
              </div>
            </div>

            {award.referenceLink && (
              <a
                className="relative flex size-6 shrink-0 items-center justify-center text-muted-foreground after:absolute after:-inset-2 hover:text-foreground [&_svg]:pointer-events-none [&_svg]:not([class*='size-'])]:size-4"
                href={award.referenceLink}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={t.awards.openReferenceAttachment}
                title={t.awards.openReferenceAttachment}
              >
                <Paperclip />
              </a>
            )}

            {canExpand && (
              <div className="shrink-0 text-muted-foreground [&_svg]:size-4">
                <CollapsibleChevronsIcon duration={0.15} />
              </div>
            )}
          </CollapsibleTrigger>
        </div>
      </div>

      {canExpand && (
        <CollapsibleContent className="overflow-hidden">
          <Prose className="border-t border-line p-4">
            <Markdown>{l(award.description ?? "", award.descriptionId)}</Markdown>
          </Prose>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
