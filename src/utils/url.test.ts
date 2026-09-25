import { describe, expect, it } from "vitest"

import { addQueryParams, urlToName } from "./url"

describe("addQueryParams", () => {
  it("appends a single query param", () => {
    expect(
      addQueryParams("https://example.com/path", { utm_source: "zickrian" })
    ).toBe("https://example.com/path?utm_source=zickrian")
  })

  it("appends multiple params and merges with existing ones", () => {
    expect(
      addQueryParams("https://example.com/path?a=1", { b: "2", c: "3" })
    ).toBe("https://example.com/path?a=1&b=2&c=3")
  })

  it("overwrites an existing param", () => {
    expect(
      addQueryParams("https://example.com/path?utm_source=old", {
        utm_source: "zickrian",
      })
    ).toBe("https://example.com/path?utm_source=zickrian")
  })

  it("returns the input unchanged for an invalid URL", () => {
    const input = "not a url"
    expect(addQueryParams(input, { utm_source: "zickrian" })).toBe(input)
  })
})

describe("urlToName", () => {
  it("strips the protocol and slashes", () => {
    expect(urlToName("https://github.com/zickrian")).toBe("github.com/zickrian")
  })

  it("handles protocol-relative urls", () => {
    expect(urlToName("//example.com/x")).toBe("example.com/x")
  })
})
