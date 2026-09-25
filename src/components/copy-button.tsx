"use client"

import { CheckIcon, CopyIcon, XIcon } from "lucide-react"
import { useCallback, useState } from "react"

import { cn } from "@/lib/utils"

import { Button } from "./ui/button"

type CopyState = "idle" | "done" | "error"
type ButtonProps = React.ComponentProps<typeof Button>

export type CopyButtonProps = Omit<ButtonProps, "onCopy"> & {
  text: string | (() => string | Promise<string>)
  onCopySuccess?: (copiedValue: string) => void
  onCopyError?: (error: unknown) => void
  timeout?: number
}

export function CopyButton({
  className,
  text,
  onCopySuccess,
  onCopyError,
  timeout = 1500,
  size = "icon-sm",
  variant = "secondary",
  ...props
}: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle")

  const handleClick = useCallback(async () => {
    try {
      const value = typeof text === "function" ? await text() : text
      await navigator.clipboard.writeText(value)
      setState("done")
      onCopySuccess?.(value)
      window.setTimeout(() => setState("idle"), timeout)
    } catch (error) {
      setState("error")
      onCopyError?.(error)
      window.setTimeout(() => setState("idle"), timeout)
    }
  }, [text, onCopySuccess, onCopyError, timeout])

  return (
    <Button
      className={cn(className)}
      variant={variant}
      size={size}
      aria-label="Copy"
      onClick={handleClick}
      {...props}
    >
      {state === "idle" && <CopyIcon />}
      {state === "done" && <CheckIcon />}
      {state === "error" && <XIcon />}
    </Button>
  )
}
