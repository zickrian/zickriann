import { cn } from "@/lib/utils"

/**
 * Rises its children into place as they scroll into view.
 *
 * The motion is entirely in the `reveal` utility (globals.css) via
 * `animation-timeline: view()`, which is why this stays a plain server
 * component: no observer, no state, no client bundle, and nothing to hydrate.
 *
 * It previously rendered a bare `<div>` and animated nothing, so every call
 * site was paying for an abstraction that did not exist.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("reveal", className)}>{children}</div>
}
