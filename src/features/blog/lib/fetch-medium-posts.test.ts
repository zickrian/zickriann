import { describe, expect, it } from "vitest"

import { parseMediumRss } from "./fetch-medium-posts"

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Stories by Zickrian on Medium</title>
    <item>
      <title><![CDATA[How I Fine-Tuned IndoBERT]]></title>
      <link>https://medium.com/@zickriann/how-i-fine-tuned-indobert-abc123</link>
      <pubDate>Wed, 28 May 2025 09:00:00 GMT</pubDate>
      <guid isPermaLink="false">https://medium.com/p/abc123</guid>
      <category><![CDATA[AI]]></category>
      <category><![CDATA[Machine Learning]]></category>
      <content:encoded><![CDATA[
        <p>Intro paragraph.</p>
        <h3>Key takeaways from the project</h3>
        <p>Some detail here.</p>
        <img src="https://cdn-images-1.medium.com/max/1024/1*abc123.jpeg" />
      ]]></content:encoded>
    </item>
    <item>
      <title><![CDATA[Post Without Thumbnail]]></title>
      <link>https://medium.com/@zickriann/post-without-thumbnail-xyz789</link>
      <pubDate>Mon, 02 Jun 2025 08:00:00 GMT</pubDate>
      <guid isPermaLink="false">https://medium.com/p/xyz789</guid>
      <content:encoded><![CDATA[<p>No image in here.</p>]]></content:encoded>
    </item>
  </channel>
</rss>`

describe("parseMediumRss", () => {
  const posts = parseMediumRss(SAMPLE_XML)

  it("parses the expected number of posts", () => {
    expect(posts).toHaveLength(2)
  })

  it("extracts title, link, pubDate and guid", () => {
    expect(posts[0]).toMatchObject({
      title: "How I Fine-Tuned IndoBERT",
      link: "https://medium.com/@zickriann/how-i-fine-tuned-indobert-abc123",
      pubDate: "Wed, 28 May 2025 09:00:00 GMT",
      guid: "https://medium.com/p/abc123",
    })
  })

  it("builds the description stripped of html and truncated", () => {
    expect(posts[0].description).toBe(
      "Intro paragraph. Key takeaways from the project Some detail here."
    )
    expect(posts[0].description.length).toBeLessThanOrEqual(240)
  })

  it("downscales the 1024px Medium thumbnail to 256px", () => {
    expect(posts[0].thumbnail).toBe(
      "https://cdn-images-1.medium.com/max/256/1*abc123.jpeg"
    )
  })

  it("collects categories", () => {
    expect(posts[0].categories).toEqual(["AI", "Machine Learning"])
  })

  it("leaves thumbnail null when the post has no image", () => {
    expect(posts[1].thumbnail).toBeNull()
  })
})
