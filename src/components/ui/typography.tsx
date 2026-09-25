import { Slot } from "@radix-ui/react-slot"
import React from "react"

import { cn } from "@/lib/utils"

// NOTE: this component is NOT used by the chat widget. The chat renders
// markdown through its own <MarkdownRenderer /> because it needs custom
// handling for the ```widget contact-form block, which the typography plugin
// would swallow as a plain code block. Prose stays as the site-wide typography
// wrapper (MDX pages, project write-ups) and is left intentionally untouched.

function Prose({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="prose"
      className={cn(
        "prose max-w-none prose-portfolio prose-zinc dark:prose-invert",
        className
      )}
      {...props}
    />
  )
}

function ProseMono({
  className,
  ...props
}: React.ComponentProps<typeof Prose>) {
  return (
    <Prose
      className={cn("prose-sm font-mono text-foreground", className)}
      {...props}
    />
  )
}

function Code({ className, ...props }: React.ComponentProps<"code">) {
  const isCodeBlock = "data-language" in props

  return (
    <code
      data-slot={isCodeBlock ? "code-block" : "code-inline"}
      className={cn(!isCodeBlock && "not-prose code-inline", className)}
      {...props}
    />
  )
}

export { Code, Prose, ProseMono }
