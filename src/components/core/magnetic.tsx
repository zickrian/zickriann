import React from "react"

export const Magnetic = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode
    intensity?: number
    className?: string
  } & React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
})

Magnetic.displayName = "Magnetic"
