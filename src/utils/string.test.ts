import { describe, expect, it } from "vitest"

import { decodeEmail } from "./string"

describe("decodeEmail", () => {
  it("decodes a base64-encoded email address", () => {
    expect(decodeEmail("ZmlyZGF1c2tob3RpYnVsemlja3JpYW5AZ21haWwuY29t")).toBe(
      "firdauskhotibulzickrian@gmail.com"
    )
  })

  it("decodes the value stored in the USER data", () => {
    expect(
      decodeEmail("ZmlyZGF1c2tob3RpYnVsemlja3JpYW5AZ21haWwuY29t")
    ).toContain("@gmail.com")
  })
})
