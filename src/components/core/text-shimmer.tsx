import { cn } from "@/lib/utils"

export function TextShimmer({
  children,
  className,
  duration = 1,
}: {
  children: React.ReactNode
  className?: string
  duration?: number
}) {
  return (
    <span
      className={cn(
        "inline-flex animate-[shimmer_linear_infinite] bg-[linear-gradient(110deg,#a3a3a3,45%,#262626,55%,#a3a3a3)] bg-[length:200%_100%] bg-clip-text text-transparent dark:bg-[linear-gradient(110deg,#737373,45%,#f5f5f5,55%,#737373)]",
        className
      )}
      style={{ animationDuration: `${duration * 2}s` }}
    >
      {children}
    </span>
  )
}
