"use client"

import { ChevronDownIcon, ChevronsUpDownIcon } from "lucide-react"
import { createContext, useContext, useState } from "react"

import { Collapsible as CollapsibleRoot } from "@/components/base/ui/collapsible"
import { cn } from "@/lib/utils"

type CollapsibleContextType = {
  open: boolean
}

const CollapsibleContext = createContext<CollapsibleContextType | null>(null)

const useCollapsible = () => {
  const context = useContext(CollapsibleContext)
  if (!context) {
    throw new Error(
      "Collapsible components must be used within a CollapsibleWithContext"
    )
  }
  return context
}

function CollapsibleWithContext({
  defaultOpen,
  open: controlledOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof CollapsibleRoot>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const open = controlledOpen ?? uncontrolledOpen

  return (
    <CollapsibleContext.Provider value={{ open }}>
      <CollapsibleRoot
        open={open}
        onOpenChange={(next) => {
          if (controlledOpen === undefined) {
            setUncontrolledOpen(next)
          }
          onOpenChange?.(next)
        }}
        {...props}
      />
    </CollapsibleContext.Provider>
  )
}

function CollapsibleChevronsIcon({
  className,
  ...props
}: Omit<React.ComponentProps<typeof ChevronsUpDownIcon>, "ref"> & {
  duration?: number
}) {
  const { open } = useCollapsible()
  return (
    <ChevronsUpDownIcon
      className={cn(
        "transition-transform duration-150 ease-out",
        open ? "rotate-180" : "rotate-0",
        className
      )}
      {...props}
    />
  )
}

function CollapsibleChevronDownIcon({
  className,
  ...props
}: Omit<React.ComponentProps<typeof ChevronDownIcon>, "ref"> & {
  duration?: number
}) {
  const { open } = useCollapsible()
  return (
    <ChevronDownIcon
      className={cn(
        "transition-transform duration-150 ease-out",
        open ? "rotate-180" : "rotate-0",
        className
      )}
      {...props}
    />
  )
}

export {
  CollapsibleWithContext as Collapsible,
  CollapsibleChevronDownIcon,
  CollapsibleChevronsIcon,
  useCollapsible,
}
