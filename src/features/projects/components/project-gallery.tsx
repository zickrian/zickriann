"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Image from "next/image"
import { useCallback, useState } from "react"

import { cn } from "@/lib/utils"

export function ProjectGallery({
  images,
  title,
}: {
  images: string[]
  title: string
}) {
  const [current, setCurrent] = useState(0)
  const len = images.length
  const isInitialImage = current === 0

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + len) % len)
  }, [len])

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % len)
  }, [len])

  return (
    <div className="relative">
      <div className="relative aspect-1200/630 overflow-hidden rounded-lg border border-line bg-card shadow-sm">
        <Image
          src={images[current]}
          alt={`${title} - ${current + 1}`}
          fill
          sizes="(min-width: 768px) 720px, 100vw"
          loading={isInitialImage ? "eager" : "lazy"}
          fetchPriority={isInitialImage ? "high" : "auto"}
          className="object-contain transition-opacity duration-300"
          quality={85}
        />
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute top-1/2 left-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-card"
        aria-label="Previous image"
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      <button
        onClick={next}
        className="absolute top-1/2 right-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-card"
        aria-label="Next image"
      >
        <ChevronRightIcon className="size-4" />
      </button>

      {/* Dots indicator */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              index === current
                ? "bg-foreground"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
