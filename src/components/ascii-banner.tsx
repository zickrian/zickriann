"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

export interface AsciiBannerProps {
  src?: string
  alt?: string
  className?: string
  cellWidth?: number
  cellHeight?: number
  speed?: number
  scanlines?: boolean
}

// Matrix glyph set strictly mapped by luminance and digital stream tokens
const GLYPH_CHARS = [
  "·",
  ":",
  "0",
  "1",
  "3",
  "5",
  "8",
  "9",
  "X",
  "B",
  "#",
  "0x",
  "88",
  "00",
  "8888",
]

export function AsciiBanner({
  src = "/bannerfield.webp",
  alt = "Profile Banner",
  className = "",
  cellWidth = 7,
  cellHeight = 10,
  speed = 0.4,
  scanlines = true,
}: AsciiBannerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const img = new window.Image()
    img.src = src

    let isDestroyed = false
    let animFrameId = 0
    let lastTime = performance.now()
    let totalTime = 0
    let isIntersecting = true

    let cols = 0
    let rows = 0
    let width = 0
    let height = 0
    let dpr = 1
    let sampledPixels: Uint8ClampedArray | null = null

    const sampleCanvas = document.createElement("canvas")
    const sampleCtx = sampleCanvas.getContext("2d", {
      willReadFrequently: true,
    })

    const sampleImage = () => {
      if (!sampleCtx || cols <= 0 || rows <= 0 || !img.naturalWidth) return
      try {
        sampleCanvas.width = cols
        sampleCanvas.height = rows

        const imgAspect = img.naturalWidth / img.naturalHeight
        const canvasAspect = (width || 720) / (height || 224)

        let drawW = cols
        let drawH = rows
        let drawX = 0
        let drawY = 0

        if (imgAspect > canvasAspect) {
          drawW = rows * imgAspect
          drawX = -(drawW - cols) / 2
        } else {
          drawH = cols / imgAspect
          drawY = -(drawH - rows) * 0.4
        }

        sampleCtx.clearRect(0, 0, cols, rows)
        sampleCtx.drawImage(img, drawX, drawY, drawW, drawH)
        sampledPixels = sampleCtx.getImageData(0, 0, cols, rows).data
        setReady(true)
      } catch {
        sampledPixels = null
      }
    }

    const resize = () => {
      if (!container || !canvas) return
      width = container.clientWidth || 720
      height = container.clientHeight || 224
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      cols = Math.ceil(width / cellWidth)
      rows = Math.ceil(height / cellHeight)

      if (img.complete && img.naturalWidth > 0) {
        sampleImage()
      }
    }

    const renderFrame = (timestamp: number) => {
      if (!ctx || !sampledPixels || cols <= 0 || rows <= 0) return

      const delta = Math.min(timestamp - lastTime, 50) / 1000
      lastTime = timestamp
      totalTime += delta * speed

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      // Strict aligned monospace rendering
      ctx.font = `600 7.5px "GeistMono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
      ctx.textBaseline = "middle"
      ctx.textAlign = "center"

      const t = totalTime
      const len = sampledPixels.length

      for (let r = 0; r < rows; r++) {
        const posY = Math.round(r * cellHeight + cellHeight / 2)

        for (let c = 0; c < cols; c++) {
          const idx = (r * cols + c) * 4
          if (idx + 3 >= len) continue

          const red = sampledPixels[idx] ?? 0
          const green = sampledPixels[idx + 1] ?? 0
          const blue = sampledPixels[idx + 2] ?? 0
          const alpha = sampledPixels[idx + 3] ?? 0

          if (alpha === 0) continue

          const lum = 0.299 * red + 0.587 * green + 0.114 * blue

          // Only illuminate the light beam, leaving mountains & shadows completely crisp
          if (lum < 100) continue

          // Harmonized stream animation across rows
          const wave =
            Math.sin(c * 0.12 + t * 1.5) * 1.5 +
            Math.cos(r * 0.25 - t * 1.2) * 1.5

          const normLum = Math.min(1, Math.max(0, (lum - 100) / 155))
          const maxGlyphIndex = Math.min(
            GLYPH_CHARS.length - 1,
            Math.floor(normLum * GLYPH_CHARS.length)
          )

          const charIndex =
            Math.abs(Math.floor(c * 3 + r * 7 + wave + t * 4)) %
            (maxGlyphIndex + 1)
          const glyph = GLYPH_CHARS[charIndex] ?? "0"

          const posX = Math.round(c * cellWidth + cellWidth / 2)

          // Zone color intelligence (cyan in sky, white in core, gold in meadow)
          const isGolden = red > 120 && green > 110 && blue < 155
          const isCyan = blue > red + 10
          const boost = Math.min(1.25, lum / 160 + 0.2)

          const charR = Math.min(
            255,
            Math.floor(red * boost + (isGolden ? 30 : isCyan ? 0 : 20))
          )
          const charG = Math.min(
            255,
            Math.floor(green * boost + (isGolden ? 25 : isCyan ? 25 : 20))
          )
          const charB = Math.min(
            255,
            Math.floor(blue * boost + (isGolden ? 0 : isCyan ? 35 : 20))
          )

          const charAlpha = Math.min(0.85, normLum * 0.6 + 0.2)

          ctx.fillStyle = `rgba(${charR}, ${charG}, ${charB}, ${charAlpha})`
          ctx.fillText(glyph, posX, posY)
        }
      }

      ctx.restore()
    }

    const loop = (timestamp: number) => {
      animFrameId = 0
      if (!isIntersecting || document.hidden) return

      renderFrame(timestamp)
      animFrameId = requestAnimationFrame(loop)
    }

    const start = () => {
      if (!animFrameId && isIntersecting && !document.hidden && !reducedMotion) {
        lastTime = performance.now()
        animFrameId = requestAnimationFrame(loop)
      }
    }

    const stop = () => {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId)
        animFrameId = 0
      }
    }

    const handleImgLoad = () => {
      if (isDestroyed) return
      resize()
      sampleImage()
      if (reducedMotion) {
        renderFrame(0)
      } else {
        start()
      }
    }

    img.onload = handleImgLoad
    if (img.complete && img.naturalWidth > 0) {
      handleImgLoad()
    }

    resize()

    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (reducedMotion) renderFrame(performance.now())
    })
    resizeObserver.observe(container)

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersecting = entry?.isIntersecting ?? false
      if (isIntersecting) start()
      else stop()
    })
    intersectionObserver.observe(container)

    const handleVisibility = () => {
      if (document.hidden) stop()
      else start()
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      isDestroyed = true
      stop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [src, cellWidth, cellHeight, speed])

  return (
    <div
      ref={containerRef}
      className={`relative size-full overflow-hidden bg-black select-none ${className}`}
    >
      {/* 1. Underlying crystal clear Next.js image */}
      <Image
        src={src}
        alt={alt}
        fill
        priority
        loading="eager"
        fetchPriority="high"
        sizes="(min-width: 768px) 720px, 100vw"
        className="object-cover object-[center_40%]"
      />

      {/* 2. Structured Matrix Scanline ASCII Layer */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 size-full transition-opacity duration-300 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 3. Subtle CRT Scanlines */}
      {scanlines && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.35)_51%)] bg-[length:100%_3px] opacity-30 mix-blend-overlay"
        />
      )}
    </div>
  )
}
