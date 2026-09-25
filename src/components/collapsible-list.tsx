import { ChevronDownIcon } from "lucide-react"
import React from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/base/ui/collapsible"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CollapsibleList<T>({
  items,
  max = 3,

  keyExtractor,
  renderItem,
}: {
  items: T[]
  max?: number

  keyExtractor?: (item: T) => string
  renderItem: (item: T) => React.ReactNode
}) {
  const hasMore = items.length > max

  return (
    <Collapsible className="group/collapsible">
      {items.slice(0, max).map((item, index) => {
        const isLast = !hasMore && index === items.length - 1
        return (
          <div
            key={
              typeof keyExtractor === "function" ? keyExtractor(item) : index
            }
            className={cn("border-b border-line", isLast && "border-b-0")}
          >
            {renderItem(item)}
          </div>
        )
      })}

      <CollapsibleContent>
        {items.slice(max).map((item, index) => (
          <div
            key={
              typeof keyExtractor === "function"
                ? keyExtractor(item)
                : max + index
            }
            className="border-b border-line"
          >
            {renderItem(item)}
          </div>
        ))}
      </CollapsibleContent>

      {hasMore && (
        <div className="flex h-12 items-center justify-center">
          {/* Styled with `buttonVariants` rather than `asChild` + <Button />.
              This is a server component, so an element handed to a client
              component's Slot crosses the RSC boundary - React may stream it as
              a lazy reference, which `Slot` rejects as not a single valid
              element ("Primitive.button failed to slot onto its children").
              Rendering the trigger's own <button> removes the Slot entirely. */}
          <CollapsibleTrigger
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "gap-2 pr-2.5 pl-3"
            )}
          >
            <span className="hidden group-data-closed/collapsible:block">
              Show more
            </span>

            <span className="hidden group-data-open/collapsible:block">
              Show less
            </span>

            <ChevronDownIcon className="group-data-open/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </div>
      )}
    </Collapsible>
  )
}
