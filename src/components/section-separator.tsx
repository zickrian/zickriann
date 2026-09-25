import { cn } from "@/lib/utils"

/** Diagonal ruled spacer that keeps the section rhythm. */
export function SectionSeparator({
  sides = true,
  className,
}: {
  sides?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative z-1 -mt-px flex h-8 w-full border border-line bg-card max-md:border-x-0",
        !sides && "border-x-0",
        "bg-[repeating-linear-gradient(135deg,var(--line)_0,var(--line)_1px,transparent_1px,transparent_8px)]",
        className
      )}
    />
  )
}
