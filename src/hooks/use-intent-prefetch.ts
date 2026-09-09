"use client"

import { useRouter } from "next/navigation"
import { useCallback, useRef } from "react"

/**
 * Spread onto a `<Link prefetch={false}>` to make navigation feel instant
 * without paying for it at load.
 *
 * `prefetch={false}` in the App Router opts out of prefetching entirely -
 * hover and touch included - so every project link was a cold round trip on
 * click. Viewport prefetching is not the answer either: the projects list
 * alone would pull thirteen route payloads while the page is still settling.
 * Fetching on the first pointer, touch or focus lands the payload during the
 * ~100 ms before the click and leaves an untouched page fetching nothing.
 */
export function useIntentPrefetch(href: string) {
  const router = useRouter()
  const prefetched = useRef(false)

  const prefetch = useCallback(() => {
    if (prefetched.current) return
    prefetched.current = true
    router.prefetch(href)
  }, [href, router])

  return {
    onPointerEnter: prefetch,
    onTouchStart: prefetch,
    onFocus: prefetch,
  }
}
