"use client"

import { Pause, Play } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

/**
 * Autoplaying gallery clip with a real pause control.
 *
 * Two reasons this is not a plain `<video autoPlay loop>`:
 *
 * - WCAG 2.2.2: anything that moves for more than five seconds needs a way to
 *   stop it, and a looping clip never stops on its own.
 * - `prefers-reduced-motion` cannot be expressed through the `autoplay`
 *   attribute, so a visitor who asked the system for less motion was getting a
 *   permanently animating panel anyway. Here they get the poster frame and a
 *   play button, and it is their choice to start it.
 */
export function GalleryVideo({
  src,
  poster,
  title,
  className,
}: {
  src: string
  poster: string
  title: string
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const userPausedRef = useRef(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const activate = () => {
      if (video.getAttribute("src")) return
      video.src = src
      video.load()
      // Warm the media origin the instant the video is about to be fetched, so
      // the browser never hits a cold DNS/TLS round-trip at play time. Done on
      // demand rather than statically so a below-the-fold clip (mobile) never
      // trips Lighthouse's unused-preconnect audit.
      const host = new URL(src).hostname
      if (!document.querySelector(`link[data-video-preconnect="${host}"]`)) {
        const link = document.createElement("link")
        link.rel = "preconnect"
        link.href = `https://${host}`
        link.dataset.videoPreconnect = host
        document.head.appendChild(link)
      }
    }

    const play = () => {
      activate()
      video.play().catch(() => setPlaying(false))
    }

    if (!("IntersectionObserver" in window)) {
      if (!reducedMotion) play()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!reducedMotion && !userPausedRef.current) play()
        } else {
          video.pause()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [src])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      userPausedRef.current = false
      if (!video.getAttribute("src")) {
        video.src = src
        video.load()
      }
      video.play().catch(() => setPlaying(false))
    } else {
      userPausedRef.current = true
      video.pause()
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        poster={poster}
        className={className}
        aria-label={title}
        loop
        muted
        playsInline
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        // Always reachable by keyboard; only fades in for pointer users so the
        // image stays clean until intent is shown.
        className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur transition-opacity duration-200 group-hover/media:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {playing ? (
          <Pause size={16} weight="fill" aria-hidden />
        ) : (
          <Play size={16} weight="fill" aria-hidden />
        )}
      </button>
    </>
  )
}
