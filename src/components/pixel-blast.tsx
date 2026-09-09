"use client"

import { useTheme } from "next-themes"
import { useEffect, useRef } from "react"

export interface PixelBlastProps {
  className?: string
  color?: string
  pixelSize?: number
  patternScale?: number
  patternDensity?: number
  speed?: number
  opacity?: number
  onReady?: () => void
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

uniform vec2 uResolution;
uniform vec3 uColor;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uOpacity;
uniform float uDotSize;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy / uPixelSize);
  vec2 cellUv = fract(gl_FragCoord.xy / uPixelSize);
  vec2 uv = cell * uPixelSize / uResolution;

  float field = noise(uv * uScale * 10.0 + vec2(uTime * 0.06, -uTime * 0.04));
  float density = smoothstep(0.34, 0.72, field) * uDensity;
  float visible = step(1.0 - density, hash(cell));
  float dot = step(max(abs(cellUv.x - 0.5), abs(cellUv.y - 0.5)), uDotSize);
  float edge = smoothstep(0.0, 0.12, min(min(uv.x, uv.y), min(1.0 - uv.x, 1.0 - uv.y)));

  gl_FragColor = vec4(uColor, visible * dot * edge * uOpacity);
}
`

function parseHexOrCssColor(colorStr: string): [number, number, number] {
  const trimmed = colorStr.trim()
  if (trimmed.startsWith("#")) {
    let hex = trimmed.slice(1)
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("")
    }
    if (hex.length >= 6) {
      const num = parseInt(hex.slice(0, 6), 16)
      return [
        ((num >> 16) & 255) / 255,
        ((num >> 8) & 255) / 255,
        (num & 255) / 255,
      ]
    }
  }
  return [0.63, 0.63, 0.67]
}

export function PixelBlast({
  className = "",
  color,
  pixelSize = 7,
  patternScale = 2,
  patternDensity = 0.78,
  speed = 0.35,
  opacity,
  onReady,
}: PixelBlastProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const gl =
      (canvas.getContext("webgl2", {
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      }) as WebGL2RenderingContext | null) ||
      (canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      }) as WebGLRenderingContext | null)

    if (!gl) return

    const compileShader = (type: number, src: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
    if (!vertShader || !fragShader) return

    const program = gl.createProgram()
    if (!program) return

    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return
    }

    gl.useProgram(program)

    // Full-screen quad positions (two triangles covering clip space)
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ])
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const posAttr = gl.getAttribLocation(program, "position")
    gl.enableVertexAttribArray(posAttr)
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)

    const uResolutionLoc = gl.getUniformLocation(program, "uResolution")
    const uColorLoc = gl.getUniformLocation(program, "uColor")
    const uTimeLoc = gl.getUniformLocation(program, "uTime")
    const uPixelSizeLoc = gl.getUniformLocation(program, "uPixelSize")
    const uScaleLoc = gl.getUniformLocation(program, "uScale")
    const uDensityLoc = gl.getUniformLocation(program, "uDensity")
    const uOpacityLoc = gl.getUniformLocation(program, "uOpacity")
    const uDotSizeLoc = gl.getUniformLocation(program, "uDotSize")

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const dpr = Math.min(window.devicePixelRatio || 1, 1.25)

    const getIsDark = () => {
      if (resolvedTheme === "dark") return true
      if (resolvedTheme === "light") return false
      return document.documentElement.classList.contains("dark")
    }

    const getColorRgb = (): [number, number, number] => {
      if (color) return parseHexOrCssColor(color)
      const isDark = getIsDark()
      // Dark mode: cool light cyan-gray
      // Light mode: rich charcoal-slate with strong contrast
      return isDark ? [0.65, 0.65, 0.7] : [0.12, 0.15, 0.2]
    }

    const getOpacity = (): number => {
      if (opacity !== undefined) return opacity
      const isDark = getIsDark()
      // Keep the light-mode gutter pattern readable against the pale surface.
      return isDark ? 0.38 : 0.72
    }

    const getDotSize = (): number => {
      const isDark = getIsDark()
      // In light mode, provide a slightly crisper, larger dot shape
      return isDark ? 0.17 : 0.22
    }

    // These three only change when the theme does, and a MutationObserver below
    // already watches for exactly that. Reading `classList` from inside the
    // frame loop meant three DOM reads every frame, forever.
    let colorRgb = getColorRgb()
    let currentOpacity = getOpacity()
    let currentDotSize = getDotSize()

    const refreshThemeUniforms = () => {
      colorRgb = getColorRgb()
      currentOpacity = getOpacity()
      currentDotSize = getDotSize()
    }

    const FRAME_DURATION = 1000 / 30
    const VSYNC_BUDGET_MS = 6

    let isIntersecting = true
    let isTransitioning = false
    let animFrameId = 0
    let frameTimerId = 0
    let nextFrameAt = 0
    let lastTimestamp = 0
    let accumulatedTime = 0
    let isPageLoaded =
      typeof document !== "undefined" && document.readyState === "complete"

    const isMobileScreen = () => window.innerWidth < 640

    const render = (time?: number) => {
      if (
        !isIntersecting ||
        isTransitioning ||
        document.hidden ||
        document.documentElement.hasAttribute("data-modal-open") ||
        isMobileScreen()
      ) {
        return
      }

      if (time !== undefined) {
        if (lastTimestamp) {
          accumulatedTime += Math.min(time - lastTimestamp, 50) / 1000
        }
        lastTimestamp = time
      }

      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      const [r, g, b] = colorRgb

      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height)
      gl.uniform3f(uColorLoc, r, g, b)
      gl.uniform1f(uTimeLoc, accumulatedTime * speed)
      gl.uniform1f(uPixelSizeLoc, pixelSize)
      gl.uniform1f(uScaleLoc, patternScale)
      gl.uniform1f(uDensityLoc, patternDensity)
      gl.uniform1f(uOpacityLoc, currentOpacity)
      gl.uniform1f(uDotSizeLoc, currentDotSize)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const stopAnimation = () => {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId)
        animFrameId = 0
      }
      if (frameTimerId) {
        window.clearTimeout(frameTimerId)
        frameTimerId = 0
      }
      lastTimestamp = 0
    }

    // The shader is drawn at ~30fps. Asking for an animation frame on every
    // display refresh and then discarding most of them meant waking the main
    // thread 120-240 times a second to do nothing; on a 144Hz screen four out
    // of five callbacks were thrown away. The next frame is now scheduled for
    // when it is actually due. Animation speed is unaffected because the
    // shader advances on measured elapsed time, not on frame count.
    const scheduleFrame = () => {
      // Fire the timer a vsync early: `requestAnimationFrame` still has to
      // wait for the next display refresh after it, and without this the
      // extra wait dragged the effective rate down to ~25fps.
      const delay = Math.max(0, nextFrameAt - performance.now() - VSYNC_BUDGET_MS)
      frameTimerId = window.setTimeout(() => {
        frameTimerId = 0
        animFrameId = requestAnimationFrame(loop)
      }, delay)
    }

    const loop = (timestamp: number) => {
      animFrameId = 0
      if (
        !isIntersecting ||
        isTransitioning ||
        document.hidden ||
        document.documentElement.hasAttribute("data-modal-open") ||
        isMobileScreen()
      ) {
        return
      }

      render(timestamp)
      nextFrameAt = Math.max(performance.now(), nextFrameAt) + FRAME_DURATION
      scheduleFrame()
    }

    const startAnimation = () => {
      if (
        !animFrameId &&
        !frameTimerId &&
        !reducedMotion &&
        isIntersecting &&
        !isTransitioning &&
        !document.hidden &&
        !isMobileScreen() &&
        isPageLoaded
      ) {
        nextFrameAt = performance.now()
        scheduleFrame()
      }
    }

    const resize = () => {
      if (isMobileScreen()) {
        stopAnimation()
        return
      }

      const width = container.clientWidth || window.innerWidth || 1
      const height = container.clientHeight || window.innerHeight || 1
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      render()
      if (!reducedMotion && isIntersecting && !document.hidden && isPageLoaded) {
        startAnimation()
      }
    }

    const updateColor = () => {
      refreshThemeUniforms()
      render()
    }

    const resizeObserver = new ResizeObserver(resize)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersecting = entry?.isIntersecting ?? false
      if (isIntersecting && isPageLoaded) startAnimation()
      else stopAnimation()
    })

    const classObserver = new MutationObserver(updateColor)

    const handleTransitionState = () => {
      isTransitioning =
        document.documentElement.hasAttribute("data-page-transitioning") ||
        document.documentElement.hasAttribute("data-theme-transition") ||
        document.documentElement.hasAttribute("data-modal-open")
      if (isTransitioning) stopAnimation()
      else if (isPageLoaded) startAnimation()
    }

    const transitionObserver = new MutationObserver(handleTransitionState)

    const handleVisibility = () => {
      if (document.hidden) stopAnimation()
      else if (isPageLoaded) startAnimation()
    }

    // Paint initial static frame immediately
    resize()
    render()

    resizeObserver.observe(container)
    intersectionObserver.observe(container)
    classObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    transitionObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-page-transitioning",
        "data-theme-transition",
        "data-modal-open",
      ],
    })

    document.addEventListener("visibilitychange", handleVisibility)
    document.addEventListener("modalstatechange", handleTransitionState)
    window.addEventListener("resize", resize, { passive: true })

    const handlePageLoad = () => {
      isPageLoaded = true
      if (!reducedMotion && !isMobileScreen()) {
        startAnimation()
      }
    }

    if (!isPageLoaded) {
      window.addEventListener("load", handlePageLoad, { once: true })
      // Fallback in case load already fired or takes too long
      const timer = window.setTimeout(handlePageLoad, 1500)
      onReady?.()

      return () => {
        window.clearTimeout(timer)
        stopAnimation()
        resizeObserver.disconnect()
        intersectionObserver.disconnect()
        classObserver.disconnect()
        transitionObserver.disconnect()
        document.removeEventListener("visibilitychange", handleVisibility)
        document.removeEventListener("modalstatechange", handleTransitionState)
        window.removeEventListener("resize", resize)
        window.removeEventListener("load", handlePageLoad)

        if (positionBuffer) gl.deleteBuffer(positionBuffer)
        if (vertShader) gl.deleteShader(vertShader)
        if (fragShader) gl.deleteShader(fragShader)
        if (program) gl.deleteProgram(program)
      }
    }

    handlePageLoad()
    onReady?.()

    return () => {
      stopAnimation()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      classObserver.disconnect()
      transitionObserver.disconnect()
      document.removeEventListener("visibilitychange", handleVisibility)
      document.removeEventListener("modalstatechange", handleTransitionState)
      window.removeEventListener("resize", resize)

      if (positionBuffer) gl.deleteBuffer(positionBuffer)
      if (vertShader) gl.deleteShader(vertShader)
      if (fragShader) gl.deleteShader(fragShader)
      if (program) gl.deleteProgram(program)
    }
  }, [
    color,
    onReady,
    opacity,
    patternDensity,
    patternScale,
    pixelSize,
    speed,
    resolvedTheme,
  ])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden select-none sm:block ${className}`}
    >
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  )
}
