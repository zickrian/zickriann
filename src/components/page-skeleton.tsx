import { cn } from "@/lib/utils"

/**
 * Route-level placeholder.
 *
 * Every route awaits GitHub data (the contributions feed on the home page, the
 * footer's social card everywhere), so navigation used to sit on the previous
 * page with no acknowledgement until the server was done. This holds the shape
 * of what is coming with the same ruled frame and grid rhythm, so the arrival
 * is a fill-in rather than a jump.
 */
export function PageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="-mt-px min-h-[50svh] border-x border-line max-md:border-x-0">
      <div className="border-y border-line p-2">
        <Bar className="h-10 w-full rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="flex flex-col gap-3 p-2">
            <Bar className="aspect-[2.05/1] w-full rounded-lg" />
            <Bar className="h-4 w-4/5" />
            <Bar className="h-3 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * `animate-pulse` is skipped under reduced motion - a grid of throbbing blocks
 * is exactly the kind of thing that setting exists to stop.
 */
function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-muted motion-reduce:animate-none",
        className
      )}
    />
  )
}
