/**
 * Re-export of the canonical Button component to keep import paths stable for
 * consumers that previously used @base-ui/react primitives. The unified Button
 * lives in @/components/ui/button.tsx and uses @radix-ui/react-slot for the
 * `asChild` composition pattern.
 */
export { Button, buttonVariants } from "@/components/ui/button"
