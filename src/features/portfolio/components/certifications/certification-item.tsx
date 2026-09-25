"use client"

import { format } from "date-fns"
import { ArrowUpRightIcon, CircleCheckBigIcon } from "lucide-react"
import Image from "next/image"

import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/lib/i18n/use-translation"
import { cn } from "@/lib/utils"

import type { Certification } from "../../types/certifications"

export function CertificationItem({
  className,
  certification,
}: {
  className?: string
  certification: Certification
}) {
  const { t } = useTranslation()
  const shouldFillLogo = certification.issuer === "Dicoding Indonesia"

  return (
    <a
      className={cn(
        "group flex items-center pr-2 transition-colors duration-200 ease-out hover:bg-accent-muted",
        className
      )}
      href={certification.credentialURL}
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      <div className="flex w-15 shrink-0 items-center justify-center">
        {certification.issuerLogoURL ? (
          <span
            className={cn(
              "flex size-7 items-center justify-center overflow-hidden rounded-md border border-border select-none",
              shouldFillLogo ? "bg-transparent p-0" : "bg-white p-0.5"
            )}
          >
            <Image
              src={certification.issuerLogoURL}
              alt={certification.issuer}
              width={28}
              height={28}
              quality={85}
              className={cn(
                "size-full",
                shouldFillLogo ? "object-cover" : "object-contain"
              )}
              aria-hidden
            />
          </span>
        ) : (
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-lg select-none",
              "border border-muted-foreground/15 ring-1 ring-line ring-offset-1 ring-offset-background",
              "bg-muted text-muted-foreground [&_svg]:size-4"
            )}
          >
            <CircleCheckBigIcon />
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1 border-l border-dashed border-line p-4 pr-2">
        <p className="leading-snug font-medium text-balance">
          {certification.title}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <dl>
            <dt className="sr-only">{t.certifications.issuedBy}</dt>
            <dd>
              <span aria-hidden>@</span>
              <span className="ml-0.5">{certification.issuer}</span>
            </dd>
          </dl>

          <Separator
            className="data-vertical:h-4 data-vertical:self-center"
            orientation="vertical"
          />

          <dl>
            <dt className="sr-only">{t.certifications.issuedOn}</dt>
            <dd>
              <time
                suppressHydrationWarning
                dateTime={new Date(certification.issueDate).toISOString()}
              >
                {format(new Date(certification.issueDate), "dd.MM.yyyy")}
              </time>
            </dd>
          </dl>
        </div>
      </div>

      {certification.credentialURL && (
        <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground transition-[transform,color] duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0" />
      )}
    </a>
  )
}
