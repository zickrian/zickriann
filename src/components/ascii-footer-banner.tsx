"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { useTranslation } from "@/lib/i18n/use-translation"

export interface AsciiFooterBannerProps {
  className?: string
}

export function AsciiFooterBanner({ className = "" }: AsciiFooterBannerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const { l } = useTranslation()

  useEffect(() => {
    const container = containerRef.current
    const video = videoRef.current
    if (!container || !video) return

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (reducedMotion) return

    let isIntersecting = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry?.isIntersecting ?? false
        if (isIntersecting && !document.hidden) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.05, rootMargin: "400px 0px" }
    )

    observer.observe(container)

    const handleVisibility = () => {
      if (document.hidden) {
        video.pause()
      } else if (isIntersecting) {
        video.play().catch(() => {})
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Footer ASCII landscape banner"
      className={`relative min-h-[195px] w-full overflow-hidden border-b border-line bg-card sm:min-h-[250px] select-none ${className}`}
    >
      {/* 1. Poster fallback below the fold */}
      <Image
        src="/ascii-footer-poster.webp"
        alt=""
        fill
        loading="lazy"
        fetchPriority="low"
        sizes="(min-width: 768px) 720px, 100vw"
        className="object-cover object-bottom"
      />

      {/* 2. Looped Video */}
      {/* No `autoPlay`: it defeated `preload="none"` and pulled the 676 KB clip
          during initial load even though the banner sits below the fold. The
          observer below starts it when it actually scrolls into view. */}
      <video
        ref={videoRef}
        src="/ascii-footer.webm"
        loop
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        onPlaying={() => setIsPlaying(true)}
        className={`absolute inset-0 size-full object-cover object-bottom transition-opacity duration-500 ${
          isPlaying ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 3. Subtle Inset Black Shadow Frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-5 shadow-[inset_0_0_24px_rgba(0,0,0,0.45),inset_0_1px_3px_rgba(0,0,0,0.3),inset_0_-1px_3px_rgba(0,0,0,0.3)]"
      />

      {/* 4. Editorial Content - Perfectly centered vertically (50% / 50%) */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-5 sm:px-8">
        <div className="max-w-lg sm:max-w-xl">
          {/* Headline */}
          <h2 className="text-lg font-bold tracking-tight text-white leading-snug sm:text-2xl sm:leading-tight sm:whitespace-nowrap">
            {l(
              "Building the future with data, AI, and code.",
              "Membangun masa depan dengan data, AI, dan kode."
            )}
          </h2>

          {/* Description */}
          <p className="mt-1.5 text-xs leading-relaxed text-white/85 sm:mt-2 sm:text-sm max-w-sm sm:max-w-lg">
            {l(
              "Exploring practical machine learning systems, data products, and full-stack software.",
              "Mengeksplorasi sistem machine learning praktis, produk data, dan perangkat lunak full-stack."
            )}
          </p>

          {/* CTA Button */}
          <div className="mt-3.5 sm:mt-4.5">
            <a
              href="https://wa.me/6285155487647"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-[min(var(--radius-lg),10px)] bg-white px-3.5 text-sm font-medium text-zinc-950 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>{l("Get in touch", "Hubungi Saya")}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
