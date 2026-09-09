"use client"

import Link from "next/link"

import { NotFoundVisual } from "@/components/not-found-visual"
import { useTranslation } from "@/lib/i18n/use-translation"
import { cn } from "@/lib/utils"

export function NotFound({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "relative flex h-svh min-h-screen w-full select-none items-center justify-center overflow-hidden bg-[#101010] text-[#f4f4f5]",
        className
      )}
    >
      {/* 1. Acoustic Ripple Lens SVG Background */}
      <NotFoundVisual />

      {/* 2. Narrative Content Layer */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-[6vw] z-10 flex flex-col items-center justify-center px-6 text-center max-md:bottom-12 max-sm:bottom-8">
        <div className="flex w-full max-w-[90vw] flex-col items-center sm:max-w-[480px] md:max-w-[540px]">
          {/* Editorial Narrative Message */}
          <div className="opacity-60 transition-opacity duration-200 hover:opacity-80">
            <p className="font-sans text-[14px] leading-relaxed tracking-[-0.01em] text-balance sm:text-[15px] sm:leading-[1.6] md:text-[17px] md:leading-[1.65]">
              {t.notFound.message}{" "}
              <Link
                href="/"
                className="text-white underline underline-offset-3 decoration-white/40 transition-colors hover:decoration-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
              >
                {t.notFound.home}
              </Link>{" "}
              {t.notFound.suffix}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
